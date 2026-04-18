import { useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface KBFeedbackProps {
  articleId: number;
  articleTitle: string;
  averageRating?: number;
  ratingCount?: number;
  commentCount?: number;
  onRatingSubmit?: (rating: number) => void;
  onCommentSubmit?: (comment: string) => void;
}

export function KBFeedback({
  articleId,
  articleTitle,
  averageRating = 0,
  ratingCount = 0,
  commentCount = 0,
  onRatingSubmit,
  onCommentSubmit,
}: KBFeedbackProps) {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingSubmit = async (rating: number) => {
    setUserRating(rating);
    setIsSubmitting(true);
    try {
      onRatingSubmit?.(rating);
      toast.success(`Thanks for rating "${articleTitle}" ${rating} star${rating !== 1 ? "s" : ""}!`);
    } catch (error) {
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      onCommentSubmit?.(comment);
      setComment("");
      toast.success("Comment submitted! Thank you for your feedback.");
    } catch (error) {
      toast.error("Failed to submit comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-700 space-y-6">
      {/* Rating Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Was this article helpful?</h4>
          {averageRating > 0 && (
            <span className="text-xs text-gray-400">
              {averageRating.toFixed(1)} ⭐ ({ratingCount} rating{ratingCount !== 1 ? "s" : ""})
            </span>
          )}
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingSubmit(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSubmitting}
              className="transition-transform hover:scale-110 disabled:opacity-50"
              title={`Rate ${star} star${star !== 1 ? "s" : ""}`}
            >
              <Star
                className={`w-6 h-6 ${
                  star <= (hoverRating || userRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>
            {showComments ? "Hide" : "Leave"} feedback ({commentCount})
          </span>
        </button>

        {showComments && (
          <div className="space-y-3 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your feedback about this article..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                onClick={() => setShowComments(false)}
                variant="outline"
                size="sm"
                className="border-slate-600 text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCommentSubmit}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={isSubmitting || !comment.trim()}
              >
                <Send className="w-3 h-3 mr-1" />
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
