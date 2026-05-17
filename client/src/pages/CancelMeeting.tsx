/**
 * Cancel Meeting Page
 * Accessed via unique token link in confirmation email
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Calendar } from "lucide-react";

export default function CancelMeeting() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") || "";

  const [confirmed, setConfirmed] = useState(false);

  // Get booking details
  const { data: booking, isLoading, error } = trpc.calendar.getBookingByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const cancelMutation = trpc.calendar.cancelMeeting.useMutation({
    onSuccess: () => setConfirmed(true),
  });

  // Format time for display
  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h >= 12 ? "PM" : "AM";
    return `${hour}:${String(m).padStart(2, "0")} ${ampm} EST`;
  };

  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-gray-400">This cancel link is invalid or has expired.</p>
          <a href="https://gigitekai.com" className="mt-6 inline-block text-[#00d4ff] hover:underline">
            Return to GigitekAI
          </a>
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
          <p className="text-gray-400">This cancel link is invalid or has already been used.</p>
          <a href="https://gigitekai.com" className="mt-6 inline-block text-[#00d4ff] hover:underline">
            Return to GigitekAI
          </a>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled" || confirmed) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Meeting Cancelled</h1>
          <p className="text-gray-400 mb-6">
            Your strategy call has been cancelled. A confirmation email has been sent to {booking.email}.
          </p>
          <p className="text-gray-500 text-sm mb-6">We hope to connect with you in the future.</p>
          <a
            href="https://gigitekai.com"
            className="inline-block bg-[#00d4ff] text-[#0a0e1a] font-bold px-6 py-3 rounded-lg hover:bg-[#00b8d9] transition-colors"
          >
            Book a New Call
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      {/* Header */}
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-[#00d4ff] text-3xl font-bold mb-1">GigitekAI</div>
          <div className="text-gray-500 text-sm">Powering the Next Generation of Enterprise Technology</div>
        </div>

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[#00d4ff]" />
            <h1 className="text-xl font-bold text-white">Cancel Strategy Call</h1>
          </div>

          <p className="text-gray-400 text-sm mb-6">
            You're about to cancel the following strategy call. This action cannot be undone.
          </p>

          {/* Meeting Details */}
          <div className="bg-[#0a0e1a] border border-gray-700 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name</span>
                <span className="text-white font-medium">{booking.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-white font-medium">{formatDate(booking.meetingDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time</span>
                <span className="text-white font-medium">{formatTime(booking.meetingTime)}</span>
              </div>
              {booking.company && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Company</span>
                  <span className="text-white font-medium">{booking.company}</span>
                </div>
              )}
            </div>
          </div>

          {cancelMutation.error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg p-3 mb-4">
              {cancelMutation.error.message}
            </div>
          )}

          <div className="flex gap-3">
            <a
              href="https://gigitekai.com"
              className="flex-1 text-center bg-transparent border border-gray-600 text-gray-400 font-medium px-4 py-2.5 rounded-lg hover:border-gray-400 hover:text-white transition-colors text-sm"
            >
              Keep Meeting
            </a>
            <Button
              onClick={() => cancelMutation.mutate({ token })}
              disabled={cancelMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
            >
              {cancelMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cancelling...</>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Questions? Call <a href="tel:7273826909" className="text-[#00d4ff]">(727) 382-6909</a> or email{" "}
          <a href="mailto:support@gigitekai.com" className="text-[#00d4ff]">support@gigitekai.com</a>
        </p>
      </div>
    </div>
  );
}
