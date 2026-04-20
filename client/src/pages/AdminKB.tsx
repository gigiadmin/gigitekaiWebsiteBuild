import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Edit2, BookOpen, Eye, Mail, Share2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { CodeBlockWithCopy } from "@/components/CodeBlockWithCopy";
import { KBArticleContent } from "@/components/KBArticleContent";
import { KBFeedback } from "@/components/KBFeedback";
import { KBFullScreenModal } from "@/components/KBFullScreenModal";
import { ShareKBModal } from "@/components/ShareKBModal";
import AdminLayout from "@/components/AdminLayout";

export default function AdminKB() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [fullScreenArticle, setFullScreenArticle] = useState<any>(null);
  const [shareArticle, setShareArticle] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareArticleData, setShareArticleData] = useState<any>(null);

  // Fetch all KB articles
  const { data: articles, isLoading, refetch } = trpc.kb.list.useQuery(
    { includeUnpublished: true },
    { enabled: true }
  );

  // Delete KB article mutation (placeholder - implement in router if needed)
  const deleteArticleMutation = {
    mutate: () => {},
    isPending: false,
  } as any;

  const handleShare = (article: any) => {
    setShareArticleData(article);
    setIsShareModalOpen(true);
  };

  const handleEmail = (article: any) => {
    setShareArticleData(article);
    setIsShareModalOpen(true);
  };
  
  /*
  const deleteArticleMutation = trpc.kb.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedArticle(null);
    },
  });
  */

  // Filter articles by search query
  const filteredArticles = articles?.filter((article: any) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.keywords.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categoryColors: Record<string, string> = {
    "Account & Authentication": "bg-blue-900/40 text-blue-400 border-blue-800",
    "Network & Connectivity": "bg-purple-900/40 text-purple-400 border-purple-800",
    "Email & Communication": "bg-cyan-900/40 text-cyan-400 border-cyan-800",
    "Hardware & Peripherals": "bg-amber-900/40 text-amber-400 border-amber-800",
    "Software & Applications": "bg-green-900/40 text-green-400 border-green-800",
    "Cloud Services": "bg-indigo-900/40 text-indigo-400 border-indigo-800",
    "System & Performance": "bg-rose-900/40 text-rose-400 border-rose-800",
    "Network & Infrastructure": "bg-fuchsia-900/40 text-fuchsia-400 border-fuchsia-800",
    "Security & Compliance": "bg-red-900/40 text-red-400 border-red-800",
    "Data Protection": "bg-orange-900/40 text-orange-400 border-orange-800",
    "Remote Work": "bg-teal-900/40 text-teal-400 border-teal-800",
    "Mobile & Remote Access": "bg-lime-900/40 text-lime-400 border-lime-800",
  };

  return (
    <AdminLayout>
    <>
      {/* Full Screen Modal */}
      {fullScreenArticle && (
        <KBFullScreenModal
          article={fullScreenArticle}
          isOpen={!!fullScreenArticle}
          onClose={() => setFullScreenArticle(null)}
          onShare={handleShare}
          onEmail={handleEmail}
          isAdmin={true}
        />
      )}

      {/* Share Modal */}
      {shareArticleData && (
        <ShareKBModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setIsShareModalOpen(false);
            setShareArticleData(null);
          }}
          articleId={shareArticleData.id}
          articleTitle={shareArticleData.title}
        />
      )}

      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Knowledge Base
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {articles?.length || 0} articles
          </p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search articles by title, category, or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-500"
        />
      </div>

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
          <p className="text-gray-400 mb-2">
            {searchQuery ? "No articles match your search" : "No articles yet"}
          </p>
          {!searchQuery && (
            <Button className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Article
            </Button>
          )}
        </div>
      )}

      {/* Articles Grid */}
      {!isLoading && filteredArticles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article List */}
          <div className="lg:col-span-1 space-y-3">
            {filteredArticles.map((article: any) => (
              <Card
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className={`p-4 cursor-pointer transition-all border ${
                  selectedArticle?.id === article.id
                    ? "bg-slate-700 border-cyan-500"
                    : "bg-slate-800 border-slate-700 hover:border-slate-600"
                }`}
              >
                <h3 className="font-semibold text-white text-sm line-clamp-2">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge
                    className={`text-xs border ${
                      categoryColors[article.category] ||
                      "bg-slate-700 text-gray-400 border-slate-600"
                    }`}
                  >
                    {article.category}
                  </Badge>
                  {!article.isPublished && (
                    <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-800 text-xs border">
                      Draft
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFullScreenArticle(article)}
                  className="w-full mt-2 text-xs text-gray-400 hover:text-white hover:bg-slate-700"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Full View
                </Button>
              </Card>
            ))}
          </div>

          {/* Article Detail View */}
          {selectedArticle && (
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700 p-6 sticky top-20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {selectedArticle.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs border ${
                          categoryColors[selectedArticle.category] ||
                          "bg-slate-700 text-gray-400 border-slate-600"
                        }`}
                      >
                        {selectedArticle.category}
                      </Badge>
                      <Badge className="bg-slate-700 text-gray-400 border-slate-600 text-xs">
                        Priority: {selectedArticle.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFullScreenArticle(selectedArticle)}
                      className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 text-xs"
                    >
                      <BookOpen className="w-4 h-4 mr-1" />
                      Open in
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(selectedArticle)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                      title="Email article"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(selectedArticle)}
                      className="border-green-600 text-green-400 hover:bg-green-900/30"
                      title="Share article"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-gray-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-800 text-red-400 hover:bg-red-900/30"
                      onClick={() =>
                        deleteArticleMutation.mutate(selectedArticle.id)
                      }
                      disabled={deleteArticleMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Keywords */}
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <p className="text-xs text-gray-500 mb-2">Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedArticle.keywords.split(",").map((keyword: string, idx: number) => (
                      <Badge
                        key={idx}
                        className="bg-slate-700 text-gray-300 border-slate-600 text-xs"
                      >
                        {keyword.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-invert max-w-none">
                  <KBArticleContent content={selectedArticle.content} />
                </div>

                {/* Feedback Section */}
                <KBFeedback
                  articleId={selectedArticle.id}
                  articleTitle={selectedArticle.title}
                  averageRating={selectedArticle.averageRating}
                  ratingCount={selectedArticle.ratingCount}
                  commentCount={selectedArticle.commentCount}
                />

                {/* Metadata */}
                <div className="mt-6 pt-4 border-t border-slate-700 text-xs text-gray-500">
                  <p>
                    Created: {new Date(selectedArticle.createdAt).toLocaleString()}
                  </p>
                  <p>
                    Updated: {new Date(selectedArticle.updatedAt).toLocaleString()}
                  </p>
                  <p className="mt-2">
                    Views: {selectedArticle.viewCount || 0}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Share KB Modal */}
    {shareArticleData && (
      <ShareKBModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        articleId={shareArticleData.id}
        articleTitle={shareArticleData.title}
        articleUrl={`${window.location.origin}/kb/${shareArticleData.id}`}
      />
    )}
    </>
  
    </AdminLayout>);
}
