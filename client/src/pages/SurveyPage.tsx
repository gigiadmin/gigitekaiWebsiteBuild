import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Star } from "lucide-react";

export default function SurveyPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch survey details
  const { data: survey, isLoading } = trpc.clientSatisfactionSurvey.getSurveyResponse.useQuery(
    { surveyToken: token || "" },
    { enabled: !!token }
  );

  // Submit survey mutation
  const submitMutation = trpc.clientSatisfactionSurvey.submitSurveyResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => setLocation("/"), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to submit survey");
    },
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setError(null);
    await submitMutation.mutateAsync({
      surveyToken: token || "",
      rating,
      comment: comment || undefined,
      wouldRecommend,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">Loading survey...</div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h1 className="text-xl font-bold">Survey Not Found</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            This survey link is invalid or has expired. Please contact support if you have any feedback.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  if (survey.submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h1 className="text-xl font-bold">Survey Already Submitted</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Thank you for your feedback! We appreciate your response.
          </p>
          <Button onClick={() => setLocation("/")} className="w-full">
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-4">
            Your feedback has been submitted successfully. We appreciate your time!
          </p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">How did we do?</h1>
            <p className="text-muted-foreground">
              Your feedback helps us improve our support quality
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Ticket Info */}
          <div className="bg-muted/50 rounded-lg p-4 mb-8">
            <p className="text-sm text-muted-foreground mb-1">Support Ticket</p>
            <p className="font-semibold">#{survey.ticketId}</p>
          </div>

          {/* Rating */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-4">
              How would you rate your support experience?
            </label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg transition-colors ${
                    rating >= star
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {rating > 0 && (
                <span>
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Would Recommend */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-4">
              Would you recommend GigitekAI to others?
            </label>
            <div className="flex gap-3">
              <Button
                variant={wouldRecommend === true ? "default" : "outline"}
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                Yes
              </Button>
              <Button
                variant={wouldRecommend === false ? "default" : "outline"}
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                No
              </Button>
            </div>
          </div>

          {/* Comment */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Tell us what we did well or how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-24"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitMutation.isPending}
            className="w-full"
            size="lg"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Your feedback is confidential and helps us serve you better.
          </p>
        </Card>
      </div>
    </div>
  );
}
