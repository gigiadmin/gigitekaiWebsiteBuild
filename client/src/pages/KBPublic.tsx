import ScrollToTop from "@/components/ScrollToTop";
import { useState, useEffect, useRef, useCallback } from "react";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Star, ThumbsUp, ThumbsDown, ChevronLeft, Share2, Linkedin, Twitter, Facebook, Mail, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { KBArticleContent } from "@/components/KBArticleContent";
import { KBFeedbackDialog } from "@/components/KBFeedbackDialog";
import { useSEO } from "@/hooks/useSEO";
import { SEO_CONFIG } from "@/lib/seoConfig";

export default function KBPublic() {
  useSEO({ ...SEO_CONFIG["/kb"], path: "/kb" });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackArticleId, setFeedbackArticleId] = useState<number | null>(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollStartY, setScrollStartY] = useState(0);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Search analytics tracking
  const recordSearchMutation = trpc.kbSearchAnalytics.recordSearch.useMutation();
  const recordClickMutation = trpc.kbSearchAnalytics.recordClick.useMutation();
  const searchTrackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackedQuery = useRef("");

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
    setTimeout(() => setIsScrolling(false), 500);
  };

  // Handle pointer down to track scroll intent
  const handlePointerDown = (e: React.PointerEvent) => {
    setScrollStartY(e.clientY);
  };

  // Handle pointer up to detect if it was a scroll or click
  const handlePointerUp = (e: React.PointerEvent, article: any) => {
    const moveDistance = Math.abs(e.clientY - scrollStartY);
    // Only select if pointer moved less than 10px (not a scroll)
    if (moveDistance < 10 && !isScrolling) {
      handleArticleClick(article);
    }
  };

  // Fetch published KB articles
  const { data: articles, isLoading } = trpc.kb.list.useQuery(
    { includeUnpublished: false },
    { enabled: true }
  );

  // Email KB article handler using tRPC
  const emailMutation = trpc.kb.emailArticle.useMutation();
  const handleEmailArticle = async () => {
    if (!emailAddress || !selectedArticle) return;
    setEmailLoading(true);
    try {
      await emailMutation.mutateAsync({
        recipientEmail: emailAddress,
        articleId: selectedArticle.id,
        articleTitle: selectedArticle.title,
        articleContent: selectedArticle.content,
        articleCategory: selectedArticle.category,
      });
      alert(`KB article sent to ${emailAddress}`);
      setEmailOpen(false);
      setEmailAddress("");
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error sending email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Debounced search tracking — fires 1.5s after user stops typing
  useEffect(() => {
    if (searchTrackTimerRef.current) clearTimeout(searchTrackTimerRef.current);
    if (searchQuery.trim().length < 2) return;
    searchTrackTimerRef.current = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q === lastTrackedQuery.current) return;
      lastTrackedQuery.current = q;
      const count = (articles || []).filter((a: any) => {
        const matchesSearch =
          a.title.toLowerCase().includes(q) ||
          (a.tags && a.tags.toLowerCase().includes(q));
        const matchesCategory = !selectedCategory || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }).length;
      recordSearchMutation.mutate({ query: q, resultsCount: count, source: "kb_portal" });
    }, 1500);
    return () => { if (searchTrackTimerRef.current) clearTimeout(searchTrackTimerRef.current); };
  }, [searchQuery, articles, selectedCategory]);

  // Track article click from search context
  const handleArticleClick = useCallback((article: any) => {
    setSelectedArticle(article);
    if (searchQuery.trim().length >= 2) {
      recordClickMutation.mutate({
        query: searchQuery.trim().toLowerCase(),
        articleId: article.id,
        source: "kb_portal",
      });
    }
  }, [searchQuery]);

  // Separate MS Learn articles from manual KB articles
  const msLearnArticles = articles?.filter((a: any) => a.syncSource === 'ms-learn') || [];
  const manualArticles = articles?.filter((a: any) => a.syncSource !== 'ms-learn') || [];

  // Filter articles (manual KB articles for the main list; MS Learn shown separately)
  const filteredArticles = (searchQuery ? articles : manualArticles)?.filter((article: any) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags && article.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  // Get unique categories (from manual articles only for the category filter)
  const categories = Array.from(
    new Set(manualArticles?.map((a: any) => a.category) || [])
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
      <SiteNavBar2024 />
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-4">
            <ArrowRight size={18} className="rotate-180" />
            <span className="text-sm">Back to Home</span>
          </Link>
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

            {/* Desktop Modal with Left Sidebar */}
            {selectedArticle && (
              <div className="fixed inset-0 bg-black/80 z-[9999] flex">
                <div className="flex w-full h-full flex-col md:flex-row">
                  {/* Left Sidebar - Article List */}
                  <div className="w-full md:w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto flex flex-col max-h-[40vh] md:max-h-full">
                    <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-sm"
                        aria-label="Close KB preview"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back to KB</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {filteredArticles.map((article: any) => (
                        <div
                          key={article.id}
                          onPointerDown={handlePointerDown}
                          onPointerUp={(e) => handlePointerUp(e, article)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleArticleClick(article);
                            }
                          }}
                          className={`p-4 cursor-pointer transition-all border-l-4 select-none ${
                            selectedArticle?.id === article.id
                              ? "bg-slate-700 border-l-cyan-500"
                              : "bg-slate-800 border-l-transparent hover:bg-slate-700/50"
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
                  </div>

                  {/* Right Content Area */}
                  <div className="flex-1 bg-slate-900 overflow-y-auto flex flex-col min-w-0">
                    <div className="p-4 md:p-8 flex-1 w-full">
                      <div className="max-w-full md:max-w-4xl mx-auto">
                        <div className="mb-6">
                          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 break-words">
                            {selectedArticle.title}
                          </h2>
                          <Badge className={`text-xs border ${categoryColors[selectedArticle.category]}`}>
                            {selectedArticle.category}
                          </Badge>
                        </div>

                        {/* Article Content */}
                        <div className="prose prose-invert max-w-none mb-8 prose-sm md:prose-base overflow-x-hidden">
                          <KBArticleContent content={selectedArticle.content} />
                        </div>

                        {/* Share Section */}
                        <div className="mt-8 pt-6 border-t border-slate-700">
                          <p className="text-sm text-gray-400 mb-3">Share this article</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = window.location.href;
                                const text = `Check out this KB article: ${selectedArticle.title}`;
                                window.open(
                                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                                  '_blank',
                                  'width=600,height=400'
                                );
                              }}
                              className="gap-2 text-blue-400 hover:text-blue-300 border-blue-500/50 hover:bg-blue-500/10"
                              title="Share on LinkedIn"
                            >
                              <Linkedin className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = window.location.href;
                                const text = `Check out this KB article: ${selectedArticle.title}`;
                                window.open(
                                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                                  '_blank',
                                  'width=600,height=400'
                                );
                              }}
                              className="gap-2 text-cyan-400 hover:text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/10"
                              title="Share on Twitter/X"
                            >
                              <Twitter className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = window.location.href;
                                const quote = `Check out this KB article: ${selectedArticle.title}`;
                                window.open(
                                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`,
                                  '_blank',
                                  'width=600,height=400'
                                );
                              }}
                              className="gap-2 text-blue-500 hover:text-blue-400 border-blue-600/50 hover:bg-blue-600/10"
                              title="Share on Facebook"
                            >
                              <Facebook className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEmailOpen(true)}
                              className="gap-2 text-amber-400 hover:text-amber-300 border-amber-500/50 hover:bg-amber-500/10"
                              title="Email this article"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Feedback Section */}
                        <div className="mt-6 pt-6 border-t border-slate-700">
                          <p className="text-sm text-gray-400 mb-3">Was this article helpful?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setFeedbackArticleId(selectedArticle.id);
                                setFeedbackMessageId(selectedArticle.id);
                                setFeedbackOpen(true);
                              }}
                              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
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
                              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              No
                            </Button>
                          </div>
                        </div>
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
                  onPointerDown={handlePointerDown}
                  onPointerUp={(e) => handlePointerUp(e, article)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleArticleClick(article);
                    }
                  }}
                  className={`p-4 cursor-pointer transition-all border rounded-md select-none ${
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

      {/* Email Dialog */}
      {emailOpen && selectedArticle && (
        <div className="fixed inset-0 bg-black/80 z-[9998] flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Email Article</h2>
            <p className="text-gray-400 text-sm mb-4">Send "{selectedArticle.title}" to:</p>
            <Input
              type="email"
              placeholder="recipient@example.com"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              className="mb-4 bg-slate-800 border-slate-700 text-white placeholder-gray-500"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleEmailArticle}
                disabled={emailLoading || !emailAddress}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {emailLoading ? "Sending..." : "Send"}
              </Button>
              <Button
                onClick={() => {
                  setEmailOpen(false);
                  setEmailAddress("");
                }}
                variant="outline"
                className="flex-1 text-gray-400 border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

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
          {/* MS Learn Section — dynamically shows synced articles */}
          {msLearnArticles.length > 0 && (
          <div className="mt-16 pt-8 border-t border-slate-700">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-400" />
                Microsoft Learn
              </h2>
              <p className="text-gray-400">Official Microsoft training and certification resources — synced from learn.microsoft.com</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {msLearnArticles.slice(0, 12).map((article: any) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="p-4 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <h3 className="font-semibold text-white mb-2 line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-blue-900/40 text-blue-400 text-xs">{article.category?.replace(/-/g, ' ')}</Badge>
                    {article.sourceUrl && (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-cyan-400 hover:text-cyan-300 ml-auto"
                      >
                        Open in MS Learn →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {msLearnArticles.length > 12 && (
              <p className="text-center text-gray-400 mt-4 text-sm">
                Showing 12 of {msLearnArticles.length} Microsoft Learn modules. Use search to find more.
              </p>
            )}
          </div>
          )}
          <ScrollToTop />
      <Footer />
      </div>
  );
}
