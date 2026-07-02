import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Archive, Eye, Mail, MailX } from "lucide-react";
import { toast } from "sonner";

type Article = {
  id: number;
  title: string;
  summary: string | null;
  category: string | null;
  source: string | null;
  url: string | null;
  publishedAt: string | null;
  includedInNewsletter: number;
  isArchived: number;
  viewCount: number;
  clickCount: number;
};

export default function AdminNewsManager() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null);

  const { data: articlesData, isLoading, refetch } = trpc.aiNews.listArticles.useQuery({
    search: search || undefined,
    category: category || undefined,
    offset,
    limit: 20,
  });

  const archiveMutation = trpc.aiNews.archiveArticle.useMutation({
    onSuccess: () => { toast.success("Article archived"); refetch(); },
    onError: (err: any) => toast.error(err?.message || "Error"),
  });

  // markForNewsletter handles both include (include: true) and exclude (include: false)
  const newsletterMutation = trpc.aiNews.markForNewsletter.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.include ? "Added to newsletter" : "Removed from newsletter");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Error"),
  });

  const articles: Article[] = (articlesData?.articles as Article[]) || [];
  const total = articlesData?.total || 0;

  // Derive unique categories from loaded articles for filter dropdown
  const categories = Array.from(new Set(articles.map((a) => a.category).filter(Boolean)));

  return (
    <div className="w-full p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">AI News Manager</h1>
        <p className="text-gray-400 text-sm mt-1">Manage collected AI industry news and newsletter content</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total Articles", value: total },
          { label: "In Newsletter", value: articles.filter((a) => a.includedInNewsletter === 1).length },
          { label: "Archived", value: articles.filter((a) => a.isArchived === 1).length },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs">{s.label}</p>
            <p className="text-xl font-bold text-cyan-400">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setOffset(0); }}
          className="bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat!}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-cyan-400 w-8 h-8" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-900 border border-gray-800 rounded-lg">
            No articles found
          </div>
        ) : (
          articles.map((article) => (
            <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
              {/* Article Info */}
              <div>
                <h3 className="font-semibold text-white text-sm leading-snug">{article.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {article.category && (
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                      {article.category}
                    </span>
                  )}
                  {article.source && (
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                      {article.source}
                    </span>
                  )}
                  {article.includedInNewsletter === 1 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                      In Newsletter
                    </span>
                  )}
                  {article.isArchived === 1 && (
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setViewingArticle(article)}
                >
                  <Eye className="w-3 h-3 mr-1" /> View
                </Button>

                {article.includedInNewsletter === 1 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    disabled={newsletterMutation.isPending}
                    onClick={() => newsletterMutation.mutate({ id: article.id, include: false })}
                  >
                    <MailX className="w-3 h-3 mr-1" /> Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-green-500/50 text-green-400 hover:bg-green-500/10"
                    disabled={newsletterMutation.isPending}
                    onClick={() => newsletterMutation.mutate({ id: article.id, include: true })}
                  >
                    <Mail className="w-3 h-3 mr-1" /> Newsletter
                  </Button>
                )}

                {article.isArchived !== 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    disabled={archiveMutation.isPending}
                    onClick={() => archiveMutation.mutate({ id: article.id })}
                  >
                    <Archive className="w-3 h-3 mr-1" /> Archive
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center pt-2">
          <Button onClick={() => setOffset(Math.max(0, offset - 20))} disabled={offset === 0} variant="outline" size="sm">
            Previous
          </Button>
          <span className="text-gray-400 text-sm">{offset + 1}–{Math.min(offset + 20, total)} of {total}</span>
          <Button onClick={() => setOffset(offset + 20)} disabled={offset + 20 >= total} variant="outline" size="sm">
            Next
          </Button>
        </div>
      )}

      {/* Article Detail Modal */}
      {viewingArticle && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setViewingArticle(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-white pr-4">{viewingArticle.title}</h2>
              <button onClick={() => setViewingArticle(null)} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              {viewingArticle.summary && (
                <div>
                  <p className="text-gray-500 text-xs mb-1">Summary</p>
                  <p>{viewingArticle.summary}</p>
                </div>
              )}
              <div className="flex gap-4">
                <div>
                  <p className="text-gray-500 text-xs">Source</p>
                  <p>{viewingArticle.source || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Category</p>
                  <p>{viewingArticle.category || "—"}</p>
                </div>
              </div>
              {viewingArticle.url && (
                <a
                  href={viewingArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline text-xs block"
                >
                  Read original article →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
