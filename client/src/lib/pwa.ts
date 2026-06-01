/**
 * PWA utilities for service worker registration, push notifications, and install prompt
 */

declare global {
  interface Window {
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

/**
 * Register service worker for offline support
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('[PWA] Service Worker registered:', registration);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Request permission for push notifications
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration.pushManager) {
      console.log('[PWA] Push Manager not available');
      return null;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log('[PWA] Push subscription successful:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Push subscription failed:', error);
    return null;
  }
}

/**
 * Get existing push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('[PWA] Failed to get push subscription:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[PWA] Unsubscribed from push notifications');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Unsubscribe failed:', error);
    return false;
  }
}

/**
 * Send local notification (for testing)
 */
export async function sendLocalNotification(payload: PushNotificationPayload): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const options: NotificationOptions & { actions?: any[] } = {
      body: payload.body,
      icon: payload.icon || '/gigitekai-logo.jpg',
      badge: payload.badge || '/gigitekai-logo.jpg',
      tag: payload.tag || 'notification',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {},
    };
    if (payload.actions) {
      options.actions = payload.actions;
    }
    await registration.showNotification(payload.title, options);
  } catch (error) {
    console.error('[PWA] Failed to send notification:', error);
  }
}

/**
 * Check if app is installable
 */
export function isInstallable(): boolean {
  return 'beforeinstallprompt' in window;
}

/**
 * Handle install prompt
 */
export function setupInstallPrompt(onPromptReady?: (prompt: any) => void): void {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] Install prompt ready');
    onPromptReady?.(e);
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed');
    deferredPrompt = null;
  });
}

/**
 * Show install prompt
 */
export async function showInstallPrompt(): Promise<boolean> {
  const event = (window as any).deferredPrompt;
  if (!event) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  event.prompt();
  const { outcome } = await event.userChoice;
  console.log(`[PWA] User response: ${outcome}`);

  (window as any).deferredPrompt = null;
  return outcome === 'accepted';
}

/**
 * Check if running as PWA
 */
export function isRunningAsPWA(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Request periodic background sync
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Background sync registration failed:', error);
    return false;
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): any {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as any;
}

/**
 * Initialize PWA features
 */
export async function initializePWA(): Promise<void> {
  console.log('[PWA] Initializing PWA features...');

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    console.warn('[PWA] Service Worker registration failed');
    return;
  }

  // Setup install prompt
  setupInstallPrompt();

  // Request notification permission
  const permission = await requestNotificationPermission();
  console.log('[PWA] Notification permission:', permission);

  // Check if running as PWA
  const isPWA = isRunningAsPWA();
  console.log('[PWA] Running as PWA:', isPWA);

  // Log PWA status
  console.log('[PWA] Initialization complete');
}
