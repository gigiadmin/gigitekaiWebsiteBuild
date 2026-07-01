import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Archive, Trash2, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminNewsManager() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  // Fetch articles
  const { data: articlesData, isLoading: articlesLoading, refetch } = trpc.aiNews.listArticles.useQuery({
    search,
    category: category || undefined,
    offset,
    limit: 20,
  });

  // Fetch stats
  const { data: stats } = trpc.aiNews.getStats.useQuery();

  // Fetch article details
  const { data: articleDetail } = trpc.aiNews.getArticle.useQuery(
    { id: selectedArticle! },
    { enabled: !!selectedArticle }
  );

  // Mutations
  const archiveMutation = trpc.aiNews.archiveArticle.useMutation({
    onSuccess: () => {
      toast.success("Article archived");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.aiNews.deleteArticle.useMutation({
    onSuccess: () => {
      toast.success("Article deleted");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const includeNewsletter = trpc.aiNews.includeInNewsletter.useMutation({
    onSuccess: () => {
      toast.success("Added to newsletter");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI News Manager</h1>
        <p className="text-gray-600">Manage collected AI industry news and newsletter content</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Articles</div>
            <div className="text-2xl font-bold">{stats.totalArticles}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Engagements</div>
            <div className="text-2xl font-bold">{stats.totalEngagements}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Newsletters Sent</div>
            <div className="text-2xl font-bold">{stats.totalNewsletters}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600">Categories</div>
            <div className="text-2xl font-bold">{stats.categoryCounts.length}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
              className="flex-1"
            />
            <select
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setCategory(e.target.value);
                setOffset(0);
              }}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Categories</option>
              <option value="AI & Technology">AI & Technology</option>
              <option value="Business & Tech">Business & Tech</option>
              <option value="Tech & Security">Tech & Security</option>
            </select>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Manual Article
            </Button>
          </div>
        </div>
      </Card>

      {/* Articles Table */}
      <Card className="overflow-hidden">
        {articlesLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !articlesData?.articles.length ? (
          <div className="p-8 text-center text-gray-500">No articles found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Published</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Newsletter</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Engagement</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {articlesData.articles.map((article: any & { id: number; title: string; category: string; source: string; publishedAt: string; includedInNewsletter: number; clickCount: number; viewCount: number }) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm max-w-xs truncate">{article.title}</td>
                    <td className="px-6 py-4 text-sm">{article.category}</td>
                    <td className="px-6 py-4 text-sm">{article.source}</td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(article.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {article.includedInNewsletter ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Included
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          Not Included
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 text-xs">
                        <span>{article.clickCount} clicks</span>
                        <span>{article.viewCount} views</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedArticle(article.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!article.includedInNewsletter && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => includeNewsletter.mutate({ id: article.id })}
                          >
                            Add to Newsletter
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => archiveMutation.mutate({ id: article.id })}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate({ id: article.id })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {articlesData && (
          <div className="px-6 py-4 border-t flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - 20))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!articlesData.articles.length || articlesData.articles.length < 20}
              onClick={() => setOffset(offset + 20)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      {/* Article Detail Modal */}
      {selectedArticle && articleDetail && (
        <Card className="p-6 fixed inset-0 m-auto max-w-2xl max-h-96 overflow-y-auto z-50">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{articleDetail.article.title}</h2>
            <Button variant="ghost" onClick={() => setSelectedArticle(null)}>
              ✕
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-gray-700">{articleDetail.article.summary}</p>
            </div>

            {articleDetail.article.keyTakeaways && (
              <div>
                <h3 className="font-semibold mb-2">Key Takeaways</h3>
                <ul className="text-sm space-y-1">
                  {typeof articleDetail.article.keyTakeaways === 'string' ? (
                    (JSON.parse(articleDetail.article.keyTakeaways) as string[]).map((t: string, i: number) => (
                      <li key={i} className="text-gray-700">• {t}</li>
                    ))
                  ) : Array.isArray(articleDetail.article.keyTakeaways) ? (
                    (articleDetail.article.keyTakeaways as string[]).map((t: string, i: number) => (
                      <li key={i} className="text-gray-700">• {t}</li>
                    ))
                  ) : null}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Engagement</h3>
              <div className="grid grid-cols-5 gap-2 text-sm">
                <div>Opens: {articleDetail.engagement.opens}</div>
                <div>Clicks: {articleDetail.engagement.clicks}</div>
                <div>Shares: {articleDetail.engagement.shares}</div>
                <div>Saved: {articleDetail.engagement.saved}</div>
                <div>Reported: {articleDetail.engagement.reported}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => window.open(articleDetail.article.url, "_blank")}
              >
                View Original
              </Button>
              <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
