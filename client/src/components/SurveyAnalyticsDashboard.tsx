import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, TrendingUp, Star, AlertCircle, Mail, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function SurveyAnalyticsDashboard() {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Fetch survey stats
  const { data: stats, isLoading: statsLoading } = trpc.helpdeskSurvey.getSurveyStats.useQuery();

  // Fetch low rating surveys
  const { data: lowRatingSurveys, isLoading: lowLoading } = trpc.helpdeskSurvey.getLowRatingSurveys.useQuery({
    limit: 20,
  });

  // Fetch surveys by rating
  const { data: surveysByRating, isLoading: ratingLoading } = trpc.helpdeskSurvey.getSurveysByRating.useQuery(
    { rating: selectedRating || 0 },
    { enabled: !!selectedRating }
  );

  // Fetch survey comments
  const { data: comments, isLoading: commentsLoading } = trpc.helpdeskSurvey.getSurveyComments.useQuery({
    limit: 50,
  });

  // Send follow-up email mutation
  const sendFollowUpMutation = trpc.notifications.queueNotification.useMutation({
    onSuccess: () => {
      toast.success("Follow-up email queued");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send follow-up");
    },
  });

  const handleSendFollowUp = (survey: any) => {
    sendFollowUpMutation.mutate({
      userId: survey.submittedBy,
      type: "email",
      subject: "We'd love to hear more about your experience",
      content: `Thank you for your feedback. We noticed you rated your recent support experience with us. We'd like to understand how we can improve. Please reply to this email with any additional details.`,
      relatedTicketId: survey.ticketId,
      relatedEntityType: "survey",
      relatedEntityId: survey.id,
    });
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-gray-400 ml-3">Loading survey analytics...</span>
      </div>
    );
  }

  const ratingEmojis: Record<number, string> = {
    1: "😞",
    2: "😐",
    3: "😊",
    4: "😄",
    5: "🤩",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Survey Analytics</h2>
        <p className="text-gray-400 text-sm">Track customer satisfaction and identify improvement areas</p>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#141B2D]/60 border-gray-800/30">
            <div className="p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Total Surveys</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.totalSurveys}</p>
            </div>
          </Card>

          <Card className="bg-[#141B2D]/60 border-gray-800/30">
            <div className="p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Avg Rating</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold text-cyan-400">{stats.averageRating.toFixed(1)}</p>
                <span className="text-2xl">{ratingEmojis[Math.round(stats.averageRating)] || "⭐"}</span>
              </div>
            </div>
          </Card>

          <Card className="bg-[#141B2D]/60 border-gray-800/30">
            <div className="p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Satisfaction Rate</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{stats.satisfactionRate}%</p>
            </div>
          </Card>

          <Card className="bg-[#141B2D]/60 border-gray-800/30">
            <div className="p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Low Ratings (1-2)</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{(stats.ratingDistribution?.[1] || 0) + (stats.ratingDistribution?.[2] || 0)}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      <Card className="bg-[#141B2D]/40 border-gray-800/30 p-5">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Rating Distribution
        </h3>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats?.ratingDistribution?.[rating] || 0;
            const percentage = stats?.totalSurveys ? Math.round((count / stats.totalSurveys) * 100) : 0;

            return (
              <button
                key={rating}
                onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8">{ratingEmojis[rating]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{rating} Star{rating !== 1 ? "s" : ""}</span>
                      <span className="text-xs text-gray-500">{count} surveys ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-800/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-[opacity,transform] ${
                          rating >= 4
                            ? "bg-green-500"
                            : rating === 3
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Low Rating Surveys */}
      <Card className="bg-[#141B2D]/40 border-gray-800/30 p-5">
        <h3 className="text-sm font-semibold text-red-300 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Low Rating Surveys (1-2 Stars) - Needs Follow-up
        </h3>

        {lowLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
        ) : lowRatingSurveys && lowRatingSurveys.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lowRatingSurveys.map((survey) => (
              <div key={survey.id} className="bg-gray-800/20 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{ratingEmojis[survey.rating]}</span>
                      <span className="text-sm font-medium text-gray-300">Ticket #{survey.ticketId}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(survey.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    {(survey as any).comment && (
                      <p className="text-xs text-gray-400 line-clamp-2 italic">\"{ (survey as any).comment}\"</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSendFollowUp(survey)}
                    disabled={sendFollowUpMutation.isPending}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    Follow-up
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs text-center py-6">No low rating surveys</p>
        )}
      </Card>

      {/* Survey Comments */}
      <Card className="bg-[#141B2D]/40 border-gray-800/30 p-5">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4">Recent Feedback Comments</h3>

        {commentsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((comment: any) => (
              <div key={comment.id} className="bg-gray-800/20 border border-gray-800/30 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{ratingEmojis[comment.rating]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Ticket #{(comment as any).ticketId}</span>
                      <span className="text-xs text-gray-400">
                        {new Date((comment as any).submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{(comment as any).comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-xs text-center py-6">No comments yet</p>
        )}
      </Card>

      {/* Satisfaction Trend */}
      <Card className="bg-[#141B2D]/40 border-gray-800/30 p-5">
        <h3 className="text-sm font-semibold text-cyan-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Satisfaction Insights
        </h3>

        <div className="space-y-3 text-sm">
          {stats && (
            <>
              <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                <span className="text-gray-300">Highly Satisfied (4-5 stars)</span>
                <span className="font-semibold text-green-400">{stats.satisfactionRate}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                <span className="text-gray-300">Neutral (3 stars)</span>
                <span className="font-semibold text-yellow-400">
                  {stats.totalSurveys > 0
                    ? Math.round(((stats.ratingDistribution?.[3] || 0) / stats.totalSurveys) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/20 rounded-lg">
                <span className="text-gray-300">Dissatisfied (1-2 stars)</span>
                <span className="font-semibold text-red-400">
                  {stats.totalSurveys > 0
                    ? Math.round(((((stats.ratingDistribution?.[1] || 0) + (stats.ratingDistribution?.[2] || 0)) || 0) / stats.totalSurveys) * 100)
                    : 0}
                  %
                </span>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
