import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { Star, CheckCircle } from "lucide-react";

export default function TicketFeedback() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [rating, setRating] = useState<"1" | "2" | "3" | "4" | "5" | null>(null);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.feedback.submitFeedback.useMutation();

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Please log in to submit feedback</p>
        <Button onClick={() => setLocation("/")}>Back to Home</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId || !rating) {
      alert("Please select a ticket and rating");
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        ticketId,
        rating,
        comment: comment || undefined,
        wouldRecommend: wouldRecommend || undefined,
      });
      setSubmitted(true);
      setTimeout(() => setLocation("/helpdesk/dashboard"), 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-slate-400 mb-4">Your feedback has been submitted successfully.</p>
          <p className="text-slate-500 text-sm">Redirecting to dashboard...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Share Your Feedback</h1>
          <p className="text-slate-400">Help us improve our support services</p>
        </div>

        <Card className="bg-slate-800 border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ticket ID */}
            <div>
              <label className="block text-white font-semibold mb-2">Ticket ID *</label>
              <input
                type="number"
                value={ticketId || ""}
                onChange={(e) => setTicketId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Enter ticket number"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-white font-semibold mb-3">How would you rate your support experience? *</label>
              <div className="flex gap-3">
                {(["1", "2", "3", "4", "5"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRating(r)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-[opacity,transform] ${
                      rating === r
                        ? "bg-cyan-500 text-white"
                        : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                    }`}
                  >
                    <Star className="w-6 h-6 mb-1" fill={rating === r ? "currentColor" : "none"} />
                    <span className="text-xs">{r} Star</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-white font-semibold mb-3">Would you recommend our services?</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`px-6 py-2 rounded-lg transition-[opacity,transform] ${
                    wouldRecommend === true
                      ? "bg-green-500 text-white"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`px-6 py-2 rounded-lg transition-[opacity,transform] ${
                    wouldRecommend === false
                      ? "bg-red-500 text-white"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-white font-semibold mb-2">Additional Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what we can improve..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={submitFeedback.isPending}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 rounded-lg"
              >
                {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
              <Button
                type="button"
                onClick={() => setLocation("/helpdesk/dashboard")}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
