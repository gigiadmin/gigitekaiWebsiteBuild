import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";

export default function AdminDNSChecker() {
  const [domain, setDomain] = useState("");
  const [ip, setIp] = useState("");
  const [domains, setDomains] = useState("");
  const [activeTab, setActiveTab] = useState("single");

  const checkDomainMutation = trpc.dnsChecker.checkDomain.useMutation();
  const healthCheckMutation = trpc.dnsChecker.checkDomainHealth.useMutation();
  const reverseLookupMutation = trpc.dnsChecker.reverseLookup.useMutation();
  const batchCheckMutation = trpc.dnsChecker.batchCheck.useMutation();

  const handleCheckDomain = async () => {
    if (!domain.trim()) return;
    await checkDomainMutation.mutateAsync({
      domain,
      recordTypes: ["A", "AAAA", "MX", "TXT", "CNAME", "NS"],
    });
  };

  const handleHealthCheck = async () => {
    if (!domain.trim()) return;
    await healthCheckMutation.mutateAsync({ domain });
  };

  const handleReverseLookup = async () => {
    if (!ip.trim()) return;
    await reverseLookupMutation.mutateAsync({ ip });
  };

  const handleBatchCheck = async () => {
    if (!domains.trim()) return;
    const domainList = domains
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);
    if (domainList.length === 0) return;
    await batchCheckMutation.mutateAsync({ domains: domainList });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">DNS Checker Tool</h1>
          <p className="text-muted-foreground">
            Check DNS records, domain health, and perform reverse lookups
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="single">Single Domain</TabsTrigger>
            <TabsTrigger value="health">Health Check</TabsTrigger>
            <TabsTrigger value="reverse">Reverse Lookup</TabsTrigger>
            <TabsTrigger value="batch">Batch Check</TabsTrigger>
          </TabsList>

          {/* Single Domain Check */}
          <TabsContent value="single" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Domain Name
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleCheckDomain();
                      }}
                    />
                    <Button
                      onClick={handleCheckDomain}
                      disabled={checkDomainMutation.isPending || !domain.trim()}
                    >
                      {checkDomainMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Check
                    </Button>
                  </div>
                </div>

                {checkDomainMutation.data && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-foreground">DNS Records</h3>
                    {Object.entries(checkDomainMutation.data.records as Record<string, any>).map(([type, records]) => {
                      const recordsData = records as any;
                      return (
                      <div key={type} className="bg-muted p-4 rounded-lg">
                        <h4 className="font-medium text-foreground mb-2">{type} Records</h4>
                        {recordsData.error ? (
                          <p className="text-sm text-destructive flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {recordsData.error}
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {Array.isArray(recordsData) &&
                              recordsData.map((record: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-sm text-muted-foreground flex items-center justify-between"
                                >
                                  <code className="bg-background px-2 py-1 rounded text-xs">
                                    {typeof record === "string"
                                      ? record
                                      : JSON.stringify(record)}
                                  </code>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        typeof record === "string"
                                          ? record
                                          : JSON.stringify(record)
                                      )
                                    }
                                    className="text-primary hover:text-primary/80"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Health Check */}
          <TabsContent value="health" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Domain Name
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleHealthCheck();
                      }}
                    />
                    <Button
                      onClick={handleHealthCheck}
                      disabled={healthCheckMutation.isPending || !domain.trim()}
                    >
                      {healthCheckMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Check
                    </Button>
                  </div>
                </div>

                {healthCheckMutation.data && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-foreground">Domain Health</h3>
                    {Object.entries(healthCheckMutation.data.checks as Record<string, any>).map(([check, result]) => {
                      const resultData = result as any;
                      return (
                      <div key={check} className="bg-muted p-4 rounded-lg flex items-start gap-3">
                        {resultData.status === "✓" ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{check}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {resultData.error ? (
                              resultData.error
                            ) : (
                              <div className="space-y-1">
                                {Object.entries(resultData).map(([key, value]: [string, any]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Reverse Lookup */}
          <TabsContent value="reverse" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    IP Address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="8.8.8.8"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") handleReverseLookup();
                      }}
                    />
                    <Button
                      onClick={handleReverseLookup}
                      disabled={reverseLookupMutation.isPending || !ip.trim()}
                    >
                      {reverseLookupMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Lookup
                    </Button>
                  </div>
                </div>

                {reverseLookupMutation.data && (
                  <div className="mt-6 bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-3">Results</h3>
                    {reverseLookupMutation.data.status === "✓" ? (
                      <div className="space-y-2">
                        {reverseLookupMutation.data.hostnames.map((hostname, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-background p-2 rounded"
                          >
                            <code className="text-sm">{hostname}</code>
                            <button
                              onClick={() => copyToClipboard(hostname)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">
                        {reverseLookupMutation.data.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Batch Check */}
          <TabsContent value="batch" className="space-y-4">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">
                    Domains (one per line)
                  </label>
                  <textarea
                    placeholder="example.com&#10;test.com&#10;sample.org"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-mono"
                  />
                  <Button
                    onClick={handleBatchCheck}
                    disabled={batchCheckMutation.isPending || !domains.trim()}
                    className="mt-4"
                  >
                    {batchCheckMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Check All
                  </Button>
                </div>

                {batchCheckMutation.data && (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-4 text-sm">
                      <div className="bg-green-500/10 text-green-700 px-3 py-2 rounded">
                        ✓ Healthy: {batchCheckMutation.data.healthy}
                      </div>
                      <div className="bg-destructive/10 text-destructive px-3 py-2 rounded">
                        ✗ Failed: {batchCheckMutation.data.failed}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {batchCheckMutation.data.results.map((result, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-muted p-3 rounded"
                        >
                          <div className="flex items-center gap-2">
                            {result.status === "✓" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                            <span className="text-sm font-medium">{result.domain}</span>
                          </div>
                          {result.ip && (
                            <code className="text-xs bg-background px-2 py-1 rounded">
                              {result.ip}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
