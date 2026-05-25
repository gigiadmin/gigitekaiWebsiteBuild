import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

/**
 * Admin Search Index Management Page
 * Allows admins to populate and manage the search index
 */
export default function AdminSearchIndexPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<any>(null);

  const populateIndexMutation = trpc.adminSearchIndex.populateIndex.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(`Successfully indexed ${data.totalIndexed} items`);
      setResults(data.results);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(`Error: ${error.message}`);
    },
  });

  const clearIndexMutation = trpc.adminSearchIndex.clearIndex.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Search index cleared successfully");
      setResults(null);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(`Error: ${error.message}`);
    },
  });

  const getStatsMutation = trpc.adminSearchIndex.getStats.useQuery();

  const handlePopulateIndex = async () => {
    setStatus("loading");
    setMessage("Populating search index...");
    populateIndexMutation.mutate({
      contentTypes: ["blog", "kb", "service", "industry"],
    });
  };

  const handleClearIndex = async () => {
    if (confirm("Are you sure you want to clear the search index? This cannot be undone.")) {
      setStatus("loading");
      setMessage("Clearing search index...");
      clearIndexMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Search Index Management
        </h1>

        {/* Current Stats */}
        {getStatsMutation.data && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Current Index Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getStatsMutation.data.total}
                </p>
              </div>
              {Object.entries(getStatsMutation.data.byType).map(([type, count]) => (
                <div key={type}>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{type}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count as number}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Message */}
        {status !== "idle" && (
          <div
            className={`rounded-lg p-4 mb-6 flex items-start gap-3 ${
              status === "success"
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : status === "error"
                  ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {status === "loading" && (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            {status === "success" && (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            )}
            {status === "error" && (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={
                  status === "success"
                    ? "text-green-900 dark:text-green-100"
                    : status === "error"
                      ? "text-red-900 dark:text-red-100"
                      : "text-blue-900 dark:text-blue-100"
                }
              >
                {message}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Indexing Results
            </h3>
            <div className="space-y-2">
              {results.map((result: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{result.type}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{result.count} items</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handlePopulateIndex}
            disabled={populateIndexMutation.isPending || status === "loading"}
            className="w-full"
            size="lg"
          >
            {populateIndexMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Populating...
              </>
            ) : (
              "Populate Search Index"
            )}
          </Button>

          <Button
            onClick={handleClearIndex}
            disabled={clearIndexMutation.isPending || status === "loading"}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            {clearIndexMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear Search Index"
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>Click "Populate Search Index" to index all blog posts, KB articles, services, and industries</li>
            <li>This will make the search functionality return relevant results</li>
            <li>Check "Current Index Stats" to see how many items have been indexed</li>
            <li>Use "Clear Search Index" only if you need to start over</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
