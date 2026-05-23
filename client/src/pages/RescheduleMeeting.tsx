/**
 * Reschedule Meeting Page
 * Accessed via unique token link in confirmation email
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Calendar, Clock } from "lucide-react";

export default function RescheduleMeeting() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [newDateDisplay, setNewDateDisplay] = useState("");
  const [newTimeDisplay, setNewTimeDisplay] = useState("");

  // Get booking details
  const { data: booking, isLoading, error } = trpc.calendar.getBookingByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  // Get available dates
  const { data: datesData } = trpc.calendar.getAvailableDates.useQuery(undefined, { enabled: !!token });

  // Get available slots for selected date
  const { data: slotsData } = trpc.calendar.getAvailableSlots.useQuery(
    { date: newDate },
    { enabled: !!newDate }
  );

  const rescheduleMutation = trpc.calendar.rescheduleMeeting.useMutation({
    onSuccess: (data) => {
      setNewDateDisplay(formatDate(data.newDate));
      setNewTimeDisplay(formatTime(data.newTime));
      setConfirmed(true);
    },
  });

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour}:${String(m).padStart(2, "0")} ${ampm} EST`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const formatDateShort = (date: string) => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // PST/GMT equivalents for time slots
  const timeEquivalents: Record<string, string> = {
    "11:00": "8:00 AM PST / 4:00 PM GMT",
    "11:30": "8:30 AM PST / 4:30 PM GMT",
    "12:00": "9:00 AM PST / 5:00 PM GMT",
    "12:30": "9:30 AM PST / 5:30 PM GMT",
    "13:00": "10:00 AM PST / 6:00 PM GMT",
    "13:30": "10:30 AM PST / 6:30 PM GMT",
    "14:00": "11:00 AM PST / 7:00 PM GMT",
    "14:30": "11:30 AM PST / 7:30 PM GMT",
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400">This reschedule link is invalid or has expired.</p>
          <a href="https://gigitekai.com" className="mt-6 inline-block text-[#00d4ff] hover:underline">Return to GigitekAI</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-400">This reschedule link is invalid or has already been used.</p>
          <a href="https://gigitekai.com" className="mt-6 inline-block text-[#00d4ff] hover:underline">Return to GigitekAI</a>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Meeting Already Cancelled</h1>
          <p className="text-gray-400 mb-6">This meeting has been cancelled and cannot be rescheduled.</p>
          <a href="https://gigitekai.com" className="inline-block bg-[#00d4ff] text-[#0a0e1a] font-bold px-6 py-3 rounded-lg hover:bg-[#00b8d9] transition-colors">
            Book a New Call
          </a>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Meeting Rescheduled!</h1>
          <p className="text-gray-400 mb-4">
            Your strategy call has been rescheduled to:
          </p>
          <div className="bg-[#111827] border border-[#00d4ff]/30 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">New Date</span>
              <span className="text-white font-medium">{newDateDisplay}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New Time</span>
              <span className="text-white font-medium">{newTimeDisplay}</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-6">A confirmation email has been sent to {booking.email}.</p>
          <a href="https://gigitekai.com" className="inline-block text-[#00d4ff] hover:underline text-sm">
            Return to GigitekAI
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[#00d4ff] text-3xl font-bold mb-1">GigitekAI</div>
          <div className="text-gray-500 text-sm">Powering the Next Generation of Enterprise Technology</div>
        </div>

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-white">Reschedule Strategy Call</h1>
          </div>
          <p className="text-gray-500 text-sm mb-6">Select a new date and time for your call.</p>

          {/* Current Meeting */}
          <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Current Booking</div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Date</span>
              <span className="text-white">{formatDate(booking.meetingDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="text-white">{formatTime(booking.meetingTime)}</span>
            </div>
          </div>

          {/* Timezone notice */}
          <div className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-lg p-3 mb-5 flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#00d4ff] mt-0.5 flex-shrink-0" />
            <p className="text-[#00d4ff] text-xs">All times are Eastern Standard Time (EST / UTC-5). Please convert to your local timezone.</p>
          </div>

          {/* New Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              New Date <span className="text-gray-500 text-xs">(Mon, Wed & Fri only)</span>
            </label>
            <select
              value={newDate}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(""); }}
              className="w-full bg-[#0a0e1a] border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00d4ff]"
            >
              <option value="">Select a date</option>
              {datesData?.dates.map((d) => (
                <option key={d} value={d}>{formatDateShort(d)}</option>
              ))}
            </select>
          </div>

          {/* New Time */}
          {newDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                New Time <span className="text-[#00d4ff] text-xs">(Eastern Time — EST)</span>
              </label>
              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#00d4ff]"
              >
                <option value="">Choose a time slot (EST)</option>
                {slotsData?.slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTime(slot)} — {timeEquivalents[slot] || ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rescheduleMutation.error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg p-3 mb-4">
              {rescheduleMutation.error.message}
            </div>
          )}

          <div className="flex gap-3">
            <a
              href="https://gigitekai.com"
              className="flex-1 text-center bg-transparent border border-gray-600 text-gray-400 font-medium px-4 py-2.5 rounded-lg hover:border-gray-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </a>
            <Button
              onClick={() => rescheduleMutation.mutate({ token, newDate, newTime })}
              disabled={!newDate || !newTime || rescheduleMutation.isPending}
              className="flex-1 bg-[#00d4ff] hover:bg-[#00b8d9] text-[#0a0e1a] font-bold"
            >
              {rescheduleMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Rescheduling...</>
              ) : (
                "Confirm Reschedule"
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Questions? Call <a href="tel:727-382-6909" className="text-[#00d4ff]">(727) 382-6909</a> or email{" "}
          <a href="mailto:support@gigitekai.com" className="text-[#00d4ff]">support@gigitekai.com</a>
        </p>
      </div>
    </div>
  );
}
