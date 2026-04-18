import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Star, ThumbsUp, ThumbsDown, ChevronLeft } from "lucide-react";
import { KBArticleContent } from "@/components/KBArticleContent";
import { KBFeedbackDialog } from "@/components/KBFeedbackDialog";

export default function KBPublic() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackArticleId, setFeedbackArticleId] = useState<number | null>(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Scroll to top when modal opens
  useEffect(() => {
    if (selectedArticle) {
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [selectedArticle]);

  // Handle scroll to prevent accidental article selection
  const handleScroll = () => {
    setIsScrolling(true);
    setTimeout(() => setIsScrolling(false), 300);
  };

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
          <>
            {/* Mobile Full-Screen Modal */}
            {selectedArticle && (
              <div className="fixed inset-0 bg-black/80 z-50 lg:hidden flex flex-col">
                <div className="w-full h-full bg-slate-800 overflow-y-auto flex flex-col">
                  <div className="p-6 pb-32">
                    <div className="flex justify-between items-start mb-4 sticky top-0 bg-slate-800 py-4 -mx-6 px-6 z-10 border-b border-slate-700">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                        aria-label="Back to KB list"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Back</span>
                      </button>
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
                        aria-label="Close"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedArticle.title}
                      </h2>
                      <Badge className={`text-xs border ${categoryColors[selectedArticle.category]}`}>
                        {selectedArticle.category}
                      </Badge>
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <KBArticleContent content={selectedArticle.content} />
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-700">
                      <p className="text-sm text-gray-400 mb-3">Was this article helpful?</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setFeedbackArticleId(selectedArticle.id);
                            setFeedbackMessageId(selectedArticle.id); // Using article ID as message ID for now
                            setFeedbackOpen(true);
                          }}
                          className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Yes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setFeedbackArticleId(selectedArticle.id);
                            setFeedbackMessageId(selectedArticle.id);
                            setFeedbackOpen(true);
                          }}
                          className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          No
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Article List */}
            <div className="lg:col-span-1 space-y-3 max-h-96 overflow-y-auto pr-2" onScroll={handleScroll}>
              {filteredArticles.map((article: any) => (
                <div
                  key={article.id}
                  onClick={() => !isScrolling && setSelectedArticle(article)}
                  onTouchEnd={() => !isScrolling && setSelectedArticle(article)}
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

            {/* Article Detail View - Desktop Only */}
            {selectedArticle && (
              <div className="hidden lg:block lg:col-span-2 w-full">
                <Card className="bg-slate-800 border-slate-700 p-6 w-full sticky top-20">
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
          </>
        )}
      </div>

      {/* Feedback Dialog */}
      {feedbackArticleId && feedbackMessageId && (
        <KBFeedbackDialog
          articleId={feedbackArticleId}
          messageId={feedbackMessageId}
          isOpen={feedbackOpen}
          onClose={() => {
            setFeedbackOpen(false);
            setFeedbackArticleId(null);
            setFeedbackMessageId(null);
          }}
          articleTitle={selectedArticle?.title || "Article"}
        />
      )}
    </div>
  );
}
