/*
  AdminBlog — Blog post management for Admin Portal
  Features: list all posts (drafts + published), create, edit, delete, toggle publish
  Editor: TipTap rich text WYSIWYG
  Images: drag-and-drop S3 uploader
*/

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, BookOpen, ImageIcon, X, Mail, ExternalLink } from "lucide-react";
import { lazy, Suspense } from "react";
// @tiptap/react import removed — was pulling ~400KB TipTap+ProseMirror into vendor chunk
// useEditor type replaced with generic to keep tiptap in lazy-loaded RichTextEditor chunk
const RichTextEditor = lazy(() => import("@/components/RichTextEditor").then(m => ({ default: m.default })));
import DragDropImageUploader from "@/components/DragDropImageUploader";
import AdminLayout from "@/components/AdminLayout";

// ─── types ───────────────────────────────────────────────────────────────────

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  authorName: string;
  authorTitle: string | null;
  authorBio: string | null;
  authorAvatar: string | null;
  featuredImage: string | null;
  published: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const EMPTY_FORM = {
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  category: "",
  readTime: "",
  authorName: "GigitekAI Team",
  authorTitle: "",
  authorBio: "",
  authorAvatar: "",
  featuredImage: "",
  published: false,
};

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Estimate reading time from HTML content (200 wpm average) */
function estimateReadTime(html: string): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminBlog() {
  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.blog.adminListPosts.useQuery();
  const [shareEmail, setShareEmail] = useState<{ postId: number; postTitle: string; postSlug: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  const createPost = trpc.blog.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post created successfully");
      utils.blog.adminListPosts.invalidate();
      utils.blog.listPosts.invalidate();
      setDialogOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePost = trpc.blog.updatePost.useMutation({
    onSuccess: () => {
      toast.success("Post updated successfully");
      utils.blog.adminListPosts.invalidate();
      utils.blog.listPosts.invalidate();
      setDialogOpen(false);
      setEditingPost(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err.message),
  });

  const sendBlogEmail = trpc.blog.sendBlogEmail.useMutation({
    onSuccess: () => {
      toast.success("Blog post shared successfully");
      setShareEmail(null);
      setRecipientEmail("");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to send email");
    },
  });

  const deletePost = trpc.blog.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      utils.blog.adminListPosts.invalidate();
      utils.blog.listPosts.invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const togglePublished = trpc.blog.togglePublished.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.published ? "Post published" : "Post unpublished");
      utils.blog.adminListPosts.invalidate();
      utils.blog.listPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showImageUploader, setShowImageUploader] = useState(false);
  // Ref to the TipTap editor instance so we can insert images programmatically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  function openCreate() {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setShowImageUploader(false);
    setDialogOpen(true);
  }

  function openEdit(post: Post) {
    setEditingPost(post);
    setForm({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      readTime: post.readTime,
      authorName: post.authorName,
      authorTitle: post.authorTitle ?? "",
      authorBio: post.authorBio ?? "",
      authorAvatar: post.authorAvatar ?? "",
      featuredImage: post.featuredImage ?? "",
      published: post.published,
    });
    setShowImageUploader(false);
    setDialogOpen(true);
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      ...(editingPost ? {} : { slug: slugify(title) }),
    }));
  }

  function handleSubmit() {
    if (!form.title || !form.slug || !form.excerpt || !form.content || !form.category || !form.readTime) {
      toast.error("Please fill in all required fields");
      return;
    }
    const payload = {
      ...form,
      featuredImage: form.featuredImage || undefined,
    };
    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, ...payload });
    } else {
      createPost.mutate(payload);
    }
  }

  /** Called when user uploads an image from the inline uploader inside the editor toolbar */
  function handleEditorImageInsert() {
    setShowImageUploader(true);
  }

  /** Called when the uploader finishes — insert image into editor and update featured image */
  function handleImageUploaded(url: string) {
    // Insert into rich text editor at cursor
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: url }).run();
    }
    // Also offer as featured image if not set
    setForm((f) => ({ ...f, featuredImage: f.featuredImage || url }));
    setShowImageUploader(false);
  }

  const isSaving = createPost.isPending || updatePost.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#00D4FF]" size={22} />
          <div>
            <h2 className="text-xl font-bold text-white">Blog Management</h2>
            <p className="text-gray-400 text-sm">Create, edit, and publish blog posts</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold"
        >
          <Plus size={16} className="mr-2" />
          New Post
        </Button>
      </div>

      {/* Posts table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={24} />
          <span className="text-gray-400">Loading posts…</span>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-16 bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)]">
          <BookOpen className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400 text-lg mb-2">No blog posts yet</p>
          <p className="text-gray-500 text-sm mb-6">Create your first post to get started</p>
          <Button
            onClick={openCreate}
            className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold"
          >
            <Plus size={16} className="mr-2" />
            Create First Post
          </Button>
        </div>
      ) : (
        <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.1)] text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      className="text-left hover:text-[#00D4FF] transition-colors cursor-pointer"
                    >
                      <div className="font-medium text-white line-clamp-1">{post.title}</div>
                      <div className="text-gray-500 text-xs mt-0.5">/blog/{post.slug}</div>
                    </button>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[#00D4FF] text-xs font-semibold uppercase tracking-wider">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                      : new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Published</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Draft</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {post.published && (
                        <>
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-[#00D4FF]"
                            title="View Post"
                            onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          >
                            <ExternalLink size={14} />
                          </Button>
                          <Button
                            size="sm" variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-[#00D4FF]"
                            title="Share via Email"
                            onClick={() => setShareEmail({ postId: post.id, postTitle: post.title, postSlug: post.slug })}
                          >
                            <Mail size={14} />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-[#00D4FF]"
                        title={post.published ? "Unpublish" : "Publish"}
                        onClick={() => togglePublished.mutate({ id: post.id, published: !post.published })}
                      >
                        {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-[#00D4FF]"
                        title="Edit"
                        onClick={() => openEdit(post as unknown as Post)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                        title="Delete"
                        onClick={() => setDeleteTarget(post as unknown as Post)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingPost(null); setForm(EMPTY_FORM); setShowImageUploader(false); }
        }}
      >
        <DialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              {editingPost ? "Edit Post" : "Create New Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Post title"
                className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Slug * (URL: /blog/your-slug)</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="post-url-slug"
                className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 font-mono text-sm"
              />
            </div>

            {/* Category + Read Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Category *</label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Cloud Strategy"
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Read Time *
                  <span className="ml-2 text-[#00D4FF] text-xs font-normal">auto-calculated</span>
                </label>
                <Input
                  value={form.readTime}
                  onChange={(e) => setForm((f) => ({ ...f, readTime: e.target.value }))}
                  placeholder="e.g. 8 min read"
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Author section */}
            <div className="space-y-3 rounded-xl border border-[rgba(0,212,255,0.1)] p-4 bg-[#0A0E1A]/50">
              <p className="text-xs font-bold uppercase tracking-widest text-[#00D4FF] mb-1">Author Details</p>

              {/* Author name + title side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Author Name</label>
                  <Input
                    value={form.authorName}
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                    placeholder="GigitekAI Team"
                    className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Author Title</label>
                  <Input
                    value={form.authorTitle}
                    onChange={(e) => setForm((f) => ({ ...f, authorTitle: e.target.value }))}
                    placeholder="CEO & Founder, GigitekAI"
                    className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Author bio */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Author Bio</label>
                <Textarea
                  value={form.authorBio}
                  onChange={(e) => setForm((f) => ({ ...f, authorBio: e.target.value }))}
                  placeholder="Short bio shown at the bottom of the article…"
                  rows={2}
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Author avatar URL */}
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Author Avatar URL</label>
                <Input
                  value={form.authorAvatar}
                  onChange={(e) => setForm((f) => ({ ...f, authorAvatar: e.target.value }))}
                  placeholder="https://cdn.example.com/avatar.jpg"
                  className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 font-mono text-sm"
                />
                {form.authorAvatar && (
                  <img
                    src={form.authorAvatar}
                    alt="Author avatar preview"
                    className="mt-2 w-12 h-12 rounded-full object-cover border-2 border-[#00D4FF]/30"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Excerpt * (short summary for listing)</label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Brief description of the post…"
                rows={3}
                className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 resize-none"
              />
            </div>

            {/* Rich Text Content */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Content *</label>
                            <Suspense fallback={<div className="h-96 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">Loading editor...</div>}>
                              <RichTextEditor
                value={form.content}
                onChange={(html) => {
                  const estimated = estimateReadTime(html);
                  setForm((f) => ({ ...f, content: html, readTime: estimated }));
                }}
                onImageInsert={handleEditorImageInsert}
                placeholder="Write your article here…"
                minHeight="360px"
              />
                            </Suspense>
            </div>

            {/* Inline image uploader (shown when toolbar image button is clicked) */}
            {showImageUploader && (
              <div className="bg-[#0A0E1A] rounded-xl border border-[rgba(0,212,255,0.2)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <ImageIcon size={14} className="text-[#00D4FF]" />
                    Upload Image
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowImageUploader(false)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                </div>
                <DragDropImageUploader
                  onUploaded={handleImageUploaded}
                  onCancel={() => setShowImageUploader(false)}
                />
              </div>
            )}

            {/* Featured Image */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Featured Image</label>
              {form.featuredImage ? (
                <div className="relative rounded-xl overflow-hidden border border-[rgba(0,212,255,0.2)]">
                  <img
                    src={form.featuredImage}
                    alt="Featured"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, featuredImage: "" }))}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1"
                    title="Remove featured image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <DragDropImageUploader
                  onUploaded={(url) => setForm((f) => ({ ...f, featuredImage: url }))}
                  currentUrl={null}
                />
              )}
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                role="switch"
                aria-checked={form.published}
                onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.published ? "bg-[#00D4FF]" : "bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.published ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-300">
                {form.published ? "Published (visible to public)" : "Draft (not visible to public)"}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setEditingPost(null); setForm(EMPTY_FORM); }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="bg-[#00D4FF] hover:bg-[#00B8E0] text-[#0A0E1A] font-semibold"
            >
              {isSaving ? (
                <><Loader2 size={14} className="animate-spin mr-2" /> Saving…</>
              ) : editingPost ? "Save Changes" : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete <strong className="text-white">"{deleteTarget?.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-transparent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deletePost.mutate({ id: deleteTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePost.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
