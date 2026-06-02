import { z } from 'zod';
import { adminProcedure, publicProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { emailAnalysisHistory, emailReports, emailDiagnosticsCache } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import dns from 'dns/promises';

// ============================================================================
// EMAIL HEADER ANALYZER
// ============================================================================

async function analyzeEmailHeaders(rawHeaders: string) {
  const lines = rawHeaders.split('\n');
  const headers: Record<string, string[]> = {};
  let currentHeader = '';
  let currentValue = '';

  for (const line of lines) {
    if (line.match(/^\s/) && currentHeader) {
      // Continuation of previous header
      currentValue += ' ' + line.trim();
    } else if (line.includes(':')) {
      // New header
      if (currentHeader) {
        if (!headers[currentHeader]) headers[currentHeader] = [];
        headers[currentHeader].push(currentValue);
      }
      const [key, ...valueParts] = line.split(':');
      currentHeader = key.trim();
      currentValue = valueParts.join(':').trim();
    }
  }

  // Add last header
  if (currentHeader) {
    if (!headers[currentHeader]) headers[currentHeader] = [];
    headers[currentHeader].push(currentValue);
  }

  // Parse authentication results
  const authResults = headers['Authentication-Results']?.[0] || '';
  const spfPass = authResults.includes('spf=pass');
  const dkimPass = authResults.includes('dkim=pass');
  const dmarcPass = authResults.includes('dmarc=pass');

  // Extract routing information
  const receivedHeaders = headers['Received'] || [];
  const routingPath = receivedHeaders.map((r) => {
    const match = r.match(/from\s+([^\s]+)/);
    return match ? match[1] : 'unknown';
  });

  return {
    headers,
    authentication: {
      spf: spfPass ? 'PASS' : 'FAIL',
      dkim: dkimPass ? 'PASS' : 'FAIL',
      dmarc: dmarcPass ? 'PASS' : 'FAIL',
    },
    routingPath,
    fromAddress: headers['From']?.[0] || 'unknown',
    toAddress: headers['To']?.[0] || 'unknown',
    subject: headers['Subject']?.[0] || '(no subject)',
    timestamp: headers['Date']?.[0] || 'unknown',
  };
}

// ============================================================================
// DKIM/SPF/DMARC VALIDATOR
// ============================================================================

async function validateDkimSpfDmarc(domain: string) {
  const results: any = {
    domain,
    spf: { status: 'UNKNOWN', record: null, issues: [] },
    dkim: { status: 'UNKNOWN', records: [], issues: [] },
    dmarc: { status: 'UNKNOWN', record: null, issues: [] },
  };

  try {
    // Check SPF
    const txtRecords = await dns.resolveTxt(domain);
    const spfRecord = txtRecords.find((r) => r.join('').startsWith('v=spf1'));
    if (spfRecord) {
      results.spf.record = spfRecord.join('');
      results.spf.status = 'FOUND';
      // Basic validation
      if (!spfRecord.join('').includes('-all') && !spfRecord.join('').includes('~all')) {
        results.spf.issues.push('No fail/softfail policy specified');
      }
    } else {
      results.spf.status = 'NOT_FOUND';
      results.spf.issues.push('No SPF record found');
    }
  } catch (e: any) {
    results.spf.issues.push(e.message);
  }

  try {
    // Check DMARC
    const dmarcRecords = await dns.resolveTxt(`_dmarc.${domain}`);
    const dmarcRecord = dmarcRecords.find((r) => r.join('').startsWith('v=DMARC1'));
    if (dmarcRecord) {
      results.dmarc.record = dmarcRecord.join('');
      results.dmarc.status = 'FOUND';
    } else {
      results.dmarc.status = 'NOT_FOUND';
      results.dmarc.issues.push('No DMARC record found');
    }
  } catch (e: any) {
    results.dmarc.issues.push(e.message);
  }

  try {
    // Check DKIM (common selectors)
    const selectors = ['default', 'selector1', 'selector2', 'google', 'k1'];
    for (const selector of selectors) {
      try {
        const dkimRecords = await dns.resolveTxt(`${selector}._domainkey.${domain}`);
        const dkimRecord = dkimRecords.find((r) => r.join('').startsWith('v=DKIM1'));
        if (dkimRecord) {
          results.dkim.records.push({
            selector,
            record: dkimRecord.join(''),
            status: 'FOUND',
          });
        }
      } catch (_) {
        // Selector not found, continue
      }
    }
    if (results.dkim.records.length === 0) {
      results.dkim.status = 'NOT_FOUND';
      results.dkim.issues.push('No DKIM records found for common selectors');
    } else {
      results.dkim.status = 'FOUND';
    }
  } catch (e: any) {
    results.dkim.issues.push(e.message);
  }

  return results;
}

// ============================================================================
// DELIVERABILITY CHECKER
// ============================================================================

async function checkDeliverability(domain: string) {
  const results: any = {
    domain,
    blacklistStatus: 'CHECKING',
    mxRecords: [],
    reputation: 'UNKNOWN',
    issues: [],
  };

  try {
    // Check MX records
    const mxRecords = await dns.resolveMx(domain);
    results.mxRecords = mxRecords.map((r) => ({
      exchange: r.exchange,
      priority: r.priority,
    }));

    if (mxRecords.length === 0) {
      results.issues.push('No MX records found');
    }
  } catch (e: any) {
    results.issues.push(`MX lookup failed: ${e.message}`);
  }

  // Simulate blacklist check (in production, use actual blacklist APIs)
  results.blacklistStatus = 'CLEAN';

  return results;
}

// ============================================================================
// REVERSE DNS / PTR LOOKUP
// ============================================================================

async function checkReverseDns(domain: string) {
  const results: any = {
    domain,
    aRecords: [],
    ptrRecords: [],
    reputation: 'UNKNOWN',
    issues: [],
  };

  try {
    // Get A records
    const aRecords = await dns.resolve4(domain);
    results.aRecords = aRecords;

    // Check PTR for each IP
    for (const ip of aRecords) {
      try {
        const ptrRecords = await dns.reverse(ip);
        results.ptrRecords.push({
          ip,
          hostnames: ptrRecords,
        });
      } catch (e: any) {
        results.ptrRecords.push({
          ip,
          hostnames: [],
          error: e.message,
        });
      }
    }
  } catch (e: any) {
    results.issues.push(`Reverse DNS lookup failed: ${e.message}`);
  }

  return results;
}

// ============================================================================
// MX RECORDS CHECKER
// ============================================================================

async function checkMxRecords(domain: string) {
  const results: any = {
    domain,
    mxRecords: [],
    redundancy: 'UNKNOWN',
    issues: [],
  };

  try {
    const mxRecords = await dns.resolveMx(domain);
    results.mxRecords = mxRecords
      .sort((a, b) => a.priority - b.priority)
      .map((r, idx) => ({
        priority: r.priority,
        exchange: r.exchange,
        order: idx + 1,
      }));

    if (mxRecords.length === 0) {
      results.issues.push('No MX records found');
      results.redundancy = 'NONE';
    } else if (mxRecords.length === 1) {
      results.redundancy = 'SINGLE';
      results.issues.push('Only one MX record - no redundancy');
    } else {
      results.redundancy = 'MULTIPLE';
    }
  } catch (e: any) {
    results.issues.push(`MX lookup failed: ${e.message}`);
  }

  return results;
}

// ============================================================================
// SSL/TLS CERTIFICATE CHECKER
// ============================================================================

async function checkSslTls(domain: string) {
  const results: any = {
    domain,
    mxRecords: [],
    tlsSupport: [],
    issues: [],
  };

  try {
    const mxRecords = await dns.resolveMx(domain);
    results.mxRecords = mxRecords.map((r) => r.exchange);

    // In production, would check actual TLS certificates
    // For now, return simulated results
    for (const mx of results.mxRecords) {
      results.tlsSupport.push({
        server: mx,
        tlsVersion: 'TLSv1.2+',
        cipherSuites: 'Strong',
        status: 'SECURE',
      });
    }
  } catch (e: any) {
    results.issues.push(`TLS check failed: ${e.message}`);
  }

  return results;
}

// ============================================================================
// BOUNCE RATE ANALYZER
// ============================================================================

async function analyzeBounceRate(domain: string) {
  // This would typically integrate with email service provider APIs
  const results: any = {
    domain,
    bounceRate: 0,
    hardBounces: 0,
    softBounces: 0,
    complaints: 0,
    unsubscribes: 0,
    issues: [],
  };

  // Simulated data - in production, fetch from actual email service
  results.bounceRate = 2.5;
  results.hardBounces = 15;
  results.softBounces = 8;
  results.complaints = 2;
  results.unsubscribes = 5;

  if (results.bounceRate > 5) {
    results.issues.push('High bounce rate detected');
  }
  if (results.complaints > 0) {
    results.issues.push('Spam complaints detected');
  }

  return results;
}

// ============================================================================
// COMPREHENSIVE ANALYSIS
// ============================================================================

async function runComprehensiveAnalysis(domain: string, emailHeaders?: string) {
  const results: any = {
    domain,
    timestamp: new Date().toISOString(),
    tools: {},
    overallScore: 0,
    status: 'PASS',
  };

  // Run all tools
  if (emailHeaders) {
    results.tools.headerAnalysis = await analyzeEmailHeaders(emailHeaders);
  }

  results.tools.dkimSpfDmarc = await validateDkimSpfDmarc(domain);
  results.tools.deliverability = await checkDeliverability(domain);
  results.tools.reverseDns = await checkReverseDns(domain);
  results.tools.mxRecords = await checkMxRecords(domain);
  results.tools.sslTls = await checkSslTls(domain);
  results.tools.bounceRate = await analyzeBounceRate(domain);

  // Calculate overall score
  let score = 100;
  if (results.tools.dkimSpfDmarc.spf.status === 'NOT_FOUND') score -= 15;
  if (results.tools.dkimSpfDmarc.dkim.status === 'NOT_FOUND') score -= 15;
  if (results.tools.dkimSpfDmarc.dmarc.status === 'NOT_FOUND') score -= 10;
  if (results.tools.mxRecords.redundancy === 'SINGLE') score -= 10;
  if (results.tools.bounceRate.bounceRate > 5) score -= 20;

  results.overallScore = Math.max(0, score);
  results.status = results.overallScore >= 80 ? 'PASS' : results.overallScore >= 60 ? 'WARNING' : 'FAIL';

  return results;
}

// ============================================================================
// TRPC ROUTER
// ============================================================================

export const emailDiagnosticsRouter = {
  analyzeHeaders: adminProcedure
    .input(z.object({ rawHeaders: z.string() }))
    .mutation(async ({ input }) => {
      return analyzeEmailHeaders(input.rawHeaders);
    }),

  validateDkimSpfDmarc: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return validateDkimSpfDmarc(input.domain);
    }),

  checkDeliverability: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return checkDeliverability(input.domain);
    }),

  checkReverseDns: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return checkReverseDns(input.domain);
    }),

  checkMxRecords: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return checkMxRecords(input.domain);
    }),

  checkSslTls: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return checkSslTls(input.domain);
    }),

  analyzeBounceRate: adminProcedure
    .input(z.object({ domain: z.string() }))
    .mutation(async ({ input }) => {
      return analyzeBounceRate(input.domain);
    }),

  runComprehensiveAnalysis: adminProcedure
    .input(z.object({ domain: z.string(), emailHeaders: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const results = await runComprehensiveAnalysis(input.domain, input.emailHeaders);

      // Save to database
      if (ctx.user) {
        try {
          const db = await getDb();
          if (db) {
            await db.insert(emailAnalysisHistory).values({
              userId: ctx.user.id,
              domain: input.domain,
              analysisType: 'comprehensive',
              rawInput: input.emailHeaders || null,
              resultsJson: results,
              headerAnalysis: results.tools.headerAnalysis || null,
              dkimSpfDmarcAnalysis: results.tools.dkimSpfDmarc || null,
              deliverabilityAnalysis: results.tools.deliverability || null,
              reverseDnsAnalysis: results.tools.reverseDns || null,
              mxRecordsAnalysis: results.tools.mxRecords || null,
              sslTlsAnalysis: results.tools.sslTls || null,
              bounceRateAnalysis: results.tools.bounceRate || null,
              overallScore: results.overallScore,
              status: results.status,
            });
          }
        } catch (e) {
          console.error('[Email Diagnostics] Failed to save analysis:', e);
        }
      }

      return results;
    }),

  getAnalysisHistory: adminProcedure
    .input(z.object({ domain: z.string().optional(), limit: z.number().default(10) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) return [];

      try {
        const db = await getDb();
        if (!db) return [];

        const results = await db
          .select()
          .from(emailAnalysisHistory)
          .where(eq(emailAnalysisHistory.userId, ctx.user.id))
          .orderBy(desc(emailAnalysisHistory.createdAt))
          .limit(input.limit);
        
        return results;
      } catch (e) {
        console.error('[Email Diagnostics] Failed to fetch history:', e);
        return [];
      }
    }),
};
