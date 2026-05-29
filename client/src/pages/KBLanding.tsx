import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Lock, Printer, Mail, Zap, Wifi, Cloud, ArrowRight, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

const COMMON_ISSUES = [
  {
    id: 1,
    title: "Password Lockout",
    description: "Account locked or can't reset password",
    icon: Lock,
    color: "from-red-500/20 to-red-600/20",
    borderColor: "border-red-500/30",
  },
  {
    id: 2,
    title: "Can't Print",
    description: "Printer not responding or offline",
    icon: Printer,
    color: "from-orange-500/20 to-orange-600/20",
    borderColor: "border-orange-500/30",
  },
  {
    id: 3,
    title: "Email Not Sending",
    description: "Emails stuck in outbox or failing",
    icon: Mail,
    color: "from-yellow-500/20 to-yellow-600/20",
    borderColor: "border-yellow-500/30",
  },
  {
    id: 4,
    title: "Windows Crashes",
    description: "System crashes or blue screen errors",
    icon: Zap,
    color: "from-purple-500/20 to-purple-600/20",
    borderColor: "border-purple-500/30",
  },
  {
    id: 5,
    title: "Network Issues",
    description: "No internet or slow connection",
    icon: Wifi,
    color: "from-blue-500/20 to-blue-600/20",
    borderColor: "border-blue-500/30",
  },
  {
    id: 6,
    title: "Device Sync",
    description: "Files not syncing across devices",
    icon: Cloud,
    color: "from-cyan-500/20 to-cyan-600/20",
    borderColor: "border-cyan-500/30",
  },
];

export default function KBLanding() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Fetch common issues from database
  const { data: dbCommonIssues = [], isLoading: isLoadingIssues } = trpc.kb.getCommonIssues.useQuery();

  // Fetch trending articles
  const { data: trendingArticles = [], isLoading: isLoadingTrending } = trpc.kb.getTrendingArticles.useQuery({ limit: 3 });

  // Search query (lazy - only runs when activeSearch is non-empty)
  const [activeSearch, setActiveSearch] = useState("");
  const { data: searchResults = [], isFetching: isSearching } = trpc.kb.search.useQuery(
    { query: activeSearch },
    { enabled: activeSearch.trim().length > 0 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Knowledge Base
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Find instant solutions to common IT issues. Explore our comprehensive library of articles, guides, and troubleshooting steps.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center">
                <Input
                  type="text"
                  placeholder="Search articles, guides, troubleshooting..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-lg"
                />
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md px-4 py-2"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Top 6 Common Issues Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Top Issues</h2>
          <p className="text-slate-300">Quick solutions to the most common problems our users face</p>
        </div>

        {isLoadingIssues ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMMON_ISSUES.map((issue) => {
              const IconComponent = issue.icon;
              const dbIssue = dbCommonIssues.find((i) => i.id === issue.id);

              return (
                <div
                  key={issue.id}
                  className={`group relative p-6 rounded-lg border ${issue.borderColor} bg-gradient-to-br ${issue.color} backdrop-blur-sm hover:border-cyan-500/60 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-cyan-500/20`}
                  onClick={() => {
                    if (dbIssue?.articleId) {
                      navigate(`/kb/article/${dbIssue.articleId}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg group-hover:bg-slate-700/50 transition-colors">
                      <IconComponent className="w-6 h-6 text-cyan-400" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {issue.title}
                  </h3>
                  <p className="text-sm text-slate-300 mb-4">
                    {issue.description}
                  </p>

                  <div className="pt-4 border-t border-slate-700/50">
                    <span className="text-xs text-cyan-400 font-medium">View Solution →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Articles Section */}
      <div className="container mx-auto px-4 py-20 border-t border-slate-800">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">Trending Articles</h2>
          </div>
          <p className="text-slate-300">Most viewed and helpful articles this week</p>
        </div>

        {isLoadingTrending ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingArticles.map((article) => (
              <div
                key={article.id}
                className="p-6 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/kb/article/${article.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-500/10 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400">{article.viewCount || 0} views</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                  {article.content?.substring(0, 100)}...
                </p>

                {article.averageRating && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-full ${
                            i < Math.round(parseFloat(String(article.averageRating || 0)))
                              ? "bg-cyan-500"
                              : "bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">
                      {parseFloat(String(article.averageRating || 0)).toFixed(1)} ({article.ratingCount} ratings)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20 border-t border-slate-800">
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Can't find what you're looking for?</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Our support team is ready to help. Create a ticket or contact us directly for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-semibold">
              Create Support Ticket
            </Button>
            <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 rounded-lg font-semibold">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
