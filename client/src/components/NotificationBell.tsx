/**
 * NotificationBell — Admin portal real-time alert bell
 *
 * Strategy:
 *  1. Polls getUnreadCount every 15 s for the badge number (lightweight).
 *  2. Opens a WebSocket connection to /api/ws and listens for
 *     `admin_notification` events for instant delivery.
 *  3. On bell click, fetches the full list and shows a dropdown panel.
 *  4. Clicking a notification marks it read and navigates to its href.
 *  5. "Mark all read" clears the badge immediately via optimistic update.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Bell, X, Ticket, MessageSquare, CheckCheck, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AdminNotification {
  id: number;
  type: string;
  title: string;
  body?: string | null;
  href?: string | null;
  priority: string;
  isRead: boolean;
  createdAt: Date | string;
}

// ── Icon map ──────────────────────────────────────────────────────────────────
function NotifIcon({ type, priority }: { type: string; priority: string }) {
  if (type === "new_ticket" || type === "ticket_reply") {
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          priority === "critical"
            ? "bg-red-500/20 text-red-400"
            : priority === "high"
            ? "bg-orange-500/20 text-orange-400"
            : "bg-cyan-500/20 text-cyan-400"
        }`}
      >
        <Ticket size={14} />
      </div>
    );
  }
  if (type === "new_chat" || type === "chat_message") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20 text-purple-400">
        <MessageSquare size={14} />
      </div>
    );
  }
  if (priority === "critical") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-red-500/20 text-red-400">
        <AlertTriangle size={14} />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-600/40 text-slate-400">
      <Info size={14} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [wsUnread, setWsUnread] = useState(0); // extra count from WS events
  const panelRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── tRPC queries & mutations ───────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: unreadNotifications = [], refetch: refetchCount } =
    trpc.adminNotifications.getUnread.useQuery(undefined, {
      refetchInterval: 15_000,
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: allNotifications = [], refetch: refetchList } =
    trpc.adminNotifications.getAll.useQuery(
      { limit: 30, offset: 0 },
      { enabled: open && isAuthenticated && user?.role === "admin" }
    );

  const markRead = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.adminNotifications.getUnread.invalidate();
      utils.adminNotifications.getAll.invalidate();
    },
  });

  const markAllRead = trpc.adminNotifications.markAllAsRead.useMutation({
    onMutate: async () => {
      // Optimistic: zero out badge immediately
      await utils.adminNotifications.getUnread.cancel();
      utils.adminNotifications.getUnread.setData(undefined, []);
      setWsUnread(0);
    },
    onSettled: () => {
      utils.adminNotifications.getUnread.invalidate();
      utils.adminNotifications.getAll.invalidate();
    },
  });

  // ── WebSocket: listen for admin_notification events ───────────────────────
  const connectWs = useCallback(() => {
    if (!isAuthenticated || user?.role !== "admin") return;
    if (wsRef.current && wsRef.current.readyState < 2) return; // already open/connecting

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", userId: user.id, role: "admin" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "admin_notification") {
          // Increment badge and refetch count
          setWsUnread((prev) => prev + 1);
          refetchCount();
          // If panel is open, also refresh the list
          if (open) refetchList();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Reconnect after 5 s
      setTimeout(connectWs, 5_000);
    };
  }, [isAuthenticated, user, open, refetchCount, refetchList]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // ── Close panel on outside click ──────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleNotifClick(notif: AdminNotification) {
    if (!notif.isRead) {
      markRead.mutate({ notificationId: notif.id });
    }
    setOpen(false);
    if (notif.href) navigate(notif.href);
  }

  const unreadCount = Array.isArray(unreadNotifications) ? unreadNotifications.filter((n: any) => !n.isRead).length : 0;
  const notifications = Array.isArray(allNotifications) ? allNotifications : [];

  // Portal access requests pending count
  const { data: portalPendingCount = 0 } = trpc.portalAccess.pendingCount.useQuery(undefined, {
    refetchInterval: 30_000,
    enabled: isAuthenticated && user?.role === "admin",
  });

  const totalUnread = unreadCount + wsUnread + (typeof portalPendingCount === 'number' ? portalPendingCount : 0);
  const displayCount = totalUnread > 99 ? "99+" : totalUnread;

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-white relative"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${totalUnread > 0 ? ` (${displayCount} unread)` : ""}`}
      >
        <Bell size={16} />
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-cyan-500 text-[10px] font-bold text-slate-900 rounded-full flex items-center justify-center leading-none">
            {displayCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-cyan-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {totalUnread > 0 && (
                <Badge className="bg-cyan-500 text-slate-900 text-[10px] px-1.5 py-0 h-4">
                  {displayCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {totalUnread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-slate-400 hover:text-white"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  <CheckCheck size={12} className="mr-1" />
                  All read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-500 hover:text-white"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
              >
                <X size={12} />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Bell size={24} className="mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif: AdminNotification) => (
                <button
                  key={notif.id}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 ${
                    !notif.isRead ? "bg-slate-700/30" : ""
                  }`}
                  onClick={() => handleNotifClick(notif)}
                >
                  <NotifIcon type={notif.type} priority={notif.priority} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-medium leading-tight ${
                          !notif.isRead ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    {notif.body && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-700 text-center">
              <button
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/notifications");
                }}
              >
                View all in Notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
