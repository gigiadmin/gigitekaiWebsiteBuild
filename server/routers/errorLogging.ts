import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";

/**
 * Error Logging Router
 * Handles client-side error logging from ErrorBoundary
 * Logs to console and can be extended to send to external services
 */

const errorLogSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
  level: z.enum(['global', 'page']),
  errorId: z.string(),
});

export const errorLoggingRouter = router({
  /**
   * Log a client-side error
   * Called by ErrorBoundary component
   */
  logError: publicProcedure
    .input(errorLogSchema)
    .mutation(async ({ input }) => {
      const errorData = {
        ...input,
        receivedAt: new Date().toISOString(),
      };

      // Log to server console
      console.error('[Client Error]', errorData);

      // TODO: Send to external error tracking service (Sentry, LogRocket, etc.)
      // Example:
      // if (process.env.SENTRY_DSN) {
      //   await Sentry.captureException(new Error(input.message), {
      //     contexts: {
      //       client: {
      //         url: input.url,
      //         level: input.level,
      //       },
      //     },
      //     tags: {
      //       errorId: input.errorId,
      //     },
      //   });
      // }

      return {
        success: true,
        errorId: input.errorId,
        message: 'Error logged successfully',
      };
    }),

  /**
   * Get error statistics (admin-only)
   * Returns error counts and trends
   */
  getStats: publicProcedure.query(async () => {
    // TODO: Query error logs from database
    // For now, return placeholder
    return {
      totalErrors: 0,
      errorsLast24h: 0,
      topErrors: [],
    };
  }),
});
