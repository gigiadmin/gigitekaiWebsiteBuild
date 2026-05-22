import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number;
  ticketTitle: string;
}

export function SurveyModal({ isOpen, onClose, ticketId, ticketTitle }: SurveyModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitSurveyMutation = trpc.helpdeskSurvey.submitSurvey.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setSubmitted(true);
      setTimeout(() => {
        setRating(null);
        setComment("");
        setSubmitted(false);
        onClose();
      }, 1500);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit survey");
    },
  });

  const handleSubmit = () => {
    if (!rating) {
      toast.error("Please select a rating");
      return;
    }
    submitSurveyMutation.mutate({
      ticketId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  const handleClose = () => {
    if (!submitted && !submitSurveyMutation.isPending) {
      setRating(null);
      setComment("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#141B2D] border border-gray-800 rounded-xl shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-bold">Rate Your Support Experience</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-1">
            Your feedback helps us improve our support quality
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <div className="space-y-5 py-4">
            {/* Ticket Info */}
            <div className="bg-[#0A0E1A]/60 border border-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Ticket</p>
              <p className="text-sm text-gray-300 truncate">{ticketTitle}</p>
            </div>

            {/* Rating Selection */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-300">How satisfied are you with the resolution?</p>
              <div className="flex gap-2 justify-between">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-[opacity,transform] ${
                      rating === r
                        ? "bg-[#00D4FF]/20 border border-[#00D4FF]/50 scale-105"
                        : "bg-gray-800/30 border border-gray-700/30 hover:bg-gray-800/50"
                    }`}
                  >
                    <span className="text-2xl">
                      {r === 1 ? "😞" : r === 2 ? "😐" : r === 3 ? "😊" : r === 4 ? "😄" : "🤩"}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {r === 1 ? "Poor" : r === 2 ? "Fair" : r === 3 ? "Good" : r === 4 ? "Great" : "Excellent"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            {rating && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Additional feedback (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what we could improve..."
                  rows={3}
                  className="w-full bg-[#0A0E1A] border border-gray-800 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-[#00D4FF]/50 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 transition-[opacity,transform] resize-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={submitSurveyMutation.isPending}
                className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-800/50"
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rating || submitSurveyMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#00B8CC] hover:from-[#00EEFF] hover:to-[#00D4FF] text-[#0A0E1A] font-bold rounded-lg"
              >
                {submitSurveyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="text-4xl">✨</div>
            <p className="text-gray-300 font-medium">Thank you for your feedback!</p>
            <p className="text-gray-500 text-sm">We appreciate your input and will use it to improve our service.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
