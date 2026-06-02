import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, MessageSquare, Star, TrendingUp } from "lucide-react";
import { Streamdown } from "@/components/GigitekMarkdown";

export default function ScriptsPortal() {
  const [selectedScript, setSelectedScript] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "popularity">("popularity");

  // Fetch scripts
  const { data: scripts, isLoading: scriptsLoading } = trpc.scripts.list.useQuery({
    search: searchQuery,
    category: selectedCategory || undefined,
    sort: sortBy,
    limit: 20,
  });

  // Fetch categories
  const { data: categories } = trpc.scripts.getCategories.useQuery();

  // Fetch stats
  const { data: stats } = trpc.scripts.getStats.useQuery();

  // Fetch selected script details
  const { data: selectedScriptData } = trpc.scripts.get.useQuery(
    { id: selectedScript! },
    { enabled: !!selectedScript }
  );

  // Fetch execution history
  const { data: executionHistory } = trpc.scripts.getExecutionHistory.useQuery(
    { scriptId: selectedScript!, limit: 10 },
    { enabled: !!selectedScript }
  );

  const downloadMutation = trpc.scripts.download.useMutation();
  const feedbackMutation = trpc.scripts.submitFeedback.useMutation();

  const handleDownload = (scriptId: number) => {
    downloadMutation.mutate({ scriptId });
  };

  const handleSubmitFeedback = (type: "Bug" | "Feature Request" | "General", message: string) => {
    if (selectedScript) {
      feedbackMutation.mutate({ scriptId: selectedScript, type, message });
    }
  };

  const difficultyColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">GigitekAI Scripts Portal</h1>
          <p className="text-xl text-slate-300">
            Powerful PowerShell automation scripts for Microsoft 365, Azure, Teams, and more
          </p>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div>
                <div className="text-3xl font-bold">{stats.totalScripts}</div>
                <div className="text-slate-300">Total Scripts</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.totalDownloads}</div>
                <div className="text-slate-300">Total Downloads</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{stats.categories}</div>
                <div className="text-slate-300">Categories</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Search</label>
                <Input
                  placeholder="Search scripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`block w-full text-left px-3 py-2 rounded ${
                      selectedCategory === null
                        ? "bg-blue-100 text-blue-900"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories?.map((cat: string) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`block w-full text-left px-3 py-2 rounded ${
                        selectedCategory === cat
                          ? "bg-blue-100 text-blue-900"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="date">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scripts List */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Available Scripts</h2>
                {scriptsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : scripts && scripts.length > 0 ? (
                  <div className="space-y-4">
                    {scripts.map((script: typeof scripts[0]) => (
                      <Card
                        key={script.id}
                        className={`p-4 cursor-pointer transition ${
                          selectedScript === script.id
                            ? "border-blue-500 border-2 bg-blue-50"
                            : "hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedScript(script.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{script.name}</h3>
                          <Badge variant="outline">{script.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{script.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex gap-2">
                            <Badge className={difficultyColor(script.difficulty_level || "Beginner")}>
                              {script.difficulty_level}
                            </Badge>
                            <Badge variant="secondary">v{script.version}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={16} />
                            {script.rating || "0"}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <TrendingUp size={12} className="inline mr-1" />
                          {script.download_count} downloads
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No scripts found</p>
                )}
              </div>

              {/* Script Details */}
              <div>
                {selectedScriptData ? (
                  <Card className="p-6 sticky top-4">
                    <h2 className="text-2xl font-bold mb-4">{selectedScriptData.name}</h2>

                    {/* Metadata */}
                    <div className="space-y-3 mb-6 pb-6 border-b">
                      <div>
                        <span className="text-sm text-gray-600">Author:</span>
                        <p className="font-medium">{selectedScriptData.author}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Version:</span>
                        <p className="font-medium">{selectedScriptData.version}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Category:</span>
                        <p className="font-medium">{selectedScriptData.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Difficulty:</span>
                        <p className="font-medium">{selectedScriptData.difficulty_level}</p>
                      </div>
                    </div>

                    {/* Documentation */}
                    <div className="mb-6">
                      <h3 className="font-bold mb-2">Documentation</h3>
                      <div className="bg-gray-50 p-3 rounded text-sm max-h-48 overflow-y-auto">
                        <Streamdown>{String(selectedScriptData.documentation ?? '')}</Streamdown>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 mb-6">
                      <Button
                        onClick={() => handleDownload(selectedScriptData.id)}
                        className="w-full"
                        disabled={downloadMutation.isPending}
                      >
                        <Download size={16} className="mr-2" />
                        Download Script
                      </Button>
                      <Button variant="outline" className="w-full" asChild>
                        <a href={selectedScriptData.github_url} target="_blank" rel="noopener noreferrer">
                          View on GitHub
                        </a>
                      </Button>
                    </div>

                    {/* Execution History */}
                    {executionHistory && executionHistory.length > 0 && (
                      <div className="mb-6 pb-6 border-t">
                        <h3 className="font-bold mb-3">Recent Executions</h3>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {executionHistory.map((exec: typeof executionHistory[0]) => (
                            <div key={exec.id} className="text-sm bg-gray-50 p-2 rounded">
                              <div className="flex justify-between">
                                <span className="font-medium">{exec.status}</span>
                                <span className="text-gray-500">{exec.duration_ms}ms</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(exec.executed_at).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback */}
                    <div className="pt-6 border-t">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <MessageSquare size={16} />
                        Send Feedback
                      </h3>
                      <div className="space-y-2">
                        <select
                          onChange={(e) => {
                            const message = prompt("Enter your feedback:");
                            if (message) {
                              handleSubmitFeedback(e.target.value as any, message);
                            }
                          }}
                          className="w-full px-3 py-2 border rounded text-sm"
                          defaultValue=""
                        >
                          <option value="">Select feedback type...</option>
                          <option value="Bug">Report a Bug</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="General">General Feedback</option>
                        </select>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 text-center text-gray-500">
                    <p>Select a script to view details</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
