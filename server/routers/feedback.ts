import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { submitTicketFeedback, getTicketFeedback, getUserTicketFeedback, getAllTicketFeedback } from "../db";
import { notifyOwner } from "../_core/notification";

export const feedbackRouter = router({
  submitFeedback: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      rating: z.enum(["1", "2", "3", "4", "5"]),
      comment: z.string().optional(),
      wouldRecommend: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const success = await submitTicketFeedback({
          ticketId: input.ticketId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment || null,
          wouldRecommend: input.wouldRecommend || null,
        });

        if (success) {
          // Notify admin of feedback
          const ratingLabel = {
            "1": "1 star (Very Unsatisfied)",
            "2": "2 stars (Unsatisfied)",
            "3": "3 stars (Neutral)",
            "4": "4 stars (Satisfied)",
            "5": "5 stars (Very Satisfied)",
          }[input.rating];

          await notifyOwner({
            title: "New Ticket Feedback Received",
            content: `Customer ${ctx.user.name} left feedback on ticket #${input.ticketId}.\n\n**Rating:** ${ratingLabel}\n**Would Recommend:** ${input.wouldRecommend ? "Yes" : "No"}\n**Comment:** ${input.comment || "No comment provided"}`,
          });
        }

        return { success, message: success ? "Thank you for your feedback!" : "Failed to submit feedback" };
      } catch (error) {
        console.error("[Feedback] Failed to submit feedback:", error);
        return { success: false, message: "Failed to submit feedback" };
      }
    }),

  getFeedback: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input }) => {
      try {
        const feedback = await getTicketFeedback(input.ticketId);
        return { feedback, success: !!feedback };
      } catch (error) {
        console.error("[Feedback] Failed to get feedback:", error);
        return { feedback: null, success: false };
      }
    }),

  getUserFeedback: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const feedbackList = await getUserTicketFeedback(ctx.user.id);
        return { feedbackList, success: true };
      } catch (error) {
        console.error("[Feedback] Failed to get user feedback:", error);
        return { feedbackList: [], success: false };
      }
    }),

  getAllFeedback: protectedProcedure
    .query(async ({ ctx }) => {
      // Only admins can view all feedback
      if (ctx.user.role !== "admin") {
        return { feedbackList: [], success: false, message: "Admin access required" };
      }

      try {
        const feedbackList = await getAllTicketFeedback();
        return { feedbackList, success: true };
      } catch (error) {
        console.error("[Feedback] Failed to get all feedback:", error);
        return { feedbackList: [], success: false };
      }
    }),
});
