import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { promises as dns } from "dns";
import { Resolver } from "dns";

// Global DNS servers to query
const DNS_SERVERS = [
  { name: "Google", ip: "8.8.8.8" },
  { name: "Cloudflare", ip: "1.1.1.1" },
  { name: "OpenDNS", ip: "208.67.222.222" },
  { name: "Quad9", ip: "9.9.9.9" },
  { name: "Verisign", ip: "64.6.64.6" },
  { name: "Local", ip: "default" }, // System default
];

/**
 * Query a specific DNS server for records
 */
async function queryDNSServer(
  domain: string,
  recordType: string,
  serverIp: string
): Promise<any> {
  try {
    if (serverIp === "default") {
      // Use system default resolver
      const resolver = new dns.Resolver();
      switch (recordType) {
        case "A":
          return await resolver.resolve4(domain);
        case "AAAA":
          return await resolver.resolve6(domain);
        case "MX":
          return await resolver.resolveMx(domain);
        case "TXT":
          return await resolver.resolveTxt(domain);
        case "NS":
          return await resolver.resolveNs(domain);
        case "CNAME":
          return await resolver.resolveCname(domain);
        case "SOA":
          return await resolver.resolveSoa(domain);
        default:
          return null;
      }
    } else {
      // Query specific DNS server
      const resolver = new dns.Resolver();
      resolver.setServers([serverIp]);

      switch (recordType) {
        case "A":
          return await resolver.resolve4(domain);
        case "AAAA":
          return await resolver.resolve6(domain);
        case "MX":
          return await resolver.resolveMx(domain);
        case "TXT":
          return await resolver.resolveTxt(domain);
        case "NS":
          return await resolver.resolveNs(domain);
        case "CNAME":
          return await resolver.resolveCname(domain);
        case "SOA":
          return await resolver.resolveSoa(domain);
        default:
          return null;
      }
    }
  } catch (error: any) {
    return { error: error.message || "DNS lookup failed", code: error.code };
  }
}

export const dnsCheckerRouter = router({
  /**
   * Check DNS records across multiple global DNS servers
   */
  checkDomainGlobal: adminProcedure
    .input(
      z.object({
        domain: z.string().min(1).max(255),
        recordTypes: z
          .array(z.enum(["A", "AAAA", "MX", "TXT", "CNAME", "NS", "SOA"]))
          .default(["A", "MX", "TXT", "NS"]),
      })
    )
    .mutation(async ({ input }) => {
      const results: Record<string, any> = {
        domain: input.domain,
        timestamp: new Date().toISOString(),
        servers: {},
      };

      // Query each DNS server
      for (const server of DNS_SERVERS) {
        results.servers[server.name] = {
          ip: server.ip,
          records: {},
        };

        for (const recordType of input.recordTypes) {
          const records = await queryDNSServer(
            input.domain,
            recordType,
            server.ip
          );
          results.servers[server.name].records[recordType] = records;
        }
      }

      return results;
    }),

  /**
   * Check DNS records for a domain (single server - system default)
   */
  checkDomain: adminProcedure
    .input(
      z.object({
        domain: z.string().min(1).max(255),
        recordTypes: z
          .array(z.enum(["A", "AAAA", "MX", "TXT", "CNAME", "NS", "SOA"]))
          .default(["A", "MX", "TXT", "NS"]),
      })
    )
    .mutation(async ({ input }) => {
      const results: Record<string, any> = {
        domain: input.domain,
        timestamp: new Date().toISOString(),
        records: {},
      };

      for (const recordType of input.recordTypes) {
        try {
          let records;

          switch (recordType) {
            case "A":
              records = await dns.resolve4(input.domain);
              results.records.A = records;
              break;

            case "AAAA":
              try {
                records = await dns.resolve6(input.domain);
                results.records.AAAA = records;
              } catch (e) {
                results.records.AAAA = { error: "No IPv6 records found" };
              }
              break;

            case "MX":
              records = await dns.resolveMx(input.domain);
              results.records.MX = records;
              break;

            case "TXT":
              records = await dns.resolveTxt(input.domain);
              results.records.TXT = records;
              break;

            case "CNAME":
              try {
                records = await dns.resolveCname(input.domain);
                results.records.CNAME = records;
              } catch (e) {
                results.records.CNAME = { error: "No CNAME records found" };
              }
              break;

            case "NS":
              records = await dns.resolveNs(input.domain);
              results.records.NS = records;
              break;

            case "SOA":
              try {
                records = await dns.resolveSoa(input.domain);
                results.records.SOA = records;
              } catch (e) {
                results.records.SOA = { error: "No SOA records found" };
              }
              break;
          }
        } catch (error: any) {
          results.records[recordType] = {
            error: error.message || "DNS lookup failed",
            code: error.code,
          };
        }
      }

      return results;
    }),

  /**
   * Check if domain is reachable and get basic info
   */
  checkDomainHealth: adminProcedure
    .input(z.object({ domain: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      const health: Record<string, any> = {
        domain: input.domain,
        timestamp: new Date().toISOString(),
        checks: {},
      };

      // Check A record
      try {
        const aRecords = await dns.resolve4(input.domain);
        health.checks.A = { status: "✓", records: aRecords };
      } catch (e: any) {
        health.checks.A = { status: "✗", error: e.message };
      }

      // Check MX records
      try {
        const mxRecords = await dns.resolveMx(input.domain);
        health.checks.MX = {
          status: "✓",
          records: mxRecords.map((r) => `${r.priority}: ${r.exchange}`),
        };
      } catch (e: any) {
        health.checks.MX = { status: "✗", error: e.message };
      }

      // Check NS records
      try {
        const nsRecords = await dns.resolveNs(input.domain);
        health.checks.NS = { status: "✓", records: nsRecords };
      } catch (e: any) {
        health.checks.NS = { status: "✗", error: e.message };
      }

      // Check AAAA records (IPv6)
      try {
        const aaaaRecords = await dns.resolve6(input.domain);
        health.checks.AAAA = { status: "✓", records: aaaaRecords };
      } catch (e: any) {
        health.checks.AAAA = { status: "✗", error: e.message };
      }

      // Check TXT records (SPF, DKIM, DMARC)
      try {
        const txtRecords = await dns.resolveTxt(input.domain);
        const spf = txtRecords.find((r) =>
          r.join("").startsWith("v=spf1")
        );
        const dmarc = txtRecords.find((r) =>
          r.join("").startsWith("v=DMARC1")
        );

        health.checks.TXT = {
          status: "✓",
          spf: spf ? "✓ Found" : "✗ Not found",
          dmarc: dmarc ? "✓ Found" : "✗ Not found",
          total: txtRecords.length,
        };
      } catch (e: any) {
        health.checks.TXT = { status: "✗", error: e.message };
      }

      return health;
    }),

  /**
   * Reverse DNS lookup (IP to domain)
   */
  reverseLookup: adminProcedure
    .input(z.object({ ip: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) }))
    .mutation(async ({ input }) => {
      try {
        const hostnames = await dns.reverse(input.ip);
        return {
          ip: input.ip,
          hostnames,
          status: "✓",
        };
      } catch (error: any) {
        return {
          ip: input.ip,
          hostnames: [],
          status: "✗",
          error: error.message,
        };
      }
    }),

  /**
   * Batch check multiple domains
   */
  batchCheck: adminProcedure
    .input(
      z.object({
        domains: z.array(z.string().min(1)).min(1).max(50),
      })
    )
    .mutation(async ({ input }) => {
      const results = await Promise.all(
        input.domains.map(async (domain) => {
          try {
            const aRecords = await dns.resolve4(domain);
            return {
              domain,
              status: "✓",
              ip: aRecords[0],
            };
          } catch (error: any) {
            return {
              domain,
              status: "✗",
              error: error.message,
            };
          }
        })
      );

      return {
        timestamp: new Date().toISOString(),
        total: input.domains.length,
        healthy: results.filter((r) => r.status === "✓").length,
        failed: results.filter((r) => r.status === "✗").length,
        results,
      };
    }),
});
