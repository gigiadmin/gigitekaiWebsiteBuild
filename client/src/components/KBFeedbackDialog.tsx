import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface KBFeedbackDialogProps {
  articleId: number;
  messageId: number;
  isOpen: boolean;
  onClose: () => void;
  articleTitle: string;
}

export function KBFeedbackDialog({
  articleId,
  messageId,
  isOpen,
  onClose,
  articleTitle,
}: KBFeedbackDialogProps) {
  const [rating, setRating] = useState<"helpful" | "unhelpful" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.kbFeedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Thank you for your feedback!");
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setRating(null);
        setFeedback("");
        setSubmitted(false);
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!rating) {
      toast.error("Please select helpful or unhelpful");
      return;
    }

    submitMutation.mutate({
      messageId,
      articleId,
      rating,
      feedbackMessage: feedback || undefined,
    });
  };

  const unhelpfulReasons = [
    "Information is outdated",
    "Missing important steps",
    "Too technical/not technical enough",
    "Doesn't match my issue",
    "Unclear instructions",
    "Missing screenshots/examples",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Was this article helpful?</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-gray-300">Thank you for your feedback!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setRating("helpful");
                  setFeedback("");
                }}
                className={`flex-1 gap-2 ${
                  rating === "helpful"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes, Helpful
              </Button>
              <Button
                onClick={() => setRating("unhelpful")}
                className={`flex-1 gap-2 ${
                  rating === "unhelpful"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-700 hover:bg-slate-600"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                No, Not Helpful
              </Button>
            </div>

            {/* Unhelpful Feedback */}
            {rating === "unhelpful" && (
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <p className="text-sm text-gray-400">What was missing?</p>
                <div className="grid grid-cols-2 gap-2">
                  {unhelpfulReasons.map((reason) => (
                    <Button
                      key={reason}
                      size="sm"
                      variant="outline"
                      onClick={() => setFeedback(reason)}
                      className={`text-xs justify-start ${
                        feedback === reason
                          ? "bg-cyan-600 border-cyan-500 text-white"
                          : "border-slate-600 text-gray-300 hover:bg-slate-700"
                      }`}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
                <Textarea
                  placeholder="Tell us more (optional)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Helpful Feedback */}
            {rating === "helpful" && (
              <div className="space-y-3 pt-4 border-t border-slate-700">
                <p className="text-sm text-gray-400">Any additional comments?</p>
                <Textarea
                  placeholder="Tell us what you liked (optional)..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm"
                  rows={3}
                />
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!rating || submitMutation.isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
