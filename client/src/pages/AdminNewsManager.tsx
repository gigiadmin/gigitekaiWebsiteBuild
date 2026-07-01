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
  ) as any;

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
      toast.success("Article added to newsletter");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const excludeNewsletter = trpc.aiNews.excludeFromNewsletter.useMutation({
    onSuccess: () => {
      toast.success("Article removed from newsletter");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleArchive = (id: number) => {
    archiveMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleNewsletter = (id: number, included: number) => {
    if (included === 1) {
      excludeNewsletter.mutate({ id });
    } else {
      includeNewsletter.mutate({ id });
    }
  };

  const articles = articlesData?.articles || [];
  const total = articlesData?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">AI News Manager</h1>
        <p className="text-gray-600">Manage collected AI industry news and newsletter content</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold">{stats.categoryCounts?.length || 0}</div>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search articles..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          className="flex-1 min-w-[200px]"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setOffset(0);
          }}
          className="px-4 py-2 border rounded-md"
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

      {/* Articles List */}
      <div className="space-y-4">
        {articlesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No articles found
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article: any) => (
              <div key={article.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedArticle(article.id)}>
                    <h3 className="font-semibold text-lg text-white">{article.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{article.summary?.substring(0, 150)}...</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{article.category}</span>
                      <span>{article.source}</span>
                      <span>Views: {article.viewCount || 0}</span>
                      <span>Clicks: {article.clickCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArticle(article.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={article.includedInNewsletter === 1 ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleNewsletter(article.id, article.includedInNewsletter);
                      }}
                    >
                      Newsletter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchive(article.id);
                      }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(article.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {articles.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {offset + 1}-{Math.min(offset + 20, total)} of {total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOffset(Math.max(0, offset - 20))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + 20)}
              disabled={offset + 20 >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {selectedArticle && articleDetail && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{articleDetail.article.title}</h2>
            <Button
              variant="outline"
              onClick={() => setSelectedArticle(null)}
            >
              Close
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
                  {(() => {
                    const takeaways = articleDetail.article.keyTakeaways;
                    if (typeof takeaways === 'string') {
                      try {
                        const parsed = JSON.parse(takeaways) as string[];
                        return (<>{parsed.map((t: string, i: number) => (
                          <li key={i} className="text-gray-700">• {t}</li>
                        ))}</>);
                      } catch {
                        return <li className="text-gray-700">• {takeaways}</li>;
                      }
                    } else if (Array.isArray(takeaways)) {
                      return (<>{(takeaways as string[]).map((t: string, i: number) => (
                        <li key={i} className="text-gray-700">• {t}</li>
                      ))}</>);
                    }
                    return null;
                  })()}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">GigitekAI Angle</h3>
              <p className="text-sm text-gray-700">{articleDetail.article.gigitekAiAngle}</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => handleToggleNewsletter(articleDetail.article.id, articleDetail.article.includedInNewsletter as number)}
              >
                {articleDetail.article.includedInNewsletter === 1 ? 'Remove from Newsletter' : 'Add to Newsletter'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleArchive(articleDetail.article.id)}
              >
                Archive
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(articleDetail.article.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
