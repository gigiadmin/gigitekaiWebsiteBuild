import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Hook to manage Web Push notifications subscription
 * Handles subscription, unsubscription, and permission requests
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const subscribeMutation = trpc.webPush.subscribe.useMutation();
  const unsubscribeMutation = trpc.webPush.unsubscribe.useMutation();
  const getSubscriptionsMutation = trpc.webPush.getSubscriptions.useQuery();

  // Check if browser supports Web Push
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Check existing subscriptions
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('[Push] Failed to check subscription:', err);
    }
  };

  const subscribe = async () => {
    if (!isSupported) {
      setError('Web Push is not supported in this browser');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);

        if (result !== 'granted') {
          setError('Notification permission denied');
          setIsLoading(false);
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Read VAPID public key from Vite environment (must use import.meta.env in browser)
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

      if (!vapidPublicKey) {
        setError('VAPID public key not configured');
        setIsLoading(false);
        return false;
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
      });

      // Send subscription to server
      const subscriptionJSON = subscription.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        auth: (subscriptionJSON.keys?.auth as string) || '',
        p256Dh: (subscriptionJSON.keys?.p256dh as string) || '',
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      setError(errorMessage);
      console.error('[Push] Subscription failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });

        await subscription.unsubscribe();
        setIsSubscribed(false);
        return true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
      setError(errorMessage);
      console.error('[Push] Unsubscription failed:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
