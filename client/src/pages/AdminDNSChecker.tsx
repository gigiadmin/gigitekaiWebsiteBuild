import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle, AlertCircle, Copy, Globe } from "lucide-react";

export default function AdminDNSChecker() {
  const [domain, setDomain] = useState("");
  const [ip, setIp] = useState("");
  const [domains, setDomains] = useState("");
  const [activeTab, setActiveTab] = useState("global");

  const checkDomainGlobalMutation = trpc.dnsChecker.checkDomainGlobal.useMutation();
  const checkDomainMutation = trpc.dnsChecker.checkDomain.useMutation();
  const healthCheckMutation = trpc.dnsChecker.checkDomainHealth.useMutation();
  const reverseLookupMutation = trpc.dnsChecker.reverseLookup.useMutation();
  const batchCheckMutation = trpc.dnsChecker.batchCheck.useMutation();

  const handleCheckDomainGlobal = async () => {
    if (!domain.trim()) return;
    await checkDomainGlobalMutation.mutateAsync({
      domain,
      recordTypes: ["A", "AAAA", "MX", "TXT", "NS"],
    });
  };

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

  const renderRecordValue = (value: any) => {
    if (!value) return "—";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      if (value.length === 0) return "—";
      if (typeof value[0] === "object") {
        return JSON.stringify(value, null, 2);
      }
      return value.join(", ");
    }
    if (typeof value === "object" && value.error) {
      return `❌ ${value.error}`;
    }
    return JSON.stringify(value, null, 2);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-foreground">Global DNS Checker</h1>
          </div>
          <p className="text-muted-foreground">
            Check DNS records across multiple global DNS servers (Google, Cloudflare, OpenDNS, Quad9, Verisign)
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger value="global" className="text-xs sm:text-sm px-2 py-2 truncate">Global Check</TabsTrigger>
            <TabsTrigger value="single" className="text-xs sm:text-sm px-2 py-2 truncate">Single Server</TabsTrigger>
            <TabsTrigger value="health" className="text-xs sm:text-sm px-2 py-2 truncate">Health Check</TabsTrigger>
            <TabsTrigger value="reverse" className="text-xs sm:text-sm px-2 py-2 truncate">Reverse Lookup</TabsTrigger>
            <TabsTrigger value="batch" className="text-xs sm:text-sm px-2 py-2 truncate">Batch Check</TabsTrigger>
          </TabsList>

          {/* Global DNS Check */}
          <TabsContent value="global" className="space-y-4">
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
                        if (e.key === "Enter") handleCheckDomainGlobal();
                      }}
                    />
                    <Button
                      onClick={handleCheckDomainGlobal}
                      disabled={checkDomainGlobalMutation.isPending || !domain.trim()}
                      className="bg-cyan-500 hover:bg-cyan-600"
                    >
                      {checkDomainGlobalMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Check Global
                    </Button>
                  </div>
                </div>

                {checkDomainGlobalMutation.data && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(checkDomainGlobalMutation.data.servers).map(
                        ([serverName, serverData]: any) => (
                          <Card key={serverName} className="p-4 bg-slate-900 border-cyan-500/20">
                            <div className="mb-3">
                              <h3 className="text-lg font-semibold text-cyan-400">
                                {serverName}
                              </h3>
                              <p className="text-xs text-muted-foreground">{serverData.ip}</p>
                            </div>

                            <div className="space-y-3">
                              {Object.entries(serverData.records).map(([recordType, records]: any) => (
                                <div key={recordType} className="border-l-2 border-cyan-500/30 pl-3">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="font-mono text-sm font-semibold text-cyan-300">
                                      {recordType}
                                    </span>
                                    {records.error && (
                                      <AlertCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                  <div className="text-sm text-foreground bg-slate-800/50 p-2 rounded font-mono break-all">
                                    {renderRecordValue(records)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {checkDomainGlobalMutation.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    Error: {(checkDomainGlobalMutation.error as any).message}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Single Server Check */}
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
                  <div className="space-y-3">
                    {Object.entries(checkDomainMutation.data.records).map(
                      ([recordType, records]: any) => (
                        <div key={recordType} className="border-l-2 border-cyan-500/30 pl-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-sm font-semibold text-cyan-300">
                              {recordType} Records
                            </span>
                            {records.error && (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          <div className="text-sm text-foreground bg-slate-800/50 p-2 rounded font-mono break-all">
                            {renderRecordValue(records)}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {checkDomainMutation.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    Error: {(checkDomainMutation.error as any).message}
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
                      Check Health
                    </Button>
                  </div>
                </div>

                {healthCheckMutation.data && (
                  <div className="space-y-3">
                    {Object.entries(healthCheckMutation.data.checks).map(
                      ([checkType, checkResult]: any) => (
                        <div key={checkType} className="flex items-start justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                          <div>
                            <span className="font-semibold text-cyan-300">{checkType}</span>
                            {checkResult.status === "✓" ? (
                              <CheckCircle className="w-5 h-5 text-green-400 inline ml-2" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-400 inline ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            {checkResult.status === "✓"
                              ? `${checkResult.records?.length || 0} records`
                              : checkResult.error}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {healthCheckMutation.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    Error: {(healthCheckMutation.error as any).message}
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
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {reverseLookupMutation.data.status === "✓"
                        ? `${reverseLookupMutation.data.hostnames.length} hostname(s) found`
                        : reverseLookupMutation.data.error}
                    </p>
                    {reverseLookupMutation.data.hostnames.map((hostname: string, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-800/50 rounded font-mono text-sm text-foreground">
                        {hostname}
                      </div>
                    ))}
                  </div>
                )}

                {reverseLookupMutation.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    Error: {(reverseLookupMutation.error as any).message}
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
                    placeholder="example.com&#10;test.com&#10;another.com"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    className="w-full h-32 p-2 bg-slate-800 border border-slate-700 rounded text-foreground font-mono text-sm"
                  />
                  <Button
                    onClick={handleBatchCheck}
                    disabled={batchCheckMutation.isPending || !domains.trim()}
                    className="mt-2"
                  >
                    {batchCheckMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Check All
                  </Button>
                </div>

                {batchCheckMutation.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 p-3 bg-slate-800/50 rounded">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-cyan-400">
                          {batchCheckMutation.data.total}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Healthy</p>
                        <p className="text-lg font-bold text-green-400">
                          {batchCheckMutation.data.healthy}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Failed</p>
                        <p className="text-lg font-bold text-red-400">
                          {batchCheckMutation.data.failed}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {batchCheckMutation.data.results.map(
                        (result: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 bg-slate-800/50 rounded text-sm"
                          >
                            <span className="font-mono">{result.domain}</span>
                            {result.status === "✓" ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">{result.ip}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400" />
                                <span className="text-red-400 text-xs">{result.error}</span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {batchCheckMutation.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                    Error: {(batchCheckMutation.error as any).message}
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
