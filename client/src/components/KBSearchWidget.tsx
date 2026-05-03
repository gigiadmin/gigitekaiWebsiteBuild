import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, BookOpen, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KBSearchWidgetProps {
  ticketTitle: string;
  ticketDescription: string;
  onArticleSelect?: (articleId: number, articleTitle: string) => void;
}

export function KBSearchWidget({ ticketTitle, ticketDescription, onArticleSelect }: KBSearchWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  // Memoize query object to prevent infinite re-renders
  const queryInput = useMemo(
    () => ({ query: searchQuery || `${ticketTitle} ${ticketDescription}`, limit: 5 }),
    [searchQuery, ticketTitle, ticketDescription]
  );

  // Search KB articles based on ticket content
  const { data: searchResults, isLoading } = trpc.helpdeskKb.search.useQuery(
    queryInput,
    { enabled: !!ticketTitle || !!ticketDescription }
  );

  // Auto-search when ticket content changes
  useEffect(() => {
    if (ticketTitle.length > 5 || ticketDescription.length > 10) {
      setShowResults(true);
    }
  }, [ticketTitle, ticketDescription]);

  // Memoize callback to prevent unnecessary re-renders of parent
  const handleArticleClick = useCallback((articleId: number, articleTitle: string) => {
    setSelectedArticle(articleId);
    if (onArticleSelect) {
      onArticleSelect(articleId, articleTitle);
    }
  }, [onArticleSelect]);

  return (
    <div className="bg-[#141B2D]/40 border border-cyan-500/20 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-cyan-300">Suggested Articles</h3>
        <span className="text-xs text-gray-500 ml-auto">
          {searchResults?.length || 0} results
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0A0E1A] border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-xs text-gray-500 ml-2">Searching articles...</span>
        </div>
      ) : searchResults && searchResults.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.map((article: any) => (
            <button
              key={article.id}
              onClick={() => handleArticleClick(article.id, article.title)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedArticle === article.id
                  ? "bg-cyan-500/20 border-cyan-500/50"
                  : "bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/40 hover:border-gray-600/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <ChevronRight className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                  selectedArticle === article.id ? "text-cyan-400" : "text-gray-600"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300 truncate">{article.title}</p>
                  {article.excerpt && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{article.excerpt}</p>
                  )}
                  {article.category && (
                    <span className="inline-block text-xs text-cyan-400/70 bg-cyan-500/10 px-2 py-0.5 rounded mt-1">
                      {article.category}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : showResults && !isLoading ? (
        <div className="flex items-center gap-2 py-4 text-gray-500">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">No matching articles found. You can still create a ticket.</p>
        </div>
      ) : null}

      {/* Info Message */}
      {selectedArticle && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
          <p className="text-xs text-cyan-300">
            ✓ Article selected. Review the KB article before creating your ticket to see if it resolves your issue.
          </p>
        </div>
      )}
    </div>
  );
}
