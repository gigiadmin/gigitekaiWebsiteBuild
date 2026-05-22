import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Tag,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/AdminLayout";
import { KBFullScreenModal } from "@/components/KBFullScreenModal";

interface ArticleForm {
  title: string;
  content: string;
  category: string;
  tags: string;
  isPublished: boolean;
}

const EMPTY_FORM: ArticleForm = {
  title: "",
  content: "",
  category: "general",
  tags: "",
  isPublished: false,
};

const KB_CATEGORIES = [
  "general", "network", "hardware", "software", "security", "m365", "billing", "onboarding", "policy",
];

export default function KnowledgeBase() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "technician";

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [preview, setPreview] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const { data: articles, isLoading } = trpc.kb.list.useQuery(
    { includeUnpublished: isAdmin },
    { enabled: true }
  );

  const { data: searchResults } = trpc.kb.search.useQuery(
    { query: search },
    { enabled: search.length > 1 }
  );

  const createMutation = trpc.kb.create.useMutation({
    onSuccess: () => {
      toast.success("Article created");
      setShowModal(false);
      setForm(EMPTY_FORM);
      utils.kb.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.kb.update.useMutation({
    onSuccess: () => {
      toast.success("Article updated");
      setShowModal(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      utils.kb.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMutation = trpc.kb.togglePublish.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.isPublished ? "Article published" : "Article unpublished");
      utils.kb.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.kb.delete.useMutation({
    onSuccess: () => {
      toast.success("Article deleted");
      utils.kb.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const displayed = search.length > 1 ? (searchResults ?? []) : (articles ?? []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(a: typeof articles extends (infer T)[] | undefined ? T : never) {
    if (!a) return;
    setEditId((a as any).id);
    setForm({
      title: (a as any).title,
      content: (a as any).content,
      category: (a as any).category,
      tags: (a as any).tags ?? "",
      isPublished: (a as any).isPublished,
    });
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const previewArticle = displayed.find((a: any) => a.id === preview);
  const [fullscreenPreview, setFullscreenPreview] = useState<any>(null);

  return (
    <AdminLayout title="Knowledge Base">
    <div className="min-h-screen bg-[#0A0E1A] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#00D4FF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Knowledge Base
            </h1>
            <p className="text-xs text-gray-500">{articles?.length ?? 0} articles</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] font-bold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Article
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#141B2D] border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#00D4FF]/40 focus:outline-none transition-[opacity,transform]"
        />
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? "No articles match your search" : "No articles yet"}</p>
          {isAdmin && !search && (
            <Button onClick={openCreate} variant="outline" className="mt-4 border-[#00D4FF]/30 text-[#00D4FF]">
              Create First Article
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayed.map((a: any) => (
            <div
              key={a.id}
              className="bg-[#141B2D] border border-gray-800/60 rounded-xl p-5 hover:border-[#00D4FF]/20 transition-[opacity,transform] group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white text-sm font-semibold truncate group-hover:text-[#00D4FF] transition-colors">
                    {a.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 capitalize">
                      {a.category}
                    </span>
                    {a.isPublished ? (
                      <span className="text-[10px] flex items-center gap-0.5 text-green-400">
                        <Globe className="w-2.5 h-2.5" /> Published
                      </span>
                    ) : (
                      <span className="text-[10px] flex items-center gap-0.5 text-gray-500">
                        <Lock className="w-2.5 h-2.5" /> Draft
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-xs line-clamp-2 mb-3">
                {a.content.replace(/[#*`]/g, "").substring(0, 120)}...
              </p>

              {a.tags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {a.tags.split(",").filter(Boolean).slice(0, 3).map((t: string) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 flex items-center gap-0.5">
                      <Tag className="w-2 h-2" /> {t.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFullscreenPreview(a)}
                  className="border-gray-700 text-gray-400 hover:text-[#00D4FF] text-xs h-7 px-2 rounded-lg"
                  title="Open in fullscreen"
                >
                  <Eye className="w-3 h-3 mr-1" /> Preview
                </Button>
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(a)}
                      className="border-gray-700 text-gray-400 hover:text-yellow-400 text-xs h-7 px-2 rounded-lg"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate({ id: a.id, isPublished: !a.isPublished })}
                      className={`border-gray-700 text-xs h-7 px-2 rounded-lg ${a.isPublished ? "text-green-400 hover:text-red-400" : "text-gray-400 hover:text-green-400"}`}
                    >
                      {a.isPublished ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("Delete this article?")) deleteMutation.mutate({ id: a.id });
                      }}
                      className="border-gray-700 text-gray-400 hover:text-red-400 text-xs h-7 px-2 rounded-lg"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>

              {/* Inline Preview */}
              {preview === a.id && (
                <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {a.content}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#141B2D] border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-white font-bold text-lg mb-5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {editId ? "Edit Article" : "New KB Article"}
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Article title *"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#00D4FF]/40 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="px-3 py-2.5 bg-[#0A0E1A] border border-gray-700 rounded-xl text-sm text-white focus:border-[#00D4FF]/40 focus:outline-none"
                >
                  {KB_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  className="px-3 py-2.5 bg-[#0A0E1A] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#00D4FF]/40 focus:outline-none"
                />
              </div>
              <textarea
                placeholder="Article content (Markdown supported) *"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={10}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-[#00D4FF]/40 focus:outline-none resize-none font-mono"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="w-4 h-4 accent-[#00D4FF]"
                />
                <span className="text-sm text-gray-300">Publish immediately</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => { setShowModal(false); setEditId(null); setForm(EMPTY_FORM); }}
                className="flex-1 border-gray-700 text-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#00D4FF] to-[#0099CC] text-[#0A0E1A] font-bold rounded-xl"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editId ? "Save Changes" : "Create Article"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Fullscreen Preview Modal */}
      <KBFullScreenModal
        article={fullscreenPreview}
        isOpen={!!fullscreenPreview}
        onClose={() => setFullscreenPreview(null)}
        isAdmin={isAdmin}
      />
    </div>
    </AdminLayout>
  );
}
