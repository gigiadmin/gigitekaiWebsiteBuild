/**
 * tRPC Router for DNS Management via GoDaddy
 * Allows admins to manage DNS records from the admin panel
 */

import { z } from 'zod';
import { router, adminProcedure } from '../_core/trpc';
import {
  getDNSRecords,
  updateDNSRecords,
  addDNSRecord,
  deleteDNSRecord,
  verifyDomainHealth,
  setupMicrosoft365DNS,
} from '../_core/godaddy';

export const dnsRouter = router({
  /**
   * Get all DNS records for a domain
   */
  getRecords: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
      recordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const records = await getDNSRecords(input.domain, input.recordType);
        return {
          success: true,
          records,
          count: records.length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch DNS records';
        return {
          success: false,
          error: message,
          records: [],
          count: 0,
        };
      }
    }),

  /**
   * Add a new DNS record
   */
  addRecord: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
      type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']),
      name: z.string(),
      value: z.string(),
      ttl: z.number().optional(),
      priority: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        await addDNSRecord(input.domain, {
          type: input.type,
          name: input.name,
          value: input.value,
          ttl: input.ttl,
          priority: input.priority,
        });

        return {
          success: true,
          message: `DNS record added successfully`,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add DNS record';
        return {
          success: false,
          error: message,
        };
      }
    }),

  /**
   * Delete a DNS record
   */
  deleteRecord: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
      recordType: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await deleteDNSRecord(input.domain, input.recordType, input.name);

        return {
          success: true,
          message: `DNS record deleted successfully`,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete DNS record';
        return {
          success: false,
          error: message,
        };
      }
    }),

  /**
   * Verify domain health
   */
  checkHealth: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
    }))
    .query(async ({ input }) => {
      try {
        const health = await verifyDomainHealth(input.domain);

        return {
          success: true,
          ...health,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to check domain health';
        return {
          success: false,
          error: message,
          healthy: false,
          checks: {
            aRecords: false,
            mxRecords: false,
            txtRecords: false,
            cnameRecords: false,
          },
        };
      }
    }),

  /**
   * Setup Microsoft 365 DNS records automatically
   */
  setupMicrosoft365: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        await setupMicrosoft365DNS(input.domain);

        return {
          success: true,
          message: `Microsoft 365 DNS records configured for ${input.domain}`,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to setup Microsoft 365 DNS';
        return {
          success: false,
          error: message,
        };
      }
    }),

  /**
   * Bulk update DNS records
   */
  updateRecords: adminProcedure
    .input(z.object({
      domain: z.string().min(1),
      records: z.array(z.object({
        type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']),
        name: z.string(),
        value: z.string(),
        ttl: z.number().optional(),
        priority: z.number().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      try {
        await updateDNSRecords(input.domain, input.records);

        return {
          success: true,
          message: `${input.records.length} DNS records updated successfully`,
          count: input.records.length,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update DNS records';
        return {
          success: false,
          error: message,
          count: 0,
        };
      }
    }),
});
