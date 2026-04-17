/**
 * ScheduledPostsCalendar
 * Month grid view of scheduled social posts.
 * - Navigate months with prev/next arrows
 * - Days with posts show colored platform dots
 * - Click a day with posts to see that day's posts panel
 * - Click an EMPTY day to open compose pre-filled with that date
 * - Drag a post to a new day to reschedule it (HTML5 DnD, no external lib)
 * - Quick-edit modal (pencil icon) to edit post content inline
 * - Cancel confirmation AlertDialog before removing a post
 */
import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, X, GripVertical, Pencil, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-500",
  twitter: "bg-sky-400",
  facebook: "bg-indigo-500",
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  scheduled: any[];
  onCancel: (id: number) => void;
  cancelPending?: boolean;
  /** Called when user clicks an empty day — parent should pre-fill compose with this date */
  onDraftFromDay?: (dateStr: string) => void;
}

export default function ScheduledPostsCalendar({ scheduled, onCancel, cancelPending, onDraftFromDay }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [confirmCancelPost, setConfirmCancelPost] = useState<any | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editContent, setEditContent] = useState("");
  const draggingPostId = useRef<number | null>(null);

  const utils = trpc.useUtils();
  const rescheduleMutation = trpc.social.reschedulePost.useMutation({
    onSuccess: () => utils.social.getScheduled.invalidate(),
  });
  const updateMutation = trpc.social.updateScheduledPost.useMutation({
    onSuccess: () => {
      utils.social.getScheduled.invalidate();
      setEditingPost(null);
    },
  });

  function openQuickEdit(post: any) {
    setEditingPost(post);
    setEditContent(post.content ?? "");
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // 42-cell grid (6 rows × 7 cols)
  const cells: (number | null)[] = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstDayOfWeek + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  // Group posts by day number for this month/year
  const postsByDay: Record<number, any[]> = {};
  for (const post of scheduled ?? []) {
    if (!post.scheduledAt) continue;
    const d = new Date(post.scheduledAt);
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate();
      postsByDay[day] = [...(postsByDay[day] ?? []), post];
    }
  }

  const selectedPosts = selectedDay ? (postsByDay[selectedDay] ?? []) : [];

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  function handleDrop(targetDay: number) {
    const postId = draggingPostId.current;
    if (!postId) return;
    // Find the post to preserve its time-of-day
    const post = scheduled.find(p => p.id === postId);
    if (!post) return;
    const originalDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
    const newDate = new Date(viewYear, viewMonth, targetDay,
      originalDate.getHours(), originalDate.getMinutes(), 0, 0);
    rescheduleMutation.mutate({ id: postId, scheduledAt: newDate.getTime() });
    setDragOverDay(null);
    draggingPostId.current = null;
    // Update selected day to show the moved post
    setSelectedDay(targetDay);
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {monthLabel}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-600 text-center">
        Drag a post to reschedule · Click empty day to draft · Click post day to manage
      </p>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs text-gray-600 font-medium py-1">
            {d}
          </div>
        ))}

        {/* Calendar cells */}
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear();
          const hasPosts = !!postsByDay[day]?.length;
          const isSelected = selectedDay === day;
          const isDragTarget = dragOverDay === day;
          const rawPlatforms = (postsByDay[day] ?? []).map((p: any) => {
            try { return JSON.parse(p.platforms ?? "[]")[0] ?? p.platform; }
            catch { return p.platform as string; }
          });
          const platforms = Array.from(new Set(rawPlatforms));

          return (
            <button
              key={idx}
              onClick={() => {
                if (!hasPosts && onDraftFromDay) {
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  onDraftFromDay(dateStr);
                } else {
                  setSelectedDay(isSelected ? null : day);
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOverDay(day); }}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={(e) => { e.preventDefault(); handleDrop(day); }}
              title={!hasPosts ? "Click to draft a post for this day" : undefined}
              className={`relative flex flex-col items-center justify-start pt-1 pb-1.5 rounded-lg min-h-[44px] transition-all text-sm group
                ${isDragTarget ? "bg-cyan-500/30 border-2 border-cyan-400 scale-105" :
                  isSelected ? "bg-cyan-500/20 border border-cyan-500/50" :
                  hasPosts ? "bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/60" :
                  "hover:bg-gray-800/40 border border-transparent hover:border-gray-700/40"}
                ${isToday ? "ring-1 ring-cyan-500/70" : ""}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? "text-cyan-400" : hasPosts ? "text-white" : "text-gray-500"}`}>
                {day}
              </span>
              {hasPosts ? (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {platforms.slice(0, 3).map((pid: any, pi: number) => (
                    <span
                      key={pi}
                      className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[pid] ?? "bg-gray-500"}`}
                    />
                  ))}
                </div>
              ) : (
                <Plus className="w-2.5 h-2.5 text-gray-700 group-hover:text-gray-500 mt-0.5 transition-colors" />
              )}
              {isDragTarget && (
                <span className="absolute inset-0 flex items-center justify-center text-cyan-400 text-xs font-bold pointer-events-none">
                  +
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day posts */}
      {selectedDay && (
        <div className="border border-cyan-500/20 rounded-xl bg-[#0A0E1A]/60 p-4 space-y-3">
          <h4 className="text-cyan-400 text-sm font-semibold flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric",
            })}
            <span className="text-gray-500 font-normal">({selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""})</span>
          </h4>
          {selectedPosts.length === 0 ? (
            <p className="text-gray-500 text-xs">No posts scheduled for this day.</p>
          ) : (
            selectedPosts.map((post: any) => {
              let platforms: string[] = [];
              try { platforms = JSON.parse(post.platforms ?? "[]"); } catch { platforms = [post.platform]; }
              return (
                <div
                  key={post.id}
                  draggable
                  onDragStart={(e) => {
                    draggingPostId.current = post.id;
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("postId", String(post.id));
                  }}
                  onDragEnd={() => { draggingPostId.current = null; setDragOverDay(null); }}
                  className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3 cursor-grab active:cursor-grabbing group"
                >
                  {/* Drag handle */}
                  <GripVertical className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 mt-0.5 shrink-0 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {platforms.map((pid) => (
                        <span
                          key={pid}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            pid === "linkedin" ? "bg-blue-900/50 text-blue-300" :
                            pid === "twitter" ? "bg-sky-900/50 text-sky-300" :
                            "bg-indigo-900/50 text-indigo-300"
                          }`}
                        >
                          {pid}
                        </span>
                      ))}
                      <span className="text-gray-500 text-xs ml-1">
                        {new Date(post.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">{post.content}</p>
                  </div>
                  {/* Quick-edit button */}
                  <button
                    onClick={() => openQuickEdit(post)}
                    className="text-gray-500 hover:text-cyan-400 p-1 rounded hover:bg-cyan-900/20 transition-colors shrink-0"
                    title="Edit post content"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {/* Cancel button */}
                  <button
                    onClick={() => setConfirmCancelPost(post)}
                    disabled={cancelPending}
                    className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20 transition-colors shrink-0"
                    title="Cancel this post"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reschedule status */}
      {rescheduleMutation.isPending && (
        <p className="text-xs text-cyan-400 text-center animate-pulse">Rescheduling post...</p>
      )}

      {/* Quick-edit dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => { if (!open) setEditingPost(null); }}>
        <DialogContent className="bg-[#141B2D] border border-gray-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Pencil className="w-4 h-4 text-cyan-400" /> Edit Scheduled Post
            </DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">
                Scheduled for{" "}
                <span className="text-cyan-400">
                  {new Date(editingPost.scheduledAt).toLocaleString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </span>
              </div>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={5}
                className="bg-[#0A0E1A] border-gray-700 text-white resize-none focus:border-cyan-500/50"
                placeholder="Post content..."
              />
              <div className="text-xs text-gray-600 text-right">{editContent.length} chars</div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPost(null)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingPost && editContent.trim()) {
                  updateMutation.mutate({ id: editingPost.id, content: editContent.trim() });
                }
              }}
              disabled={!editContent.trim() || updateMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-400 text-[#0A0E1A] font-bold"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!confirmCancelPost} onOpenChange={(open) => { if (!open) setConfirmCancelPost(null); }}>
        <AlertDialogContent className="bg-[#141B2D] border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Scheduled Post?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {confirmCancelPost && (
                <>
                  Scheduled for{" "}
                  <span className="text-cyan-400 font-medium">
                    {new Date(confirmCancelPost.scheduledAt).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                  </span>
                  . The post will be moved to Drafts.
                  <blockquote className="mt-2 text-xs text-gray-500 border-l-2 border-gray-700 pl-2 line-clamp-3">
                    {confirmCancelPost.content}
                  </blockquote>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Keep Scheduled
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmCancelPost) {
                  onCancel(confirmCancelPost.id);
                  setConfirmCancelPost(null);
                  setSelectedDay(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
