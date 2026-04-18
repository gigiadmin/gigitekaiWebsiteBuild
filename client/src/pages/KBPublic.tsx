import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Star } from "lucide-react";
import { KBArticleContent } from "@/components/KBArticleContent";

export default function KBPublic() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // Fetch published KB articles
  const { data: articles, isLoading } = trpc.kb.list.useQuery(
    { includeUnpublished: false },
    { enabled: true }
  );

  // Filter articles
  const filteredArticles = articles?.filter((article: any) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags && article.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories
  const categories = Array.from(
    new Set(articles?.map((a: any) => a.category) || [])
  );

  const categoryColors: Record<string, string> = {
    "Tier 1 - Account & Authentication": "bg-blue-900/40 text-blue-400",
    "Tier 1 - Network & Connectivity": "bg-purple-900/40 text-purple-400",
    "Tier 1 - Email & Communication": "bg-cyan-900/40 text-cyan-400",
    "Tier 1 - Hardware & Peripherals": "bg-amber-900/40 text-amber-400",
    "Tier 1 - Software & Applications": "bg-green-900/40 text-green-400",
    "Tier 2 - Microsoft 365": "bg-indigo-900/40 text-indigo-400",
    "Tier 2 - Performance & Optimization": "bg-pink-900/40 text-pink-400",
    "Tier 2 - Network Administration": "bg-violet-900/40 text-violet-400",
    "Tier 2 - Security & Compliance": "bg-red-900/40 text-red-400",
    "Tier 2 - Backup & Recovery": "bg-orange-900/40 text-orange-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Knowledge Base</h1>
          </div>
          <p className="text-gray-400">
            Find answers to common IT issues and troubleshooting guides
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-500"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-cyan-600" : "border-slate-600"}
            >
              All Categories
            </Button>
            {categories.map((cat: string) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-cyan-600" : "border-slate-600"}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No articles found</p>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article List */}
            <div className="lg:col-span-1 space-y-3">
              {filteredArticles.map((article: any) => (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  onTouchEnd={() => setSelectedArticle(article)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedArticle(article);
                    }
                  }}
                  className={`p-4 cursor-pointer transition-all border rounded-md ${
                    selectedArticle?.id === article.id
                      ? "bg-slate-700 border-cyan-500"
                      : "bg-slate-800 border-slate-700 hover:border-slate-600 active:border-cyan-500"
                  }`}
                >
                  <h3 className="font-semibold text-white text-sm line-clamp-2">
                    {article.title}
                  </h3>
                  <Badge
                    className={`mt-2 text-xs border ${
                      categoryColors[article.category] ||
                      "bg-slate-700 text-gray-400"
                    }`}
                  >
                    {article.category}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Article Detail View */}
            {selectedArticle && (
              <div className="lg:col-span-2 w-full">
                <Card className="bg-slate-800 border-slate-700 p-6 w-full">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedArticle.title}
                    </h2>
                    <Badge className={`text-xs border ${categoryColors[selectedArticle.category]}`}>
                      {selectedArticle.category}
                    </Badge>
                  </div>

                  {/* Article Content */}
                  <div className="prose prose-invert max-w-none">
                    <KBArticleContent content={selectedArticle.content} />
                  </div>

                  {/* Article Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-700 flex items-center gap-2 text-sm text-gray-400">
                    <Star className="w-4 h-4" />
                    <span>Was this article helpful?</span>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
