import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Star,
  Eye,
  MessageCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function PublicKB() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"views" | "rating" | "newest">("views");
  const [selectedArticle, setSelectedArticle] = useState<number | null>(null);

  // Fetch all published KB articles (public procedure)
  const { data: articles, isLoading: articlesLoading } = trpc.kb.list.useQuery({});

  // Fetch article detail when selected
  const { data: articleDetail, isLoading: detailLoading } = trpc.kb.get.useQuery(
    { id: selectedArticle! },
    { enabled: !!selectedArticle }
  );

  // Get unique categories
  const categories = useMemo(() => {
    if (!articles) return [];
    const cats = new Set(articles.map((a) => a.category));
    return Array.from(cats).sort();
  }, [articles]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    let filtered = articles.filter((a) => a.isPublished);

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          (a.tags && a.tags.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "views":
      default:
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return filtered;
  }, [articles, searchQuery, selectedCategory, sortBy]);

  if (selectedArticle && articleDetail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            ← Back to Knowledge Base
          </Button>

          {/* Article content */}
          <article className="bg-card rounded-lg p-8 border border-border">
            <h1 className="text-4xl font-bold mb-4 text-foreground">{articleDetail.title}</h1>

            {/* Metadata */}
            <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{articleDetail.viewCount || 0} views</span>
              </div>
              {articleDetail.averageRating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{articleDetail.averageRating} ({articleDetail.ratingCount || 0} ratings)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{articleDetail.commentCount || 0} comments</span>
              </div>
              <span className="text-xs">
                Updated {new Date(articleDetail.updatedAt).toLocaleDateString()}
              </span>
            </div>

            {/* Category and tags */}
            <div className="mb-8">
              <span className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-sm mr-2">
                {articleDetail.category}
              </span>
              {articleDetail.tags && (
                <>
                  {articleDetail.tags.split(",").map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm mr-2"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </>
              )}
            </div>

            {/* Article body */}
            <div className="prose prose-invert max-w-none mb-8">
              <div
                className="text-foreground leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: articleDetail.content }}
              />
            </div>

            {/* Helpful feedback */}
            <div className="mt-12 pt-8 border-t border-border">
              <h3 className="text-lg font-semibold mb-4">Was this helpful?</h3>
              <div className="flex gap-2">
                <Button variant="outline">👍 Yes</Button>
                <Button variant="outline">👎 No</Button>
              </div>
            </div>
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 border-b border-border py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Knowledge Base</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions and troubleshooting guides
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Search and filters */}
        <div className="mb-12">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>

          {/* Category and sort filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category
              </label>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-card border border-border rounded-lg text-foreground"
              >
                <option value="views">Most Viewed</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-muted-foreground">
          {articlesLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading articles...
            </div>
          ) : (
            <span>
              Showing {filteredArticles.length} of {articles?.length || 0} articles
            </span>
          )}
        </div>

        {/* Articles grid */}
        {articlesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No articles found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filters
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article.id)}
                className="bg-card border border-border rounded-lg p-6 hover:border-accent transition-colors text-left group"
              >
                {/* Category badge */}
                <div className="mb-3">
                  <span className="inline-block bg-accent/10 text-accent px-2 py-1 rounded text-xs font-medium">
                    {article.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>

                {/* Excerpt */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {article.content.substring(0, 120)}...
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.viewCount || 0}
                    </span>
                    {article.averageRating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {article.averageRating}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
