/**
 * ScheduledPostsCalendar
 * Month grid view of scheduled social posts.
 * - Navigate months with prev/next arrows
 * - Days with posts show colored platform dots
 * - Click a day to see that day's posts with Cancel buttons
 */
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
}

export default function ScheduledPostsCalendar({ scheduled, onCancel, cancelPending }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
          const rawPlatforms = (postsByDay[day] ?? []).map((p: any) => {
            try { return JSON.parse(p.platforms ?? "[]")[0] ?? p.platform; }
            catch { return p.platform as string; }
          });
          const platforms = Array.from(new Set(rawPlatforms));

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative flex flex-col items-center justify-start pt-1 pb-1.5 rounded-lg min-h-[44px] transition-colors text-sm
                ${isSelected ? "bg-cyan-500/20 border border-cyan-500/50" : hasPosts ? "bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/60" : "hover:bg-gray-800/40 border border-transparent"}
                ${isToday ? "ring-1 ring-cyan-500/70" : ""}
              `}
            >
              <span className={`text-xs font-medium ${isToday ? "text-cyan-400" : hasPosts ? "text-white" : "text-gray-500"}`}>
                {day}
              </span>
              {hasPosts && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {platforms.slice(0, 3).map((pid: any, pi: number) => (
                    <span
                      key={pi}
                      className={`w-1.5 h-1.5 rounded-full ${PLATFORM_COLORS[pid] ?? "bg-gray-500"}`}
                    />
                  ))}
                </div>
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
                <div key={post.id} className="flex items-start gap-3 bg-gray-800/40 rounded-lg p-3">
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
                  <button
                    onClick={() => onCancel(post.id)}
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
    </div>
  );
}
