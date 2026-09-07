import { useState, useMemo, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2, ThumbsUp, ThumbsDown, Share2, Copy,
  ChevronRight, Clock, Eye, Star, ArrowLeft,
  BookOpen, Tag, AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SiteNavBar2024 from "@/components/SiteNavBar2024";
import Footer from "@/components/Footer";

export default function KBArticleViewer() {
  const [, params] = useRoute("/kb/:id");
  const [, navigate] = useLocation();
  const [showCopied, setShowCopied] = useState(false);
  const [userRating, setUserRating] = useState<"helpful" | "not_helpful" | null>(null);

  const articleId = params?.id ? parseInt(params.id) : null;

  // Fetch article
  const { data: article, isLoading, error } = trpc.kb.get.useQuery(
    { id: articleId || 0 },
    { enabled: !!articleId && !isNaN(articleId!) }
  );

  useEffect(() => {
    if (!article?.redirectedFromId || !article.canonicalId) return;
    window.history.replaceState(window.history.state, "", `/kb/${article.canonicalId}`);
  }, [article?.redirectedFromId, article?.canonicalId]);

  // Track view — fire once when article data first loads, fully silent (never shows error)
  const trackView = trpc.kb.trackView.useMutation({
    onError: () => { /* silent — view tracking failures must never surface to the user */ },
  });
  const viewTracked = useRef(false);
  useEffect(() => {
    if (article && !viewTracked.current) {
      viewTracked.current = true;
      try { trackView.mutate({ id: article.id }); } catch { /* silent */ }
    }
  }, [article]);

  // Fetch related articles
  const { data: relatedArticles = [] } = trpc.kb.getTrendingArticles.useQuery(
    { limit: 3 },
    { enabled: !!articleId }
  );

  // Slugify helper for TOC anchors
  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Custom Markdown components for Fortune 100 quality rendering
  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 id={slugify(String(children))} className="text-3xl font-bold text-white mt-8 mb-4 border-b border-cyan-500/30 pb-3">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 id={slugify(String(children))} className="text-2xl font-bold text-white mt-6 mb-3 border-b border-white/10 pb-2">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 id={slugify(String(children))} className="text-xl font-semibold text-cyan-400 mt-5 mb-2">
        {children}
      </h3>
    ),
    table: ({ children }: any) => (
      <div className="my-6 overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-white/5 border-b border-white/10">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-white/5">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-white/2.5 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-3 text-white/75">
        {children}
      </td>
    ),
    ul: ({ children }: any) => (
      <ul className="my-4 ml-6 space-y-2 list-disc text-white/75">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="my-4 ml-6 space-y-2 list-decimal text-white/75">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="my-4 pl-4 border-l-4 border-cyan-500/50 bg-cyan-500/5 py-2 pr-4 rounded-r italic text-white/70">
        {children}
      </blockquote>
    ),
    code: ({ children, inline }: any) => {
      if (inline) {
        return <code className="bg-white/5 text-cyan-400 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
      }
      return <code className="block bg-white/5 text-cyan-400 px-3 py-2 rounded text-sm font-mono">{children}</code>;
    },
    pre: ({ children }: any) => (
      <pre className="my-4 bg-[#0D1220] border border-white/10 rounded-lg p-4 overflow-x-auto">
        {children}
      </pre>
    ),
  };

  // Generate table of contents from markdown
  const tableOfContents = useMemo(() => {
    if (!article?.content) return [];
    const headings = article.content.match(/^#{1,3} .+$/gm) || [];
    return headings.map((heading) => {
      const level = heading.match(/^#+/)?.[0].length || 1;
      const text = heading.replace(/^#+\s/, "");
      return { level, text, id: text.toLowerCase().replace(/[^a-z0-9]+/g, "-") };
    });
  }, [article?.content]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleRate = (type: "helpful" | "not_helpful") => {
    if (!articleId || userRating) return;
    setUserRating(type);
    // Rating stored locally for now - rateArticle procedure to be added in Phase 5
    console.log("Rating:", type, "for article", articleId);
  };

  if (!articleId || isNaN(articleId)) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Invalid Article</h2>
          <Button onClick={() => navigate("/kb")} className="bg-[#00D4FF] text-black hover:bg-[#00B8D9]">
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#00D4FF] animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <SiteNavBar2024 />
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Article Not Found</h2>
          <p className="text-white/60 mb-4">This article may have been moved or deleted.</p>
          <Button onClick={() => navigate("/kb")} className="bg-[#00D4FF] text-black hover:bg-[#00B8D9]">
            Back to Knowledge Base
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      <SiteNavBar2024 />

      {/* Breadcrumb */}
      <div className="border-b border-white/10 bg-[#0D1220]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-white/50">
            <button onClick={() => navigate("/")} className="hover:text-[#00D4FF] transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate("/kb")} className="hover:text-[#00D4FF] transition-colors">Knowledge Base</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80 truncate max-w-xs">{article.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Sidebar - Table of Contents */}
          {tableOfContents.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-6">
                <div className="bg-[#0D1220] border border-white/10 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-[#00D4FF] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    On This Page
                  </h3>
                  <ul className="space-y-1.5">
                    {tableOfContents.map((item, i) => (
                      <li key={i} style={{ paddingLeft: `${(item.level - 1) * 12}px` }}>
                        <a
                          href={`#${item.id}`}
                          className="text-sm text-white/50 hover:text-[#00D4FF] transition-colors block py-0.5 leading-snug"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Back button */}
                <button
                  onClick={() => navigate("/kb")}
                  className="mt-4 flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Knowledge Base
                </button>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {article.redirectedFromId && (
              <div className="mb-6 border border-cyan-400/25 bg-cyan-400/[0.06] px-4 py-3 text-sm text-slate-300" role="status">
                This archived Knowledge Base link now opens the maintained canonical article.
              </div>
            )}
            {/* Article Header */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {article.category && (
                  <span className="px-3 py-1 bg-[#00D4FF]/10 text-[#00D4FF] text-xs font-medium rounded-full border border-[#00D4FF]/20">
                    {article.category}
                  </span>
                )}
                {article.difficulty && (
                  <span className="px-3 py-1 bg-white/5 text-white/50 text-xs rounded-full border border-white/10">
                    {article.difficulty}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
                {article.title}
              </h1>

              {article.subcategory && (
                <p className="text-lg text-white/60 leading-relaxed mb-6">{article.subcategory}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/40 pb-6 border-b border-white/10">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {article.updatedAt
                    ? new Date(article.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    : "Recently updated"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {article.viewCount ?? 0} views
                </span>
                {article.averageRating && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    {Number(article.averageRating).toFixed(1)}
                  </span>
                )}
                {/* Share buttons */}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                  >
                    {showCopied ? <><Copy className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                  </button>
                  <button
                    onClick={() => { if (navigator.share) navigator.share({ title: article.title, url: window.location.href }); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
              prose-h3:text-xl prose-h3:text-[#00D4FF]
              prose-p:text-white/75 prose-p:leading-relaxed
              prose-a:text-[#00D4FF] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-[#00D4FF] prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-[#0D1220] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
              prose-blockquote:border-l-[#00D4FF] prose-blockquote:bg-[#00D4FF]/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
              prose-ul:text-white/75 prose-ol:text-white/75
              prose-li:marker:text-[#00D4FF]
              prose-table:text-white/75 prose-th:text-white prose-th:bg-white/5
              prose-hr:border-white/10
              mb-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {article.content || "*No content available.*"}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {article.tags && (
              <div className="flex flex-wrap items-center gap-2 mb-8 pt-4 border-t border-white/10">
                <Tag className="w-4 h-4 text-white/40" />
                {article.tags.split(',').filter(Boolean).map((tag: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-white/5 text-white/50 text-xs rounded-full border border-white/10 hover:border-[#00D4FF]/40 hover:text-[#00D4FF] transition-colors cursor-pointer">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Feedback Section */}
            <div className="bg-[#0D1220] border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-base font-semibold text-white mb-1">Was this article helpful?</h3>
              <p className="text-sm text-white/50 mb-4">Your feedback helps us improve our knowledge base.</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRate("helpful")}
                  disabled={!!userRating}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    userRating === "helpful"
                      ? "bg-green-500/20 border-green-500/40 text-green-400"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400"
                  } disabled:cursor-not-allowed`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  Yes, helpful
                </button>
                <button
                  onClick={() => handleRate("not_helpful")}
                  disabled={!!userRating}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    userRating === "not_helpful"
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                  } disabled:cursor-not-allowed`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  Not helpful
                </button>
                {userRating && (
                  <span className="text-sm text-white/40 italic">
                    {userRating === "helpful" ? "Thanks for your feedback! 🎉" : "We'll work on improving this article."}
                  </span>
                )}
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Related Articles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedArticles.filter((r: any) => r.id !== article.id).slice(0, 3).map((related: any) => (
                    <button
                      key={related.id}
                      onClick={() => navigate(`/kb/${related.id}`)}
                      className="text-left p-4 bg-[#0D1220] border border-white/10 rounded-xl hover:border-[#00D4FF]/40 transition-all group"
                    >
                      {related.category && (
                        <span className="text-xs text-[#00D4FF]/70 font-medium">{related.category}</span>
                      )}
                      <h4 className="text-sm font-semibold text-white mt-1 mb-2 group-hover:text-[#00D4FF] transition-colors line-clamp-2">
                        {related.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Eye className="w-3 h-3" />
                        {related.viewCount ?? 0} views
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-10 p-6 bg-gradient-to-r from-[#00D4FF]/10 to-[#0066FF]/10 border border-[#00D4FF]/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white">Still need help?</h3>
                <p className="text-sm text-white/60">Our support team is available 24/7 to assist you.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/support")}
                  className="bg-[#00D4FF] text-black font-semibold hover:bg-[#00B8D9] text-sm"
                >
                  Create Support Ticket
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/kb")}
                  className="border-white/20 text-white hover:bg-white/5 text-sm"
                >
                  Browse KB
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
