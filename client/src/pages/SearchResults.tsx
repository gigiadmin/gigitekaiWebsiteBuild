import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, AlertCircle, Loader2 } from "lucide-react";

/**
 * SearchResults Page
 * Displays search results with filters, sorting, and analytics tracking
 */
export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const query = searchParams.get("q") || "";
  const sessionId = searchParams.get("sessionId") || `session-${Date.now()}`;
  const contentType = searchParams.get("type") as any;

  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  // Fetch search results
  const { data: searchResults, isLoading, error } = trpc.search.query.useQuery(
    {
      q: query,
      contentType,
      limit,
      offset: currentPage * limit,
      sessionId,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      referrer: typeof document !== "undefined" ? document.referrer : "",
    },
    { enabled: query.length > 0 }
  );

  // Track result clicks
  const trackClickMutation = trpc.search.trackClick.useMutation();

  const handleResultClick = (resultId: number, resultUrl: string, position: number) => {
    trackClickMutation.mutate({
      sessionId,
      resultId,
      resultUrl,
      clickPosition: position + 1,
      query,
    });

    // Navigate to result
    window.location.href = resultUrl;
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Search GigitekAI</h1>
            <p className="text-gray-400">Enter a search query to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Search Results for <span className="text-cyan-400">"{query}"</span>
          </h1>
          {searchResults && (
            <p className="text-gray-400">
              Found {searchResults.total} result{searchResults.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-gray-300">Searching...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-300 font-semibold">Search Error</h3>
              <p className="text-red-200 text-sm">
                An error occurred while searching. Please try again.
              </p>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && searchResults && searchResults.total === 0 && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No results found</h2>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or browse our categories
            </p>
            <a
              href="/"
              className="inline-block px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Back to Home
            </a>
          </div>
        )}

        {/* Results List */}
        {!isLoading && searchResults && searchResults.total > 0 && (
          <div className="space-y-4">
            {searchResults.results.map((result, index) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result.id, result.url, index)}
                className="group bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500 rounded-lg p-5 cursor-pointer transition-all duration-200"
              >
                {/* Content Type Badge */}
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-block px-2 py-1 bg-cyan-900/50 text-cyan-300 text-xs font-semibold rounded">
                    {result.contentType.toUpperCase()}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {(result.popularity ?? 0) > 0 && `${result.popularity} views`}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors mb-2 line-clamp-2">
                  {result.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {result.excerpt}
                </p>

                {/* URL */}
                <div className="flex items-center gap-2">
                  <span className="text-cyan-500 text-xs font-mono">
                    {new URL(result.url, "https://gigitekai.com").pathname}
                  </span>
                </div>

                {/* Metadata */}
                {result.metadata && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(typeof result.metadata === "string" ? JSON.parse(result.metadata)?.tags : (typeof result.metadata === "string" ? JSON.parse(result.metadata || "{}") : result.metadata)?.tags) && Array.isArray((typeof result.metadata === "string" ? JSON.parse(result.metadata)?.tags : (typeof result.metadata === "string" ? JSON.parse(result.metadata || "{}") : result.metadata)?.tags)) && (
                      (typeof result.metadata === "string" ? JSON.parse(result.metadata)?.tags : (typeof result.metadata === "string" ? JSON.parse(result.metadata || "{}") : result.metadata)?.tags).slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-gray-700/50 text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Pagination */}
            {searchResults.total > limit && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-400">
                  Page {currentPage + 1} of {Math.ceil(searchResults.total / limit)}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={(currentPage + 1) * limit >= searchResults.total}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
