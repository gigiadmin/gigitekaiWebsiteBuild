import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ThumbsUp, ThumbsDown, Share2, Copy, ChevronRight, Clock, User, Eye, Star } from "lucide-react";
import { Streamdown } from "streamdown";

export default function KBArticleViewer() {
  const [, params] = useRoute("/kb/:id");
  const [, navigate] = useLocation();
  const [showCopied, setShowCopied] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  const articleId = params?.id ? parseInt(params.id) : null;

  // Fetch article
  const { data: article, isLoading } = trpc.kb.get.useQuery(
    { id: articleId! },
    { enabled: !!articleId }
  );

  // Fetch related articles
  const { data: relatedArticles = [] } = trpc.kb.getTrendingArticles.useQuery(
    { limit: 3 },
    { enabled: !!articleId }
  );

  // Rate article mutation
  const rateArticleMutation = trpc.kb.rateArticle.useMutation({
    onSuccess: (result) => {
      setUserRating(result.rating);
    },
  });

  // Generate table of contents from markdown
  const tableOfContents = useMemo(() => {
    if (!article?.content) return [];
    const headings = article.content.match(/^#{1,3} .+$/gm) || [];
    return headings.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s/, "");
      return { level, text, id: text.toLowerCase().replace(/\s+/g, "-") };
    });
  }, [article?.content]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleRate = (rating: number) => {
    if (articleId) {
      rateArticleMutation.mutate({ articleId, rating });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-slate-300 mb-8">The article you're looking for doesn't exist.</p>
          <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={() => navigate("/kb")}>
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => navigate("/kb")}>
            ← Back to Knowledge Base
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:text-cyan-400"
              onClick={handleCopyLink}
            >
              {showCopied ? "Copied!" : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-cyan-400">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-500/10 rounded-full">
                  {article.category}
                </span>
                {article.difficulty && (
                  <span className="px-3 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 rounded-full">
                    {article.difficulty}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{article.title}</h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
                {article.createdBy && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>By GigitekAI</span>
                  </div>
                )}
                {article.viewCount && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{article.viewCount} views</span>
                  </div>
                )}
                {article.estimatedResolutionTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{article.estimatedResolutionTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="prose prose-invert max-w-none mb-12">
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8">
                <Streamdown>{article.content}</Streamdown>
              </div>
            </div>

            {/* Rating Section */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-8 mb-12">
              <h3 className="text-lg font-semibold text-white mb-4">Was this article helpful?</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(star)}
                      className={`p-2 rounded-lg transition-all ${
                        userRating && userRating >= star
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                      }`}
                    >
                      <Star className="w-5 h-5" fill="currentColor" />
                    </button>
                  ))}
                </div>
                {article.averageRating && (
                  <span className="text-sm text-slate-400">
                    {article.averageRating.toFixed(1)} / 5 ({article.ratingCount} ratings)
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                  onClick={() => handleRate(5)}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Helpful
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => handleRate(1)}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Not Helpful
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Table of Contents */}
            {tableOfContents.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6 mb-8 sticky top-24">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Table of Contents</h3>
                <nav className="space-y-2">
                  {tableOfContents.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm transition-colors hover:text-cyan-400 ${
                        item.level === 1
                          ? "text-slate-300 font-medium"
                          : item.level === 2
                          ? "text-slate-400 ml-4"
                          : "text-slate-500 ml-8"
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Related Articles</h3>
                <div className="space-y-3">
                  {relatedArticles.slice(0, 3).map((related) => (
                    <button
                      key={related.id}
                      onClick={() => navigate(`/kb/${related.id}`)}
                      className="w-full text-left p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors group"
                    >
                      <p className="text-sm font-medium text-cyan-300 group-hover:text-cyan-200 flex items-center gap-2">
                        {related.title}
                        <ChevronRight className="w-3 h-3" />
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{related.category}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
