import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, Edit2, BookOpen, Eye, Mail, Share2, Globe, EyeOff, CheckCircle2 } from "lucide-react";
import { KBArticleContent } from "@/components/KBArticleContent";
import { KBFeedback } from "@/components/KBFeedback";
import { KBFullScreenModal } from "@/components/KBFullScreenModal";
import { ShareKBModal } from "@/components/ShareKBModal";
import { AdminKBBulkInsert } from "@/components/AdminKBBulkInsert";
import { KBBulkImportCSV } from "@/components/KBBulkImportCSV";
import AdminLayout from "@/components/AdminLayout";
import { toast } from "sonner";

const CATEGORIES = [
  "Account & Authentication",
  "Network & Connectivity",
  "Email & Communication",
  "Hardware & Peripherals",
  "Software & Applications",
  "Cloud Services",
  "System & Performance",
  "Network & Infrastructure",
  "Security & Compliance",
  "Data Protection",
  "Remote Work",
  "Mobile & Remote Access",
  "Microsoft 365",
  "General",
];

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
  "Microsoft 365": "bg-sky-900/40 text-sky-400 border-sky-800",
  "General": "bg-slate-700 text-gray-400 border-slate-600",
};

interface ArticleFormData {
  title: string;
  content: string;
  category: string;
  tags: string;
  isPublished: boolean;
}

const emptyForm: ArticleFormData = {
  title: "",
  content: "",
  category: "General",
  tags: "",
  isPublished: false,
};

export default function AdminKB() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [fullScreenArticle, setFullScreenArticle] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareArticleData, setShareArticleData] = useState<any>(null);

  // Create/Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [formData, setFormData] = useState<ArticleFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<ArticleFormData>>({});

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Fetch all KB articles
  const { data: articles, isLoading, refetch } = trpc.kb.list.useQuery(
    { includeUnpublished: true },
    { enabled: true }
  );

  // Create mutation
  const createMutation = trpc.kb.create.useMutation({
    onSuccess: () => {
      toast.success("Article created successfully!");
      refetch();
      closeForm();
    },
    onError: (err) => toast.error(`Failed to create: ${err.message}`),
  });

  // Update mutation
  const updateMutation = trpc.kb.update.useMutation({
    onSuccess: () => {
      toast.success("Article updated successfully!");
      refetch();
      // Refresh selected article view
      if (selectedArticle && editingArticle?.id === selectedArticle.id) {
        setSelectedArticle({ ...selectedArticle, ...formData });
      }
      closeForm();
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  // Delete mutation
  const deleteMutation = trpc.kb.delete.useMutation({
    onSuccess: () => {
      toast.success("Article deleted.");
      refetch();
      if (selectedArticle?.id === deleteTarget?.id) setSelectedArticle(null);
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  // Toggle publish mutation
  const togglePublishMutation = trpc.kb.togglePublish.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isPublished ? "Article published!" : "Article unpublished.");
      refetch();
      if (selectedArticle?.id === vars.id) {
        setSelectedArticle({ ...selectedArticle, isPublished: vars.isPublished });
      }
    },
    onError: (err) => toast.error(`Failed to update publish status: ${err.message}`),
  });

  const openCreateForm = () => {
    setEditingArticle(null);
    setFormData(emptyForm);
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (article: any) => {
    setEditingArticle(article);
    setFormData({
      title: article.title || "",
      content: article.content || "",
      category: article.category || "General",
      tags: article.tags || article.keywords || "",
      isPublished: !!article.isPublished,
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingArticle(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<ArticleFormData> = {};
    if (!formData.title.trim() || formData.title.length < 3)
      errors.title = "Title must be at least 3 characters";
    if (!formData.content.trim() || formData.content.length < 10)
      errors.content = "Content must be at least 10 characters";
    if (!formData.category)
      errors.category = "Please select a category";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    if (editingArticle) {
      updateMutation.mutate({
        id: editingArticle.id,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        isPublished: formData.isPublished,
      });
    } else {
      createMutation.mutate({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        isPublished: formData.isPublished,
      });
    }
  };

  const handleShare = (article: any) => {
    setShareArticleData(article);
    setIsShareModalOpen(true);
  };

  // Filter articles by search query
  const filteredArticles = articles?.filter((article: any) =>
    (article?.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article?.category ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article?.tags ?? article?.keywords ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const isPending = createMutation.isPending || updateMutation.isPending;

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
            onEmail={handleShare}
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
            articleUrl={`${window.location.origin}/kb/${shareArticleData.id}`}
          />
        )}

        {/* Create / Edit Article Modal */}
        <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                {editingArticle ? "Edit Article" : "Create New KB Article"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Title */}
              <div>
                <Label className="text-gray-300 mb-1 block">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. How to Reset Your Microsoft 365 Password"
                  className="bg-slate-800 border-slate-600 text-white placeholder-gray-500"
                />
                {formErrors.title && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <Label className="text-gray-300 mb-1 block">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-slate-700">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className="text-gray-300 mb-1 block">Tags / Keywords</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. password, reset, M365, login (comma-separated)"
                  className="bg-slate-800 border-slate-600 text-white placeholder-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated keywords to improve search</p>
              </div>

              {/* Content */}
              <div>
                <Label className="text-gray-300 mb-1 block">Content * (Markdown supported)</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={`## Overview\n\nDescribe the issue and solution here...\n\n## Steps\n\n1. Step one\n2. Step two\n\n## Notes\n\nAny additional notes...`}
                  className="bg-slate-800 border-slate-600 text-white placeholder-gray-500 min-h-[280px] font-mono text-sm"
                />
                {formErrors.content && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.content}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Supports Markdown: **bold**, *italic*, ## headings, - lists, `code`
                </p>
              </div>

              {/* Publish toggle */}
              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.isPublished ? "bg-cyan-600" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.isPublished ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <div>
                  <p className="text-sm font-medium text-white">
                    {formData.isPublished ? "Published" : "Draft"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formData.isPublished
                      ? "Visible to end users in the support portal"
                      : "Only visible to admins and technicians"}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={closeForm}
                className="border-slate-600 text-gray-400 hover:text-white"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editingArticle ? (
                  "Save Changes"
                ) : (
                  "Create Article"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Article?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This will permanently delete <strong className="text-white">"{deleteTarget?.title}"</strong>.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-gray-400 hover:text-white bg-transparent">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="space-y-6">
          {/* Bulk Import Section */}
          <KBBulkImportCSV />

          {/* Legacy Bulk Insert Section */}
          {(!articles || articles.length < 30) && (
            <AdminKBBulkInsert />
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                Knowledge Base
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {articles?.length || 0} articles
                {articles && (
                  <span className="ml-2 text-gray-500">
                    ({articles.filter((a: any) => a.isPublished).length} published)
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={openCreateForm}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
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
                <Button
                  onClick={openCreateForm}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white mt-4"
                >
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
                    className={`p-4 cursor-pointer transition-[opacity,transform] border ${
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
                      {article.isPublished ? (
                        <Badge className="bg-green-900/40 text-green-400 border-green-800 text-xs border flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-800 text-xs border">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setFullScreenArticle(article); }}
                        className="flex-1 text-xs text-gray-400 hover:text-white hover:bg-slate-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); openEditForm(article); }}
                        className="flex-1 text-xs text-gray-400 hover:text-cyan-400 hover:bg-slate-700"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
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
                          {selectedArticle.isPublished ? (
                            <Badge className="bg-green-900/40 text-green-400 border-green-800 text-xs border">
                              Published
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-900/40 text-yellow-400 border-yellow-800 text-xs border">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4 flex-wrap justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFullScreenArticle(selectedArticle)}
                          className="border-cyan-600 text-cyan-400 hover:bg-cyan-900/30 text-xs"
                        >
                          <BookOpen className="w-4 h-4 mr-1" />
                          Full View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShare(selectedArticle)}
                          className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                          title="Share / Email article"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            togglePublishMutation.mutate({
                              id: selectedArticle.id,
                              isPublished: !selectedArticle.isPublished,
                            })
                          }
                          className={
                            selectedArticle.isPublished
                              ? "border-yellow-700 text-yellow-400 hover:bg-yellow-900/30"
                              : "border-green-700 text-green-400 hover:bg-green-900/30"
                          }
                          title={selectedArticle.isPublished ? "Unpublish" : "Publish"}
                          disabled={togglePublishMutation.isPending}
                        >
                          {selectedArticle.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditForm(selectedArticle)}
                          className="border-slate-600 text-gray-300 hover:text-white hover:border-cyan-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-800 text-red-400 hover:bg-red-900/30"
                          onClick={() => setDeleteTarget(selectedArticle)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Tags / Keywords */}
                    {(selectedArticle.tags || selectedArticle.keywords) && (
                      <div className="mb-4 pb-4 border-b border-slate-700">
                        <p className="text-xs text-gray-500 mb-2">Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {(selectedArticle.tags || selectedArticle.keywords || "")
                            .split(",")
                            .filter(Boolean)
                            .map((keyword: string, idx: number) => (
                              <Badge
                                key={idx}
                                className="bg-slate-700 text-gray-300 border-slate-600 text-xs"
                              >
                                {keyword.trim()}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    )}

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
                      <p>Created: {new Date(selectedArticle.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(selectedArticle.updatedAt).toLocaleString()}</p>
                      <p className="mt-2">Views: {selectedArticle.viewCount || 0}</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </>
    </AdminLayout>
  );
}
