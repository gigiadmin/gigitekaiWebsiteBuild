import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, XCircle, Loader2, Download, Mail, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

type AnalysisStatus = 'idle' | 'loading' | 'complete' | 'error';

interface AnalysisResult {
  domain: string;
  timestamp: string;
  tools: any;
  overallScore: number;
  status: 'PASS' | 'WARNING' | 'FAIL';
}

export default function EmailDiagnostics() {
  const [domain, setDomain] = useState('');
  const [emailHeaders, setEmailHeaders] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const runAnalysis = trpc.emailDiagnostics.runComprehensiveAnalysis.useMutation({
    onSuccess: (data) => {
      setResults(data);
      setAnalysisStatus('complete');
      toast.success('Analysis complete!');
    },
    onError: (error) => {
      setAnalysisStatus('error');
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast.error('Please enter a domain');
      return;
    }

    setAnalysisStatus('loading');
    runAnalysis.mutate({
      domain: domain.trim(),
      emailHeaders: emailHeaders.trim() || undefined,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'WARNING':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'FAIL':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Email Diagnostics Suite</h1>
          <p className="text-slate-400">Comprehensive email deliverability and authentication analysis</p>
        </div>

        {/* Input Section */}
        <Card className="bg-slate-800 border-slate-700 mb-8 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Domain</label>
              <Input
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                disabled={analysisStatus === 'loading'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email Headers (Optional)</label>
              <Textarea
                placeholder="Paste raw email headers here for detailed analysis..."
                value={emailHeaders}
                onChange={(e) => setEmailHeaders(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 h-32"
                disabled={analysisStatus === 'loading'}
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analysisStatus === 'loading'}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {analysisStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Run Comprehensive Analysis'
              )}
            </Button>
          </div>
        </Card>

        {/* Results Section */}
        {results && analysisStatus === 'complete' && (
          <div className="space-y-6">
            {/* Overall Score Card */}
            <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Overall Assessment</h2>
                  <p className="text-slate-300">Domain: {results.domain}</p>
                  <p className="text-slate-400 text-sm">Analyzed: {new Date(results.timestamp).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getScoreColor(results.overallScore)}`}>
                      <span className="text-4xl font-bold text-white">{results.overallScore}</span>
                    </div>
                    <p className="text-slate-300 mt-2 text-sm">Score</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusIcon(results.status)}
                    <span className={`text-2xl font-bold ${
                      results.status === 'PASS' ? 'text-green-400' :
                      results.status === 'WARNING' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {results.status}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Analysis Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
                <TabsTrigger value="overview" className="text-slate-300">Overview</TabsTrigger>
                <TabsTrigger value="authentication" className="text-slate-300">Auth</TabsTrigger>
                <TabsTrigger value="infrastructure" className="text-slate-300">Infrastructure</TabsTrigger>
                <TabsTrigger value="reputation" className="text-slate-300">Reputation</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SPF */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">SPF Record</h3>
                        <p className="text-slate-400 text-sm">
                          {results.tools.dkimSpfDmarc.spf.status === 'FOUND' ? 'Configured' : 'Not Found'}
                        </p>
                      </div>
                      {results.tools.dkimSpfDmarc.spf.status === 'FOUND' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    {results.tools.dkimSpfDmarc.spf.record && (
                      <p className="text-xs text-slate-500 mt-3 break-all font-mono">
                        {results.tools.dkimSpfDmarc.spf.record}
                      </p>
                    )}
                  </Card>

                  {/* DKIM */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">DKIM Records</h3>
                        <p className="text-slate-400 text-sm">
                          {results.tools.dkimSpfDmarc.dkim.records.length} found
                        </p>
                      </div>
                      {results.tools.dkimSpfDmarc.dkim.records.length > 0 ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </Card>

                  {/* DMARC */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">DMARC Policy</h3>
                        <p className="text-slate-400 text-sm">
                          {results.tools.dkimSpfDmarc.dmarc.status === 'FOUND' ? 'Configured' : 'Not Found'}
                        </p>
                      </div>
                      {results.tools.dkimSpfDmarc.dmarc.status === 'FOUND' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                  </Card>

                  {/* MX Records */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">MX Records</h3>
                        <p className="text-slate-400 text-sm">
                          {results.tools.mxRecords.mxRecords.length} servers
                        </p>
                      </div>
                      {results.tools.mxRecords.redundancy === 'MULTIPLE' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Authentication Tab */}
              <TabsContent value="authentication" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Authentication Analysis</h3>
                  <div className="space-y-3">
                    {results.tools.dkimSpfDmarc.spf.issues.map((issue: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-slate-300">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                    {results.tools.dkimSpfDmarc.dkim.issues.map((issue: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-slate-300">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Infrastructure Tab */}
              <TabsContent value="infrastructure" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Infrastructure Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-slate-300 font-medium mb-2">MX Servers</h4>
                      <div className="space-y-2">
                        {results.tools.mxRecords.mxRecords.map((mx: any, idx: number) => (
                          <div key={idx} className="bg-slate-700 p-3 rounded text-slate-300 text-sm">
                            <span className="font-mono">{mx.exchange}</span> (Priority: {mx.priority})
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-slate-300 font-medium mb-2">TLS Support</h4>
                      <div className="space-y-2">
                        {results.tools.sslTls.tlsSupport.map((tls: any, idx: number) => (
                          <div key={idx} className="bg-slate-700 p-3 rounded text-slate-300 text-sm">
                            <span className="font-mono">{tls.server}</span> - {tls.tlsVersion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Reputation Tab */}
              <TabsContent value="reputation" className="space-y-4">
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Reputation & Deliverability</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 p-4 rounded">
                      <p className="text-slate-400 text-sm">Bounce Rate</p>
                      <p className="text-2xl font-bold text-white">{results.tools.bounceRate.bounceRate}%</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded">
                      <p className="text-slate-400 text-sm">Blacklist Status</p>
                      <p className="text-2xl font-bold text-green-400">{results.tools.deliverability.blacklistStatus}</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Export Options */}
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Export & Share</h3>
              <div className="flex gap-3">
                <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Report
                </Button>
                <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white" onClick={handleAnalyze}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Re-analyze
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {analysisStatus === 'idle' && (
          <Card className="bg-slate-800 border-slate-700 p-12 text-center">
            <div className="text-slate-400">
              <p className="text-lg mb-2">Enter a domain to get started</p>
              <p className="text-sm">Get comprehensive email authentication, deliverability, and reputation analysis</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
