import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Archive, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminNewsManager() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  // Fetch articles
  const { data: articlesData, isLoading, refetch } = trpc.aiNews.listArticles.useQuery({
    search,
    category: category || undefined,
    offset,
    limit: 20,
  });

  // Fetch stats
  const { data: stats } = trpc.aiNews.getStats.useQuery();

  // Mutations
  const archiveMutation = trpc.aiNews.archiveArticle.useMutation({
    onSuccess: () => {
      toast.success("Article archived");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Error archiving article"),
  });

  const deleteMutation = trpc.aiNews.deleteArticle.useMutation({
    onSuccess: () => {
      toast.success("Article deleted");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Error deleting article"),
  });

  const toggleNewsletterMutation = trpc.aiNews.includeInNewsletter.useMutation({
    onSuccess: () => {
      toast.success("Newsletter status updated");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Error updating newsletter status"),
  });

  const articles = articlesData?.articles || [];
  const total = articlesData?.total || 0;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">AI News Manager</h1>
        <p className="text-gray-400">Manage collected AI industry news and newsletter content</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Articles</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.totalArticles || 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Engagements</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.totalEngagements || 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Newsletters Sent</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.totalNewsletters || 0}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Categories</p>
            <p className="text-2xl font-bold text-cyan-400">{stats.categoryCounts?.length || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          className="bg-gray-900 border-gray-800 text-white placeholder-gray-500"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setOffset(0);
          }}
          className="bg-gray-900 border border-gray-800 text-white rounded-md px-3 py-2"
        >
          <option value="">All Categories</option>
          {stats?.categoryCounts?.map((cat: any) => (
            <option key={cat.category} value={cat.category}>
              {cat.category}
            </option>
          ))}
        </select>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-cyan-400" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No articles found</div>
        ) : (
          articles.map((article: any) => (
            <div
              key={article.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{article.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    {article.source}
                  </span>
                  {article.includedInNewsletter === 1 && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      In Newsletter
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 md:flex-nowrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedArticle(article.id)}
                  className="flex-1 md:flex-none"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    toggleNewsletterMutation.mutate({ id: article.id });
                  }}
                  className="flex-1 md:flex-none"
                  disabled={toggleNewsletterMutation.isPending}
                >
                  {article.includedInNewsletter === 1 ? "Remove" : "Add"} Newsletter
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    archiveMutation.mutate({ id: article.id });
                  }}
                  className="flex-1 md:flex-none"
                  disabled={archiveMutation.isPending}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this article?")) {
                      deleteMutation.mutate({ id: article.id });
                    }
                  }}
                  className="flex-1 md:flex-none"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-between items-center">
          <Button
            onClick={() => setOffset(Math.max(0, offset - 20))}
            disabled={offset === 0}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-gray-400">
            {offset + 1} - {Math.min(offset + 20, total)} of {total}
          </span>
          <Button
            onClick={() => setOffset(offset + 20)}
            disabled={offset + 20 >= total}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white">Article Details</h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {articles.find((a: any) => a.id === selectedArticle) && (
              <div className="space-y-4 text-gray-300">
                <div>
                  <p className="text-sm text-gray-400">Title</p>
                  <p className="font-semibold">{articles.find((a: any) => a.id === selectedArticle)?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Summary</p>
                  <p>{articles.find((a: any) => a.id === selectedArticle)?.summary}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Source</p>
                  <p>{articles.find((a: any) => a.id === selectedArticle)?.source}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
