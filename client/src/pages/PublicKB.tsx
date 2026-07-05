import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Search, Lock, Printer, Mail, Zap, Wifi, Cloud,
  ArrowRight, TrendingUp, BookOpen, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { useLocation } from "wouter";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";

// Strip markdown syntax for a clean preview snippet
function getContentPreview(text: string, maxLen = 160): string {
  const lines = text.split("\n");
  const contentLines = lines.filter((line) => {
    const t = line.trim();
    if (!t) return false;
    if (t.startsWith("#")) return false;
    if (/^\*\*(Category|Tier|Difficulty|Audience|Article Code|Tags|Estimated)/.test(t)) return false;
    return true;
  });
  const raw = contentLines
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!?\[([^\]]*?)\]\([^)]*\)/g, "$1")
    .replace(/^[-*+>]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return raw.length > maxLen ? raw.substring(0, maxLen) + "…" : raw;
}

const COMMON_ISSUES = [
  { id: 1, title: "Password Lockout", description: "Account locked or can't reset password", icon: Lock, color: "from-red-500/20 to-red-600/20", borderColor: "border-red-500/30" },
  { id: 2, title: "Can't Print", description: "Printer not responding or offline", icon: Printer, color: "from-orange-500/20 to-orange-600/20", borderColor: "border-orange-500/30" },
  { id: 3, title: "Email Not Sending", description: "Emails stuck in outbox or failing", icon: Mail, color: "from-yellow-500/20 to-yellow-600/20", borderColor: "border-yellow-500/30" },
  { id: 4, title: "Windows Crashes", description: "System crashes or blue screen errors", icon: Zap, color: "from-purple-500/20 to-purple-600/20", borderColor: "border-purple-500/30" },
  { id: 5, title: "Network Issues", description: "No internet or slow connection", icon: Wifi, color: "from-blue-500/20 to-blue-600/20", borderColor: "border-blue-500/30" },
  { id: 6, title: "Device Sync", description: "Files not syncing across devices", icon: Cloud, color: "from-cyan-500/20 to-cyan-600/20", borderColor: "border-cyan-500/30" },
];

type KbArticle = {
  id: number;
  title: string;
  content: string;
  category: string;
  tags?: string | null;
  viewCount?: number | null;
  averageRating?: string | null;
  difficulty?: string | null;
  ratingCount?: number | null;
};

const PAGE_SIZE = 24;

export default function PublicKB() {
  const [, navigate] = useLocation();

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Browse state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // --- Data fetching ---
  const { data: dbCommonIssues = [] } = trpc.kb.getCommonIssues.useQuery();
  const { data: trendingArticles = [], isLoading: isLoadingTrending } = trpc.kb.getTrendingArticles.useQuery({ limit: 6 });
  const { data: categoriesRaw = [] } = trpc.kb.getCategories.useQuery();
  const categories = categoriesRaw.map((cat: string) => ({ category: cat, count: 0 }));

  // Paginated browse
  const { data: browseData, isLoading: isLoadingBrowse } = trpc.kb.listPaginated.useQuery(
    { category: selectedCategory === "All" ? undefined : selectedCategory, page: currentPage, pageSize: PAGE_SIZE }
  );
  const browseArticles = browseData?.articles ?? [];
  const browseTotal = browseData?.total ?? 0;
  const totalPages = Math.ceil(browseTotal / PAGE_SIZE);

  // Live search (server-side, triggered on submit)
  const { data: searchResults = [], isFetching: isSearching } = trpc.kb.search.useQuery(
    { query: activeSearch, limit: 30 },
    { enabled: activeSearch.trim().length > 1 }
  );

  // Dropdown suggestions (client-side instant, from first 200 browse results)
  const { data: allForDropdown } = trpc.kb.listPaginated.useQuery(
    { page: 1, pageSize: 50 },
    { enabled: searchInput.trim().length > 1 }
  );
  const dropdownSuggestions = useMemo(() => {
    if (!searchInput.trim()) return [];
    const q = searchInput.toLowerCase();
    return (allForDropdown?.articles ?? [])
      .filter((a: { id: number; title: string; tags?: string | null; category: string }) =>
        a.title.toLowerCase().includes(q) ||
        (a.tags && a.tags.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchInput, allForDropdown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length > 1) {
      setActiveSearch(searchInput.trim());
      setShowDropdown(false);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setActiveSearch("");
    setShowDropdown(false);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const isSearchMode = activeSearch.trim().length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <SiteNavBar2024 />

      {/* ── Hero / Search ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              {browseTotal > 0
                ? `${browseTotal.toLocaleString()}+ articles — instant solutions to common IT issues.`
                : "Find instant solutions to common IT issues."}
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Search articles, guides, troubleshooting…"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value.trim()) setActiveSearch("");
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full pl-6 pr-24 py-4 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-lg"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-14 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md px-4 py-2"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </Button>
              </div>

              {/* Instant dropdown suggestions */}
              {showDropdown && dropdownSuggestions.length > 0 && !isSearchMode && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-cyan-500/30 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {dropdownSuggestions.map((a: KbArticle) => (
                    <div
                      key={a.id}
                      className="px-4 py-3 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onMouseDown={() => navigate(`/kb/${a.id}`)}
                    >
                      <p className="text-white font-medium text-sm">{a.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{a.category}</p>
                    </div>
                  ))}
                  <div
                    className="px-4 py-3 text-center text-cyan-400 text-sm hover:bg-slate-700/30 cursor-pointer"
                    onMouseDown={handleSearch as any}
                  >
                    See all results for "{searchInput}" →
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ── Search Results ── */}
      {isSearchMode && (
        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isSearching ? "Searching…" : `${searchResults.length} results for "${activeSearch}"`}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Ranked by relevance</p>
            </div>
            <Button variant="outline" onClick={clearSearch} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <X className="w-4 h-4 mr-2" /> Clear search
            </Button>
          </div>

          {isSearching ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No articles found for "{activeSearch}"</p>
              <p className="text-slate-500 text-sm mt-2">Try different keywords or browse by category below</p>
              <Button onClick={clearSearch} className="mt-6 bg-cyan-600 hover:bg-cyan-700">Browse All Articles</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {searchResults.map((article) => (
                <ArticleCard key={article.id} article={article} onClick={() => navigate(`/kb/${article.id}`)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top Issues (only when not searching) ── */}
      {!isSearchMode && (
        <>
          <div className="container mx-auto px-4 py-16">
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Top Issues</h2>
              <p className="text-slate-400">Quick solutions to the most common problems</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {COMMON_ISSUES.map((issue) => {
                const IconComponent = issue.icon;
                const dbIssue = dbCommonIssues.find((i) => i.id === issue.id);
                return (
                  <div
                    key={issue.id}
                    className={`group relative p-6 rounded-lg border ${issue.borderColor} bg-gradient-to-br ${issue.color} backdrop-blur-sm hover:border-cyan-500/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10`}
                    onClick={() => { if (dbIssue?.articleId) navigate(`/kb/${dbIssue.articleId}`); }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-slate-800/50 rounded-lg group-hover:bg-slate-700/50 transition-colors">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">{issue.title}</h3>
                    <p className="text-sm text-slate-300 mb-4">{issue.description}</p>
                    <div className="pt-4 border-t border-slate-700/50">
                      <span className="text-xs text-cyan-400 font-medium">View Solution →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Trending Articles ── */}
          <div className="container mx-auto px-4 py-16 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-10">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Trending Articles</h2>
                <p className="text-slate-400 mt-1">Most viewed articles this week</p>
              </div>
            </div>
            {isLoadingTrending ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trendingArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} onClick={() => navigate(`/kb/${article.id}`)} showViews />
                ))}
              </div>
            )}
          </div>

          {/* ── Browse All Articles ── */}
          <div className="container mx-auto px-4 py-16 border-t border-slate-800">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                <h2 className="text-3xl md:text-4xl font-bold text-white">Browse All Articles</h2>
              </div>
              <p className="text-slate-400">
                {browseTotal > 0 ? `${browseTotal.toLocaleString()} published articles` : "Loading…"}
              </p>
            </div>

            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              <CategoryPill label="All" count={browseTotal} active={selectedCategory === "All"} onClick={() => handleCategoryChange("All")} />
              {categories.map((cat) => (
                <CategoryPill
                  key={cat.category}
                  label={cat.category}
                  count={Number(cat.count)}
                  active={selectedCategory === cat.category}
                  onClick={() => handleCategoryChange(cat.category)}
                />
              ))}
            </div>

            {/* Article grid */}
            {isLoadingBrowse ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
            ) : browseArticles.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No articles in this category yet.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {browseArticles.map((article: KbArticle) => (
                    <ArticleCard key={article.id} article={article} onClick={() => navigate(`/kb/${article.id}`)} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-12">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 7) {
                          page = i + 1;
                        } else if (currentPage <= 4) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 3) {
                          page = totalPages - 6 + i;
                        } else {
                          page = currentPage - 3 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                              page === currentPage
                                ? "bg-cyan-600 text-white"
                                : "text-slate-400 hover:bg-slate-700 hover:text-white"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
                <p className="text-center text-slate-500 text-sm mt-4">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, browseTotal)} of {browseTotal.toLocaleString()} articles
                </p>
              </>
            )}
          </div>
        </>
      )}

      {/* ── CTA ── */}
      <div className="container mx-auto px-4 py-20 border-t border-slate-800">
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Can't find what you're looking for?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Our support team is ready to help. Create a ticket or contact us directly for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-semibold" onClick={() => navigate("/support")}>
              Create Support Ticket
            </Button>
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg font-semibold" onClick={() => navigate("/contact")}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Reusable Article Card ──
function ArticleCard({
  article,
  onClick,
  showViews = false,
}: {
  article: { id: number; title: string; category: string; content: string; tags?: string | null; viewCount?: number | null; averageRating?: string | null; difficulty?: string | null };
  onClick: () => void;
  showViews?: boolean;
}) {
  const difficultyColor: Record<string, string> = {
    beginner: "text-green-400 bg-green-500/10",
    intermediate: "text-yellow-400 bg-yellow-500/10",
    advanced: "text-red-400 bg-red-500/10",
  };
  const dc = difficultyColor[article.difficulty ?? ""] ?? "text-slate-400 bg-slate-500/10";

  return (
    <div
      className="p-5 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer group flex flex-col"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="px-2.5 py-1 text-xs font-medium text-cyan-300 bg-cyan-500/10 rounded-full truncate max-w-[70%]">
          {article.category}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {article.difficulty && (
            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${dc}`}>{article.difficulty}</span>
          )}
          {showViews && (
            <span className="text-xs text-slate-500">{article.viewCount ?? 0} views</span>
          )}
        </div>
      </div>

      <h3 className="text-base font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2 flex-1">
        {article.title}
      </h3>

      <p className="text-sm text-slate-400 line-clamp-2 mb-3">
        {getContentPreview(article.content ?? "")}
      </p>

      {article.tags && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {article.tags.split(",").slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-xs text-slate-500 bg-slate-700/50 rounded">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category Filter Pill ──
function CategoryPill({
  label, count, active, onClick,
}: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
        active
          ? "bg-cyan-600 text-white border-cyan-600"
          : "bg-slate-800/50 text-slate-300 border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300"
      }`}
    >
      {label} <span className={`ml-1 text-xs ${active ? "text-cyan-200" : "text-slate-500"}`}>({count})</span>
    </button>
  );
}
