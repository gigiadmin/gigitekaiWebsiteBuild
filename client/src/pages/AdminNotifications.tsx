import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Mail, MessageSquare, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";


export default function AdminNotifications() {
  const [filter, setFilter] = useState<"all" | "contact" | "lead" | "ticket">("all");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mock notifications for demonstration - in production these would come from the backend
  useEffect(() => {
    // Placeholder: These would be fetched from trpc.system.getNotifications in production
    // For now, showing empty state
    setNotifications([]);
  }, []);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    if (filter === "contact") return notif.title?.includes("Contact");
    if (filter === "lead") return notif.title?.includes("Lead");
    if (filter === "ticket") return notif.title?.includes("Ticket");
    return true;
  });

  const getNotificationIcon = (title: string) => {
    if (title.includes("Contact")) return <Mail className="w-5 h-5 text-blue-400" />;
    if (title.includes("Lead")) return <MessageSquare className="w-5 h-5 text-cyan-400" />;
    if (title.includes("Ticket")) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <Bell className="w-5 h-5 text-gray-400" />;
  };

  const getNotificationBadgeColor = (title: string) => {

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };
    if (title.includes("Contact")) return "bg-blue-500/20 text-blue-300";

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };
    if (title.includes("Lead")) return "bg-cyan-500/20 text-cyan-300";

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };
    if (title.includes("Ticket")) return "bg-yellow-500/20 text-yellow-300";

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };
    return "bg-gray-500/20 text-gray-300";

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };
  };

  // Swipe gesture handling
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);
  const [swipedIndices, setSwipedIndices] = useState<Set<number>>(new Set());

  const handleTouchStart = (e: React.TouchEvent, idx: number) => {
    setSwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent, idx: number) => {
    if (!swipeStart) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = swipeStart.x - endX;
    const diffY = Math.abs(swipeStart.y - endY);

    if (diffX > 50 && diffY < 20) {
      setSwipedIndices(new Set([...swipedIndices, idx]));
      setTimeout(() => {
        setNotifications(notifications.filter((_, i) => i !== idx));
      }, 300);
    }
    setSwipeStart(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0E1A]/95 backdrop-blur border-b border-[rgba(0,212,255,0.1)] py-4">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#00D4FF]" />
              <h1 className="text-3xl font-bold">Notifications</h1>
            </div>
            <div className="text-sm text-gray-400">
              {filteredNotifications.length} alert{filteredNotifications.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["all", "contact", "lead", "ticket"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-[#00D4FF] text-[#0A0E1A]"
                    : "bg-[#1A1F2E] text-gray-300 hover:bg-[#252B3A]"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {filteredNotifications.length === 0 ? (
          <Card onTouchStart={(e) => handleTouchStart(e, idx)} onTouchEnd={(e) => handleTouchEnd(e, idx)} className="bg-[#1A1F2E] border-[rgba(0,212,255,0.1)] p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-gray-400">No notifications to display. Check back later.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notif, idx) => (
              <Card
                key={idx}
                onTouchStart={(e) => handleTouchStart(e, idx)} onTouchEnd={(e) => handleTouchEnd(e, idx)} className="bg-[#1A1F2E] border-[rgba(0,212,255,0.1)] hover:border-[rgba(0,212,255,0.3)] transition-all p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notif.title)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white break-words">{notif.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getNotificationBadgeColor(notif.title)}`}>
                        {notif.title.includes("Contact")
                          ? "Contact"
                          : notif.title.includes("Lead")
                          ? "Lead"
                          : notif.title.includes("Ticket")
                          ? "Ticket"
                          : "Alert"}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap break-words">
                      {notif.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {notif.createdAt
                          ? new Date(notif.createdAt).toLocaleString()
                          : "Just now"}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => {
                          // Delete notification
                          setNotifications((prev) => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
