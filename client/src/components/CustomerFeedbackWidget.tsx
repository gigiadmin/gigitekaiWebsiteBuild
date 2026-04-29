import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CustomerFeedbackWidgetProps {
  ticketId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerFeedbackWidget({
  ticketId,
  isOpen,
  onClose,
}: CustomerFeedbackWidgetProps) {
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [sentiment, setSentiment] = useState<"positive" | "negative" | "neutral" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = trpc.helpdesk.submitCustomerFeedback.useMutation();

  const handleSubmit = async () => {
    if (npsScore === null || !sentiment) {
      toast.error("Please provide NPS score and sentiment");
      return;
    }

    if (typeof npsScore !== "number") {
      toast.error("Invalid NPS score");
      return;
    }

    setIsSubmitting(true);
    try {
      const score = typeof npsScore === "number" ? npsScore : 0;
      await submitFeedback.mutateAsync({
        ticketId,
        npsScore: score,
        sentiment,
        comment: feedbackText || undefined,
        rating: Math.ceil(score / 2) || 3,
      });

      toast.success("Thank you for your feedback!");
      setNpsScore(null);
      setSentiment(null);
      setFeedbackText("");
      onClose();
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Analyze sentiment from feedback text
  const analyzeSentiment = (text: string) => {
    const positiveWords = ["great", "excellent", "amazing", "helpful", "fast", "professional"];
    const negativeWords = ["poor", "bad", "slow", "unhelpful", "rude", "disappointing"];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length;

    if (positiveCount > negativeCount) return "positive";
    if (negativeCount > positiveCount) return "negative";
    return "neutral";
  };

  const handleFeedbackChange = (text: string) => {
    setFeedbackText(text);
    if (text.length > 10) {
      setSentiment(analyzeSentiment(text));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by rating your support experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NPS Score */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              How likely are you to recommend us? (0-10)
            </label>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setNpsScore(i)}
                  className={`h-10 rounded text-xs font-medium transition-colors ${
                    npsScore === i
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div>
            <label className="text-sm font-medium mb-3 block">Overall Experience</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSentiment("positive")}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  sentiment === "positive"
                    ? "bg-green-100 text-green-700 border-2 border-green-500"
                    : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-green-300"
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Positive
              </button>
              <button
                onClick={() => setSentiment("neutral")}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  sentiment === "neutral"
                    ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-500"
                    : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-yellow-300"
                }`}
              >
                <span className="text-lg">😐</span>
                Neutral
              </button>
              <button
                onClick={() => setSentiment("negative")}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  sentiment === "negative"
                    ? "bg-red-100 text-red-700 border-2 border-red-500"
                    : "bg-gray-100 text-gray-700 border-2 border-gray-300 hover:border-red-300"
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                Negative
              </button>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Tell us what we did well or how we can improve..."
              value={feedbackText}
              onChange={(e) => handleFeedbackChange(e.target.value)}
              className="min-h-[100px]"
            />
            {feedbackText.length > 10 && sentiment && (
              <p className="text-xs text-gray-500 mt-2">
                Detected sentiment: <span className="font-medium capitalize">{sentiment}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || npsScore === null || !sentiment}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
