import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Search, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { toast } from "sonner";

type SentimentType = "positive" | "negative" | "neutral";

interface CallTranscript {
  id: number;
  callId: string;
  transcript: string;
  summary: string;
  sentiment: SentimentType;
  topics: string[];
  duration: number;
  createdAt: Date;
  suggestedKBArticles?: string[];
}

export default function CallTranscriptSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | "all">("all");
  const [topicFilter, setTopicFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch call transcripts
  const { data: transcriptsData, isLoading } = trpc.helpdesk.searchCallTranscripts.useQuery({
    query: searchQuery,
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter,
    topics: topicFilter.length > 0 ? topicFilter : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  });

  const transcripts = transcriptsData?.transcripts || [];

  // Extract unique topics for filter
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    transcripts.forEach((t: CallTranscript) => {
      t.topics?.forEach((topic: string) => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, [transcripts]);

  // Handle topic filter toggle
  const toggleTopic = (topic: string) => {
    setTopicFilter((prev: string[]) =>
      prev.includes(topic) ? prev.filter((t: string) => t !== topic) : [...prev, topic]
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    if (transcripts.length === 0) {
      toast.error("No transcripts to export");
      return;
    }

    const headers = ["Call ID", "Date", "Duration (min)", "Sentiment", "Topics", "Summary"];
    const rows = transcripts.map((t: CallTranscript) => [
      t.callId,
      format(new Date(t.createdAt), "yyyy-MM-dd HH:mm"),
      Math.round(t.duration / 60),
      t.sentiment,
      t.topics.join("; "),
      t.summary.substring(0, 100),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-transcripts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Exported to CSV");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Call Transcript Search</h1>
          <p className="text-muted-foreground">
            Search and analyze call transcripts with AI-powered insights
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transcripts by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={exportToCSV} disabled={transcripts.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date From */}
              <div>
                <label className="block text-sm font-medium mb-2">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium mb-2">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>

              {/* Sentiment Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Sentiment</label>
                <select
                  value={sentimentFilter}
                  onChange={(e) => setSentimentFilter(e.target.value as SentimentType | "all")}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              {/* Results Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Results</label>
                <div className="px-3 py-2 border border-input rounded-md bg-muted">
                  {transcripts.length} transcript{transcripts.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Topic Filter */}
            {allTopics.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Topics
                </label>
                <div className="flex flex-wrap gap-2">
                      {allTopics.map((topic: string) => (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        topicFilter.includes(topic)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Loading transcripts...</p>
            </Card>
          ) : transcripts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No transcripts found. Try adjusting your filters.</p>
            </Card>
          ) : (
            transcripts.map((transcript: CallTranscript) => (
              <Card key={transcript.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Call {transcript.callId}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transcript.createdAt), "MMM d, yyyy HH:mm")} •{" "}
                      {Math.round(transcript.duration / 60)} min
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        transcript.sentiment === "positive"
                          ? "bg-green-100 text-green-800"
                          : transcript.sentiment === "negative"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {transcript.sentiment}
                    </span>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-foreground mb-4">{transcript.summary}</p>

                {/* Topics */}
                {transcript.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {transcript.topics.map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested KB Articles */}
                {transcript.suggestedKBArticles && transcript.suggestedKBArticles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Suggested KB Articles:
                    </p>
                    <ul className="space-y-1">
                      {transcript.suggestedKBArticles.map((article: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-600 hover:underline cursor-pointer">
                          • {article}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
