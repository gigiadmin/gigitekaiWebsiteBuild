import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, XCircle, Loader2, Download, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface HeaderAnalysisResult {
  spf: { status: 'pass' | 'fail' | 'neutral'; details: string };
  dkim: { status: 'pass' | 'fail' | 'neutral'; details: string };
  dmarc: { status: 'pass' | 'fail' | 'neutral'; details: string };
  routingPath: string[];
  fromAddress: string;
  toAddress: string;
  subject: string;
  timestamp: string;
  overallScore: number;
  issues: string[];
  recommendations: string[];
}

export default function EmailDiagnostics() {
  const [emailHeaders, setEmailHeaders] = useState('');
  const [analysisResult, setAnalysisResult] = useState<HeaderAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportEmails, setReportEmails] = useState('');

  const analyzeHeaders = trpc.emailDiagnostics.analyzeEmailHeaders.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data as HeaderAnalysisResult);
      setIsLoading(false);
      toast.success('Email headers analyzed successfully!');
    },
    onError: (error) => {
      setIsLoading(false);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleAnalyze = async () => {
    if (!emailHeaders.trim()) {
      toast.error('Please paste email headers');
      return;
    }

    setIsLoading(true);
    analyzeHeaders.mutate({ rawHeaders: emailHeaders.trim() });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'neutral':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/20 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Email Header Analyzer</h1>
          <p className="text-slate-400">Analyze raw email headers for authentication, routing, and security issues</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">Email Headers</h2>
              <Textarea
                placeholder="Paste raw email headers here (From 'Received:' to end)..."
                value={emailHeaders}
                onChange={(e) => setEmailHeaders(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 mb-4 h-64"
                disabled={isLoading}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isLoading || !emailHeaders.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
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
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {!analysisResult ? (
              <Card className="bg-slate-800 border-slate-700 p-12 flex items-center justify-center min-h-96">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Paste email headers and click "Analyze Headers" to get started</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className={`border-2 p-6 ${getScoreColor(analysisResult.overallScore)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Authentication Score</h3>
                    <div className="text-4xl font-bold text-white">{analysisResult.overallScore}/100</div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        analysisResult.overallScore >= 80
                          ? 'bg-green-500'
                          : analysisResult.overallScore >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${analysisResult.overallScore}%` }}
                    />
                  </div>
                </Card>

                {/* Authentication Results */}
                <div className="grid grid-cols-3 gap-4">
                  {/* SPF */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(analysisResult.spf.status)}
                      <h4 className="font-semibold text-white">SPF</h4>
                    </div>
                    <p className="text-sm text-slate-300 capitalize">{analysisResult.spf.status}</p>
                    <p className="text-xs text-slate-400 mt-2">{analysisResult.spf.details}</p>
                  </Card>

                  {/* DKIM */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(analysisResult.dkim.status)}
                      <h4 className="font-semibold text-white">DKIM</h4>
                    </div>
                    <p className="text-sm text-slate-300 capitalize">{analysisResult.dkim.status}</p>
                    <p className="text-xs text-slate-400 mt-2">{analysisResult.dkim.details}</p>
                  </Card>

                  {/* DMARC */}
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(analysisResult.dmarc.status)}
                      <h4 className="font-semibold text-white">DMARC</h4>
                    </div>
                    <p className="text-sm text-slate-300 capitalize">{analysisResult.dmarc.status}</p>
                    <p className="text-xs text-slate-400 mt-2">{analysisResult.dmarc.details}</p>
                  </Card>
                </div>

                {/* Email Details */}
                <Card className="bg-slate-800 border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Email Details</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-400">From:</p>
                      <p className="text-white font-mono">{analysisResult.fromAddress}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">To:</p>
                      <p className="text-white font-mono">{analysisResult.toAddress}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Subject:</p>
                      <p className="text-white">{analysisResult.subject}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Timestamp:</p>
                      <p className="text-white">{analysisResult.timestamp}</p>
                    </div>
                  </div>
                </Card>

                {/* Routing Path */}
                {analysisResult.routingPath.length > 0 && (
                  <Card className="bg-slate-800 border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Routing Path</h3>
                    <div className="space-y-2">
                      {analysisResult.routingPath.map((hop, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-xs text-white font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-slate-300 font-mono text-sm">{hop}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Issues */}
                {analysisResult.issues.length > 0 && (
                  <Card className="bg-red-500/10 border-red-500/50 p-6">
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Issues Found
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.issues.map((issue, idx) => (
                        <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Recommendations */}
                {analysisResult.recommendations.length > 0 && (
                  <Card className="bg-green-500/10 border-green-500/50 p-6">
                    <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-green-300 text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Export Options */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => copyToClipboard(JSON.stringify(analysisResult, null, 2))}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Results
                  </Button>
                  <Button
                    onClick={() => {
                      setReportEmails('');
                      toast.info('Email export feature coming soon');
                    }}
                    variant="outline"
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email Report
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
