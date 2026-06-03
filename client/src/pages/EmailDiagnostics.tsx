/**
 * Email Diagnostics Suite — Comprehensive email analysis tools
 * 7 tools: Email Header Analyzer + 6 domain-based diagnostic tools
 * Dark cyberpunk UI with tab navigation and color-coded results
 */

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, AlertTriangle, Copy, Loader2, Globe, Mail, Lock, TrendingDown, Server, Network } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type Tab = 'header' | 'dkim-spf-dmarc' | 'deliverability' | 'reverse-dns' | 'mx-records' | 'ssl-tls' | 'bounce-rate';

interface HeaderAnalysisResult {
  spf: { status: string };
  dkim: { status: string };
  dmarc: { status: string };
  overallScore: number;
  routingPath: string[];
  emailDetails: { from?: string; to?: string; subject?: string; timestamp?: string };
  issues: string[];
  recommendations: string[];
}

export default function EmailDiagnostics() {
  const [activeTab, setActiveTab] = useState<Tab>('header');
  const [emailHeaders, setEmailHeaders] = useState('');
  const [domain, setDomain] = useState('');
  const [headerResult, setHeaderResult] = useState<HeaderAnalysisResult | null>(null);
  const [domainResult, setDomainResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportEmails, setReportEmails] = useState('');

  // Header analyzer mutation
  const analyzeHeaders = trpc.emailDiagnostics.analyzeHeaders.useMutation({
    onSuccess: (data: any) => {
      setHeaderResult(data);
      setIsLoading(false);
      toast.success('Email headers analyzed successfully!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Domain-based tools mutations
  const validateDkimSpfDmarc = trpc.emailDiagnostics.validateDkimSpfDmarc.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('DKIM/SPF/DMARC validation complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Validation failed: ${error.message}`);
    },
  });

  const checkDeliverability = trpc.emailDiagnostics.checkDeliverability.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('Deliverability check complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Check failed: ${error.message}`);
    },
  });

  const checkReverseDns = trpc.emailDiagnostics.checkReverseDns.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('Reverse DNS lookup complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Lookup failed: ${error.message}`);
    },
  });

  const checkMxRecords = trpc.emailDiagnostics.checkMxRecords.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('MX records check complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Check failed: ${error.message}`);
    },
  });

  const checkSslTls = trpc.emailDiagnostics.checkSslTls.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('SSL/TLS check complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Check failed: ${error.message}`);
    },
  });

  const analyzeBounceRate = trpc.emailDiagnostics.analyzeBounceRate.useMutation({
    onSuccess: (data: any) => {
      setDomainResult(data);
      setIsLoading(false);
      toast.success('Bounce rate analysis complete!');
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleHeaderAnalyze = async () => {
    if (!emailHeaders.trim()) {
      toast.error('Please paste email headers');
      return;
    }
    setIsLoading(true);
    analyzeHeaders.mutate({ rawHeaders: emailHeaders.trim() } as any);
  };

  const handleDomainAnalyze = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain');
      return;
    }
    setIsLoading(true);
    
    switch (activeTab) {
      case 'dkim-spf-dmarc':
        validateDkimSpfDmarc.mutate({ domain: domain.trim() } as any);
        break;
      case 'deliverability':
        checkDeliverability.mutate({ domain: domain.trim() } as any);
        break;
      case 'reverse-dns':
        checkReverseDns.mutate({ domain: domain.trim() } as any);
        break;
      case 'mx-records':
        checkMxRecords.mutate({ domain: domain.trim() } as any);
        break;
      case 'ssl-tls':
        checkSslTls.mutate({ domain: domain.trim() } as any);
        break;
      case 'bounce-rate':
        analyzeBounceRate.mutate({ domain: domain.trim() } as any);
        break;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'found':
      case 'secure':
      case 'clean':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'fail':
      case 'not_found':
      case 'insecure':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pass':
      case 'found':
      case 'secure':
      case 'clean':
        return 'text-green-400';
      case 'fail':
      case 'not_found':
      case 'insecure':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const tabs = [
    { id: 'header' as Tab, label: 'Email Header Analyzer', icon: Mail },
    { id: 'dkim-spf-dmarc' as Tab, label: 'DKIM/SPF/DMARC', icon: Lock },
    { id: 'deliverability' as Tab, label: 'Deliverability', icon: TrendingDown },
    { id: 'reverse-dns' as Tab, label: 'Reverse DNS', icon: Server },
    { id: 'mx-records' as Tab, label: 'MX Records', icon: Network },
    { id: 'ssl-tls' as Tab, label: 'SSL/TLS', icon: Lock },
    { id: 'bounce-rate' as Tab, label: 'Bounce Rate', icon: TrendingDown },
  ];

  return (
    <AdminLayout title="Email Diagnostics">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Diagnostics Suite</h1>
          <p className="text-slate-400">Comprehensive email analysis and authentication verification</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-slate-800/50 p-3 rounded-lg border border-cyan-500/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setDomainResult(null);
                  setHeaderResult(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <Card className="bg-[#0F1629] border-cyan-500/10 p-6">
          {activeTab === 'header' ? (
            // Email Header Analyzer
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Paste Raw Email Headers
                </label>
                <textarea
                  value={emailHeaders}
                  onChange={(e) => setEmailHeaders(e.target.value)}
                  placeholder="Paste the full email header here..."
                  className="w-full h-48 bg-slate-900 border border-cyan-500/20 rounded-lg p-3 text-slate-300 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none font-mono text-xs"
                />
              </div>
              <Button
                onClick={handleHeaderAnalyze}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Headers'
                )}
              </Button>

              {headerResult && (
                <div className="space-y-4 mt-6 pt-6 border-t border-cyan-500/10">
                  {/* Overall Score */}
                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Overall Authentication Score</span>
                      <span className={`text-2xl font-bold ${getStatusColor(headerResult.overallScore >= 80 ? 'pass' : 'fail')}`}>
                        {headerResult.overallScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          headerResult.overallScore >= 80
                            ? 'bg-green-500'
                            : headerResult.overallScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${headerResult.overallScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Authentication Results */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'SPF', status: headerResult.spf.status },
                      { label: 'DKIM', status: headerResult.dkim.status },
                      { label: 'DMARC', status: headerResult.dmarc.status },
                    ].map((auth) => (
                      <div key={auth.label} className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-3">
                        {getStatusIcon(auth.status)}
                        <div>
                          <div className="text-xs text-slate-500">{auth.label}</div>
                          <div className={`font-semibold ${getStatusColor(auth.status)}`}>
                            {auth.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Email Details */}
                  {headerResult.emailDetails && (
                    <div className="bg-slate-800/50 p-6 rounded-lg space-y-4">
                      <h3 className="font-semibold text-slate-200 text-lg">Email Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {headerResult.emailDetails.from && (
                          <div className="border-l-2 border-cyan-500/40 pl-4 py-2">
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">From</div>
                            <div className="text-sm text-slate-100 font-medium mt-2 break-all">{headerResult.emailDetails.from}</div>
                          </div>
                        )}
                        {headerResult.emailDetails.to && (
                          <div className="border-l-2 border-cyan-500/40 pl-4 py-2">
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">To</div>
                            <div className="text-sm text-slate-100 font-medium mt-2 break-all">{headerResult.emailDetails.to}</div>
                          </div>
                        )}
                        {headerResult.emailDetails.subject && (
                          <div className="border-l-2 border-cyan-500/40 pl-4 py-2 col-span-2">
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Subject</div>
                            <div className="text-sm text-slate-100 font-medium mt-2">{headerResult.emailDetails.subject}</div>
                          </div>
                        )}
                        {headerResult.emailDetails.timestamp && (
                          <div className="border-l-2 border-cyan-500/40 pl-4 py-2 col-span-2">
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Timestamp</div>
                            <div className="text-sm text-slate-100 font-medium mt-2">{headerResult.emailDetails.timestamp}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Routing Path */}
                  {headerResult.routingPath && headerResult.routingPath.length > 0 && (
                    <div className="bg-slate-800/50 p-6 rounded-lg">
                      <h3 className="font-semibold text-slate-200 text-lg mb-4">Email Routing Path</h3>
                      <div className="space-y-3">
                        {headerResult.routingPath.map((hop, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-cyan-500/20 rounded-full text-xs font-bold text-cyan-300 flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-slate-200 font-mono break-all">{hop}</div>
                            </div>
                            {idx < headerResult.routingPath.length - 1 && (
                              <div className="text-cyan-500/40 text-lg">↓</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues & Recommendations */}
                  {headerResult.issues.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-400 mb-2">Issues Found</h3>
                      <ul className="space-y-1">
                        {headerResult.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-red-300">• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {headerResult.recommendations.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-400 mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {headerResult.recommendations.map((rec, i) => (
                          <li key={i} className="text-sm text-yellow-300">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Domain-based tools
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full bg-slate-900 border border-cyan-500/20 rounded-lg px-4 py-2 text-slate-300 placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>
              <Button
                onClick={handleDomainAnalyze}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Run Analysis'
                )}
              </Button>

              {domainResult && (
                <div className="space-y-4 mt-6 pt-6 border-t border-cyan-500/10">
                  {/* Overall Score */}
                  {domainResult.overallScore !== undefined && (
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-300 font-medium">Overall Health Score</span>
                        <span className={`text-2xl font-bold ${getStatusColor(domainResult.overallScore >= 80 ? 'pass' : domainResult.overallScore >= 60 ? 'warning' : 'fail')}`}>
                          {domainResult.overallScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            domainResult.overallScore >= 80
                              ? 'bg-green-500'
                              : domainResult.overallScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${domainResult.overallScore}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Records Table */}
                  {domainResult.records && domainResult.records.length > 0 && (
                    <div className="bg-slate-800/50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-300 mb-3">Records</h3>
                      <div className="space-y-2">
                        {domainResult.records.map((record: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-300">{record.label || record.name}</div>
                              {record.details && <div className="text-xs text-slate-500 mt-1">{record.details}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(record.status)}
                              <span className={`text-sm font-medium ${getStatusColor(record.status)}`}>
                                {record.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issues & Recommendations */}
                  {domainResult.issues && domainResult.issues.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-red-400 mb-2">Issues Found</h3>
                      <ul className="space-y-1">
                        {domainResult.issues.map((issue: any, i: number) => (
                          <li key={i} className="text-sm text-red-300">• {typeof issue === 'string' ? issue : issue.title || issue.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {domainResult.recommendations && domainResult.recommendations.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-400 mb-2">Recommendations</h3>
                      <ul className="space-y-1">
                        {domainResult.recommendations.map((rec: any, i: number) => (
                          <li key={i} className="text-sm text-yellow-300">• {typeof rec === 'string' ? rec : rec.title || rec.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
