import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface TicketAssignedNotification {
  type: "ticket_assigned_notification";
  data: {
    type: "ticket_assigned";
    ticketId: number;
    subject: string;
    priority: string;
    status: string;
    timestamp: Date;
    assignedAgentId?: number;
    assignedAgentName?: string;
  };
}

/**
 * Hook to listen for real-time ticket assignment notifications via WebSocket
 * Plays sound alert and shows toast notification when ticket is assigned to current user
 */
export function useTicketAssignmentNotification() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      // Subscribe to ticket assignments
      wsRef.current?.send(
        JSON.stringify({
          type: "subscribe_tickets",
          userId: user.id,
          role: user.role || "user",
        })
      );
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as TicketAssignedNotification;

        if (message.type === "ticket_assigned_notification") {
          const { data } = message;

          // Play notification sound
          playNotificationSound();

          // Show toast notification
          toast.success(`New Ticket Assigned: #${data.ticketId}`, {
            description: `${data.subject} (${data.priority} priority)`,
            duration: 5000,
            action: {
              label: "View",
              onClick: () => {
                window.location.href = `/admin/tickets/${data.ticketId}`;
              },
            },
          });

          // Show browser notification if permitted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Ticket #${data.ticketId} Assigned`, {
              body: data.subject,
              icon: "/favicon.ico",
              tag: `ticket-${data.ticketId}`,
            });
          }
        }
      } catch (error) {
        console.error("[Ticket Assignment] Failed to parse WebSocket message:", error);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("[Ticket Assignment] WebSocket error:", error);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user]);

  /**
   * Play notification sound using Web Audio API
   */
  const playNotificationSound = () => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // 800 Hz beep
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("[Ticket Assignment] Failed to play notification sound:", error);
    }
  };

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return { requestNotificationPermission };
}
