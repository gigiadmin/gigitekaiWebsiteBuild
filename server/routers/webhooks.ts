import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import {
  getAllWebhookStatuses,
  getWebhookStatus,
  calculateUptime,
  triggerWebhookHealthCheck,
} from '../db-webhook-monitoring';

export const webhooksRouter = router({
  /**
   * Get all webhook statuses (admin only)
   */
  getAllStatuses: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const statuses = await getAllWebhookStatuses();

    // Enrich with uptime data
    const enriched = await Promise.all(
      statuses.map(async (status) => {
        const uptime = await calculateUptime(status.endpoint.id);
        return {
          ...status,
          uptime: uptime || {
            totalChecks: 0,
            successCount: 0,
            failureCount: 0,
            uptime: 0,
          },
        };
      })
    );

    return enriched;
  }),

  /**
   * Get a single webhook status
   */
  getStatus: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const status = await getWebhookStatus(input.webhookId);
      const uptime = await calculateUptime(input.webhookId);

      return {
        ...status,
        uptime: uptime || {
          totalChecks: 0,
          successCount: 0,
          failureCount: 0,
          uptime: 0,
        },
      };
    }),

  /**
   * Manually trigger a webhook health check
   */
  testWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }

      const result = await triggerWebhookHealthCheck(input.webhookId);
      return result;
    }),
});
