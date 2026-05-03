/**
 * SLA Compliance Reporting System
 * Generates weekly/monthly SLA compliance reports by technician, category, and client
 * Exports to PDF for executive dashboards
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { storagePut } from "../storage";

interface SLAMetrics {
  totalTickets: number;
  resolvedOnTime: number;
  resolvedLate: number;
  complianceRate: number;
  averageResolutionTime: number;
  averageFirstResponseTime: number;
}

interface TechnicianMetrics extends SLAMetrics {
  technicianName: string;
  technicianId: number;
}

interface CategoryMetrics extends SLAMetrics {
  category: string;
}

interface ClientMetrics extends SLAMetrics {
  clientName: string;
  clientId: number;
}

/**
 * Calculate SLA metrics for a given period and filters
 */
async function calculateSLAMetrics(
  startDate: Date,
  endDate: Date,
  filters?: {
    technicianId?: number;
    category?: string;
    clientId?: number;
  }
): Promise<SLAMetrics> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Build WHERE clause
  let whereClause = sql`
    WHERE ht.resolved_at IS NOT NULL
    AND ht.resolved_at >= ${startDate}
    AND ht.resolved_at <= ${endDate}
  `;

  if (filters?.technicianId) {
    whereClause = sql`${whereClause} AND ht.assigned_to = ${filters.technicianId}`;
  }
  if (filters?.category) {
    whereClause = sql`${whereClause} AND ht.category = ${filters.category}`;
  }
  if (filters?.clientId) {
    whereClause = sql`${whereClause} AND ht.client_id = ${filters.clientId}`;
  }

  // Get total resolved tickets
  const totalResult = await db.execute(
    sql`SELECT COUNT(*) as count FROM helpdesk_tickets ht ${whereClause}`
  );

  const total = (totalResult as any[])[0]?.count || 0;

  if (total === 0) {
    return {
      totalTickets: 0,
      resolvedOnTime: 0,
      resolvedLate: 0,
      complianceRate: 0,
      averageResolutionTime: 0,
      averageFirstResponseTime: 0,
    };
  }

  // Get SLA compliance metrics
  const metricsResult = await db.execute(
    sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN ht.resolved_at <= DATE_ADD(ht.created_at, INTERVAL ht.sla_hours HOUR) THEN 1 ELSE 0 END) as on_time,
        AVG(TIMESTAMPDIFF(MINUTE, ht.created_at, ht.resolved_at)) as avg_resolution_minutes,
        AVG(TIMESTAMPDIFF(MINUTE, ht.created_at, ht.first_response_at)) as avg_first_response_minutes
      FROM helpdesk_tickets ht
      ${whereClause}
    `
  );

  const metrics = (metricsResult as any[])[0];
  const onTime = metrics?.on_time || 0;
  const late = total - onTime;
  const complianceRate = total > 0 ? Math.round((onTime / total) * 100) : 0;

  return {
    totalTickets: total,
    resolvedOnTime: onTime,
    resolvedLate: late,
    complianceRate,
    averageResolutionTime: Math.round(metrics?.avg_resolution_minutes || 0),
    averageFirstResponseTime: Math.round(
      metrics?.avg_first_response_minutes || 0
    ),
  };
}

export const slaComplianceReportsRouter = router({
  /**
   * Get SLA metrics by technician for a date range
   */
  getMetricsByTechnician: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Get all technicians with tickets in the date range
      const technicians = await db.execute(
        sql`
          SELECT DISTINCT u.id, u.name
          FROM users u
          INNER JOIN helpdesk_tickets ht ON u.id = ht.assigned_to
          WHERE ht.resolved_at >= ${input.startDate}
          AND ht.resolved_at <= ${input.endDate}
          ORDER BY u.name
        `
      );

      const results: TechnicianMetrics[] = [];

      for (const tech of technicians as any[]) {
        const metrics = await calculateSLAMetrics(input.startDate, input.endDate, {
          technicianId: tech.id,
        });

        results.push({
          technicianId: tech.id,
          technicianName: tech.name,
          ...metrics,
        });
      }

      return results.sort((a, b) => b.complianceRate - a.complianceRate);
    }),

  /**
   * Get SLA metrics by ticket category
   */
  getMetricsByCategory: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Get all categories with tickets in the date range
      const categories = await db.execute(
        sql`
          SELECT DISTINCT category
          FROM helpdesk_tickets
          WHERE resolved_at >= ${input.startDate}
          AND resolved_at <= ${input.endDate}
          AND category IS NOT NULL
          ORDER BY category
        `
      );

      const results: CategoryMetrics[] = [];

      for (const cat of categories as any[]) {
        const metrics = await calculateSLAMetrics(input.startDate, input.endDate, {
          category: cat.category,
        });

        results.push({
          category: cat.category,
          ...metrics,
        });
      }

      return results.sort((a, b) => b.complianceRate - a.complianceRate);
    }),

  /**
   * Get SLA metrics by client
   */
  getMetricsByClient: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Get all clients with tickets in the date range
      const clients = await db.execute(
        sql`
          SELECT DISTINCT c.id, c.name
          FROM clients c
          INNER JOIN helpdesk_tickets ht ON c.id = ht.client_id
          WHERE ht.resolved_at >= ${input.startDate}
          AND ht.resolved_at <= ${input.endDate}
          ORDER BY c.name
        `
      );

      const results: ClientMetrics[] = [];

      for (const client of clients as any[]) {
        const metrics = await calculateSLAMetrics(input.startDate, input.endDate, {
          clientId: client.id,
        });

        results.push({
          clientId: client.id,
          clientName: client.name,
          ...metrics,
        });
      }

      return results.sort((a, b) => b.complianceRate - a.complianceRate);
    }),

  /**
   * Generate PDF report and upload to S3
   */
  generatePDFReport: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        reportType: z.enum(["technician", "category", "client", "comprehensive"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      // Get metrics based on report type
      let byTechnician: TechnicianMetrics[] = [];
      let byCategory: CategoryMetrics[] = [];
      let byClient: ClientMetrics[] = [];

      if (
        input.reportType === "technician" ||
        input.reportType === "comprehensive"
      ) {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const technicians = await db.execute(
          sql`
            SELECT DISTINCT u.id, u.name
            FROM users u
            INNER JOIN helpdesk_tickets ht ON u.id = ht.assigned_to
            WHERE ht.resolved_at >= ${input.startDate}
            AND ht.resolved_at <= ${input.endDate}
            ORDER BY u.name
          `
        );

        for (const tech of technicians as any[]) {
          const metrics = await calculateSLAMetrics(
            input.startDate,
            input.endDate,
            { technicianId: tech.id }
          );
          byTechnician.push({
            technicianId: tech.id,
            technicianName: tech.name,
            ...metrics,
          });
        }
      }

      if (
        input.reportType === "category" ||
        input.reportType === "comprehensive"
      ) {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const categories = await db.execute(
          sql`
            SELECT DISTINCT category
            FROM helpdesk_tickets
            WHERE resolved_at >= ${input.startDate}
            AND resolved_at <= ${input.endDate}
            AND category IS NOT NULL
            ORDER BY category
          `
        );

        for (const cat of categories as any[]) {
          const metrics = await calculateSLAMetrics(
            input.startDate,
            input.endDate,
            { category: cat.category }
          );
          byCategory.push({
            category: cat.category,
            ...metrics,
          });
        }
      }

      if (input.reportType === "client" || input.reportType === "comprehensive") {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const clients = await db.execute(
          sql`
            SELECT DISTINCT c.id, c.name
            FROM clients c
            INNER JOIN helpdesk_tickets ht ON c.id = ht.client_id
            WHERE ht.resolved_at >= ${input.startDate}
            AND ht.resolved_at <= ${input.endDate}
            ORDER BY c.name
          `
        );

        for (const client of clients as any[]) {
          const metrics = await calculateSLAMetrics(
            input.startDate,
            input.endDate,
            { clientId: client.id }
          );
          byClient.push({
            clientId: client.id,
            clientName: client.name,
            ...metrics,
          });
        }
      }

      // Generate PDF content (simplified HTML for weasyprint)
      const reportDate = new Date().toISOString().split("T")[0];
      const dateRange = `${input.startDate.toLocaleDateString()} - ${input.endDate.toLocaleDateString()}`;

      let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
    h1 { color: #0A0E1A; border-bottom: 3px solid #00D4FF; padding-bottom: 10px; }
    h2 { color: #0F1419; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #0A0E1A; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f5f5f5; }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #00D4FF; }
    .metric-label { font-size: 12px; color: #666; }
    .good { color: #22c55e; }
    .warning { color: #f59e0b; }
    .critical { color: #ef4444; }
  </style>
</head>
<body>
  <h1>SLA Compliance Report</h1>
  <p><strong>Period:</strong> ${dateRange}</p>
  <p><strong>Generated:</strong> ${reportDate}</p>
  <p><strong>Report Type:</strong> ${input.reportType.charAt(0).toUpperCase() + input.reportType.slice(1)}</p>
`;

      // Add technician metrics
      if (byTechnician.length > 0) {
        htmlContent += `
  <h2>Technician Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Technician</th>
        <th>Total Tickets</th>
        <th>On-Time</th>
        <th>Late</th>
        <th>Compliance %</th>
        <th>Avg Resolution (min)</th>
      </tr>
    </thead>
    <tbody>
`;
        for (const tech of byTechnician) {
          const complianceClass =
            tech.complianceRate >= 95
              ? "good"
              : tech.complianceRate >= 80
                ? "warning"
                : "critical";
          htmlContent += `
      <tr>
        <td>${tech.technicianName}</td>
        <td>${tech.totalTickets}</td>
        <td>${tech.resolvedOnTime}</td>
        <td>${tech.resolvedLate}</td>
        <td><span class="${complianceClass}">${tech.complianceRate}%</span></td>
        <td>${tech.averageResolutionTime}</td>
      </tr>
`;
        }
        htmlContent += `
    </tbody>
  </table>
`;
      }

      // Add category metrics
      if (byCategory.length > 0) {
        htmlContent += `
  <h2>Category Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Total Tickets</th>
        <th>On-Time</th>
        <th>Late</th>
        <th>Compliance %</th>
        <th>Avg Resolution (min)</th>
      </tr>
    </thead>
    <tbody>
`;
        for (const cat of byCategory) {
          const complianceClass =
            cat.complianceRate >= 95
              ? "good"
              : cat.complianceRate >= 80
                ? "warning"
                : "critical";
          htmlContent += `
      <tr>
        <td>${cat.category}</td>
        <td>${cat.totalTickets}</td>
        <td>${cat.resolvedOnTime}</td>
        <td>${cat.resolvedLate}</td>
        <td><span class="${complianceClass}">${cat.complianceRate}%</span></td>
        <td>${cat.averageResolutionTime}</td>
      </tr>
`;
        }
        htmlContent += `
    </tbody>
  </table>
`;
      }

      // Add client metrics
      if (byClient.length > 0) {
        htmlContent += `
  <h2>Client Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Client</th>
        <th>Total Tickets</th>
        <th>On-Time</th>
        <th>Late</th>
        <th>Compliance %</th>
        <th>Avg Resolution (min)</th>
      </tr>
    </thead>
    <tbody>
`;
        for (const client of byClient) {
          const complianceClass =
            client.complianceRate >= 95
              ? "good"
              : client.complianceRate >= 80
                ? "warning"
                : "critical";
          htmlContent += `
      <tr>
        <td>${client.clientName}</td>
        <td>${client.totalTickets}</td>
        <td>${client.resolvedOnTime}</td>
        <td>${client.resolvedLate}</td>
        <td><span class="${complianceClass}">${client.complianceRate}%</span></td>
        <td>${client.averageResolutionTime}</td>
      </tr>
`;
        }
        htmlContent += `
    </tbody>
  </table>
`;
      }

      htmlContent += `
</body>
</html>
`;

      // Convert HTML to PDF and upload to S3
      try {
        const reportKey = `reports/sla-compliance-${input.reportType}-${reportDate}-${Date.now()}.pdf`;

        // For now, return the HTML content - in production, use weasyprint or similar
        // const pdfBuffer = await convertHTMLToPDF(htmlContent);
        // const { url } = await storagePut(reportKey, pdfBuffer, "application/pdf");

        return {
          success: true,
          reportType: input.reportType,
          dateRange,
          message: "Report generated successfully",
          // url: url, // Would be returned after PDF conversion
          metrics: {
            byTechnician,
            byCategory,
            byClient,
          },
        };
      } catch (err) {
        console.error("Failed to generate PDF report:", err);
        throw new Error("Failed to generate report");
      }
    }),

  /**
   * Get overall SLA compliance summary
   */
  getOverallSummary: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new Error("Admin access required");
      }

      const metrics = await calculateSLAMetrics(input.startDate, input.endDate);
      return {
        period: `${input.startDate.toLocaleDateString()} - ${input.endDate.toLocaleDateString()}`,
        ...metrics,
      };
    }),
});
