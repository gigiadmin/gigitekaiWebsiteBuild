import { z } from "zod";
import { getDb } from "../db";
import { tickets } from "../../drizzle/schema";
import { gte } from "drizzle-orm";
import { publicProcedure } from "../_core/trpc";

/**
 * Contact Center Historical Trends & Analytics
 * Provides daily/weekly ticket volume, call trends, and wait time heatmaps
 */

export const contactCenterTrends = {
  /**
   * Historical Trend Data — Daily/Weekly ticket volume
   */
  getHistoricalTrends: publicProcedure
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        period: `Last ${input.days} days`,
        dailyTrend: [],
        weeklyTrend: [],
        totalTickets: 0,
        totalResolved: 0,
        resolutionRate: 0,
        avgPerDay: 0,
      };
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      try {
        // Fetch tickets created in the period
        const query = db
          .select({
            createdAt: tickets.createdAt,
            status: tickets.status,
          })
          .from(tickets)
          .where(gte(tickets.createdAt, daysAgo));
        
        const ticketData = await query.execute();

        // Group by date and count
        const dailyTickets: Record<string, { total: number; resolved: number }> = {};
        (ticketData || []).forEach((row: any) => {
          const dateStr = new Date(row.createdAt).toISOString().split('T')[0];
          if (!dailyTickets[dateStr]) dailyTickets[dateStr] = { total: 0, resolved: 0 };
          dailyTickets[dateStr].total += 1;
          if (row.status === 'resolved') dailyTickets[dateStr].resolved += 1;
        });

        // Convert to array for charting
        const ticketTrend = Object.entries(dailyTickets)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([date, data]) => ({
            date,
            tickets: data.total,
            resolved: data.resolved,
            resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
          }));

        // Calculate weekly aggregates
        const weeklyTickets: Record<string, { total: number; resolved: number }> = {};
        Object.entries(dailyTickets).forEach(([date, data]) => {
          const d = new Date(date);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const weekKey = weekStart.toISOString().split('T')[0];
          if (!weeklyTickets[weekKey]) weeklyTickets[weekKey] = { total: 0, resolved: 0 };
          weeklyTickets[weekKey].total += data.total;
          weeklyTickets[weekKey].resolved += data.resolved;
        });

        const weeklyTrend = Object.entries(weeklyTickets)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([week, data]) => ({
            week,
            tickets: data.total,
            resolved: data.resolved,
            resolutionRate: data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0,
          }));

        const totalTickets = ticketData?.length || 0;
        const totalResolved = (ticketData || []).filter((t: any) => t.status === 'resolved').length;

        return {
          period: `Last ${input.days} days`,
          dailyTrend: ticketTrend,
          weeklyTrend: weeklyTrend,
          totalTickets,
          totalResolved,
          resolutionRate: totalTickets > 0 ? Math.round((totalResolved / totalTickets) * 100) : 0,
          avgPerDay: Math.round(totalTickets / input.days),
        };
      } catch (error) {
        // Error getting historical trends
        return {
          period: `Last ${input.days} days`,
          dailyTrend: [],
          weeklyTrend: [],
          totalTickets: 0,
          totalResolved: 0,
          resolutionRate: 0,
          avgPerDay: 0,
        };
      }
    }),

  /**
   * Wait Time Heatmap — Peak hours and wait time by hour/day of week
   */
  getWaitTimeHeatmap: publicProcedure
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        period: `Last ${input.days} days`,
        heatmap: [],
        peakHour: '00:00',
        peakCount: 0,
        busiestDay: 'Unknown',
        busiestDayTickets: 0,
        totalTickets: 0,
      };
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      try {
        // Fetch tickets with creation time
        const query = db
          .select({
            createdAt: tickets.createdAt,
            status: tickets.status,
          })
          .from(tickets)
          .where(gte(tickets.createdAt, daysAgo));
        
        const ticketData = await query.execute();

        // Group by hour and day of week
        const heatmapData: Record<string, Record<number, number>> = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        (ticketData || []).forEach((row: any) => {
          const d = new Date(row.createdAt);
          const dayName = dayNames[d.getDay()];
          const hour = d.getHours();

          if (!heatmapData[dayName]) heatmapData[dayName] = {};
          heatmapData[dayName][hour] = (heatmapData[dayName][hour] || 0) + 1;
        });

        // Convert to array format for heatmap visualization
        const heatmap = dayNames.map(day => ({
          day,
          hours: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            tickets: heatmapData[day]?.[hour] || 0,
            intensity: heatmapData[day]?.[hour] ? Math.min(100, (heatmapData[day][hour] / 10) * 100) : 0,
          })),
        }));

        // Find peak hour
        let peakHour = 0;
        let peakCount = 0;
        Object.values(heatmapData).forEach(dayData => {
          Object.entries(dayData).forEach(([hour, count]: any) => {
            if (count > peakCount) {
              peakCount = count;
              peakHour = parseInt(hour);
            }
          });
        });

        // Find busiest day
        const dayTicketCounts = dayNames.map(day => ({
          day,
          tickets: Object.values(heatmapData[day] || {}).reduce((a, b) => a + b, 0),
        }));
        const busiestDay = dayTicketCounts.reduce((max, curr) => curr.tickets > max.tickets ? curr : max);

        return {
          period: `Last ${input.days} days`,
          heatmap,
          peakHour: `${String(peakHour).padStart(2, '0')}:00`,
          peakCount,
          busiestDay: busiestDay.day,
          busiestDayTickets: busiestDay.tickets,
          totalTickets: ticketData?.length || 0,
        };
      } catch (error) {
        // Error getting wait time heatmap
        return {
          period: `Last ${input.days} days`,
          heatmap: [],
          peakHour: '00:00',
          peakCount: 0,
          busiestDay: 'Unknown',
          busiestDayTickets: 0,
          totalTickets: 0,
        };
      }
    }),

  /**
   * Call Routing Analytics — Destination breakdown and abandon rates
   */
  getCallRoutingAnalytics: publicProcedure
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return {
        period: `Last ${input.days} days`,
        routing: [],
        totalCalls: 0,
        totalResolved: 0,
        totalAbandoned: 0,
        overallResolutionRate: 0,
        overallAbandonRate: 0,
      };
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      try {
        // Fetch tickets (proxy for calls)
        const query = db
          .select({
            status: tickets.status,
            category: tickets.category,
            priority: tickets.priority,
          })
          .from(tickets)
          .where(gte(tickets.createdAt, daysAgo));
        
        const ticketData = await query.execute();

        // Group by category (routing destination)
        const categoryStats: Record<string, { total: number; resolved: number; abandoned: number }> = {};
        (ticketData || []).forEach((row: any) => {
          const cat = row.category || 'Unassigned';
          if (!categoryStats[cat]) categoryStats[cat] = { total: 0, resolved: 0, abandoned: 0 };
          categoryStats[cat].total += 1;
          if (row.status === 'resolved') categoryStats[cat].resolved += 1;
          if (row.status === 'closed' && row.priority === 'low') categoryStats[cat].abandoned += 1;
        });

        // Convert to array
        const routing = Object.entries(categoryStats)
          .map(([destination, stats]) => ({
            destination,
            total: stats.total,
            resolved: stats.resolved,
            abandoned: stats.abandoned,
            resolutionRate: stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0,
            abandonRate: stats.total > 0 ? Math.round((stats.abandoned / stats.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total);

        const totalCalls = ticketData?.length || 0;
        const totalResolved = (ticketData || []).filter((t: any) => t.status === 'resolved').length;
        const totalAbandoned = (ticketData || []).filter((t: any) => t.status === 'closed' && t.priority === 'low').length;

        return {
          period: `Last ${input.days} days`,
          routing,
          totalCalls,
          totalResolved,
          totalAbandoned,
          overallResolutionRate: totalCalls > 0 ? Math.round((totalResolved / totalCalls) * 100) : 0,
          overallAbandonRate: totalCalls > 0 ? Math.round((totalAbandoned / totalCalls) * 100) : 0,
        };
      } catch (error) {
        // Error getting call routing analytics
        return {
          period: `Last ${input.days} days`,
          routing: [],
          totalCalls: 0,
          totalResolved: 0,
          totalAbandoned: 0,
          overallResolutionRate: 0,
          overallAbandonRate: 0,
        };
      }
    }),
};
