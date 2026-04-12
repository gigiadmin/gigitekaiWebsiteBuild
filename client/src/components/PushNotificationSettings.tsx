import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Push Notification Settings Component
 * Allows admins to enable/disable Web Push notifications
 */
export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [showSettings, setShowSettings] = useState(false);

  if (!isSupported) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-3">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-green-500" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium text-sm">Push Notifications</p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? 'Enabled - You will receive notifications'
                : 'Disabled - You will not receive notifications'}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isSubscribed ? 'destructive' : 'default'}
          onClick={handleToggle}
          disabled={isLoading}
          className="min-w-fit"
        >
          {isLoading ? 'Loading...' : isSubscribed ? 'Disable' : 'Enable'}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {permission === 'denied' && (
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-600">
            Notification permission denied. Please enable notifications in your browser settings.
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSettings(!showSettings)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showSettings ? 'Hide details' : 'Show details'}
      </button>

      {showSettings && (
        <div className="p-3 bg-muted/50 rounded-md text-xs space-y-2 text-muted-foreground">
          <p>
            <strong>What are push notifications?</strong> When enabled, you'll receive instant notifications
            on your device when new tickets, chat messages, or other important events occur—even when the
            app is closed.
          </p>
          <p>
            <strong>Privacy:</strong> Your notification preferences are stored securely. We never share your
            subscription data with third parties.
          </p>
          <p>
            <strong>Browser support:</strong> Push notifications work on modern browsers (Chrome, Firefox,
            Edge, Safari 16+).
          </p>
        </div>
      )}
    </div>
  );
}
