/**
 * AdminCannedResponsesPage — Manage canned (quick) reply templates
 * Full CRUD: list, create, edit, delete. Grouped by category.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquareText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Copy,
  RefreshCw,
  Tag,
  BarChart2,
} from "lucide-react";

const CATEGORIES = [
  "general",
  "billing",
  "technical",
  "onboarding",
  "escalation",
  "closing",
  "follow-up",
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  billing: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  technical: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  onboarding: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  escalation: "bg-red-500/10 text-red-400 border-red-500/30",
  closing: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  "follow-up": "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

interface CannedResponse {
  id: number;
  title: string;
  body: string;
  category: string;
  usageCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

const EMPTY_FORM = { title: "", body: "", category: "general" };

export default function AdminCannedResponsesPage() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CannedResponse | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();

  const { data: responses = [], isLoading, refetch } = trpc.cannedResponses.list.useQuery(
    filterCategory !== "all" ? { category: filterCategory } : undefined
  );

  const createMutation = trpc.cannedResponses.create.useMutation({
    onSuccess: () => {
      toast.success("Canned response created");
      utils.cannedResponses.list.invalidate();
      closeForm();
    },
    onError: (e) => toast.error(e.message || "Failed to create"),
  });

  const updateMutation = trpc.cannedResponses.update.useMutation({
    onSuccess: () => {
      toast.success("Canned response updated");
      utils.cannedResponses.list.invalidate();
      closeForm();
    },
    onError: (e) => toast.error(e.message || "Failed to update"),
  });

  const deleteMutation = trpc.cannedResponses.delete.useMutation({
    onSuccess: () => {
      toast.success("Canned response deleted");
      utils.cannedResponses.list.invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message || "Failed to delete"),
  });

  const typedResponses = responses as CannedResponse[];

  const filtered = typedResponses.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.body.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, CannedResponse[]>>((acc, r) => {
    const cat = r.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(item: CannedResponse) {
    setEditItem(item);
    setForm({ title: item.title, body: item.body, category: item.category });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setIsSaving(true);
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function copyBody(body: string) {
    navigator.clipboard.writeText(body);
    toast.success("Response copied to clipboard");
  }

  return (
    <AdminLayout title="Canned Responses">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <MessageSquareText className="text-cyan-400" size={22} />
              Canned Responses
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Pre-written reply templates for faster helpdesk responses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              <Plus size={14} className="mr-1.5" />
              New Response
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-gray-400">
            <MessageSquareText size={14} className="text-cyan-400" />
            <span className="font-semibold text-white">{typedResponses.length}</span> total responses
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <Tag size={14} className="text-violet-400" />
            <span className="font-semibold text-white">
              {new Set(typedResponses.map((r) => r.category)).size}
            </span> categories
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <BarChart2 size={14} className="text-emerald-400" />
            <span className="font-semibold text-white">
              {typedResponses.reduce((sum, r) => sum + (r.usageCount ?? 0), 0)}
            </span> total uses
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by title or body..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#141B2D] border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] bg-[#141B2D] border-gray-700 text-gray-300">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grouped Responses */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading canned responses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquareText size={32} className="mx-auto mb-3 opacity-30" />
            <p>No canned responses found</p>
            <Button
              size="sm"
              onClick={openCreate}
              className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              <Plus size={14} className="mr-1.5" />
              Create First Response
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${
                      CATEGORY_COLORS[category] ?? CATEGORY_COLORS.general
                    }`}
                  >
                    {category}
                  </span>
                  <span className="text-gray-600 text-xs">{items.length} response{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#141B2D] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                            {item.usageCount > 0 && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                                <BarChart2 size={9} />
                                {item.usageCount}x used
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                            {item.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyBody(item.body)}
                            className="w-7 h-7 text-gray-500 hover:text-cyan-400"
                            title="Copy to clipboard"
                          >
                            <Copy size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            className="w-7 h-7 text-gray-500 hover:text-amber-400"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(item.id)}
                            className="w-7 h-7 text-gray-500 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={closeForm}>
        <DialogContent className="max-w-lg bg-[#141B2D] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquareText size={16} className="text-cyan-400" />
              {editItem ? "Edit Canned Response" : "New Canned Response"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editItem ? "Update the title, body, or category." : "Create a reusable reply template for your team."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Title</label>
              <Input
                placeholder="e.g. Password Reset Instructions"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="bg-[#0A0E1A] border-gray-700 text-white placeholder:text-gray-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-[#0A0E1A] border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-1.5">
                Body
                <span className="text-gray-600 font-normal ml-2 text-xs">
                  ({form.body.length} chars)
                </span>
              </label>
              <Textarea
                placeholder="Write the canned response body here..."
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={6}
                className="bg-[#0A0E1A] border-gray-700 text-white placeholder:text-gray-600 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={closeForm} className="border-gray-700 text-gray-400">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !form.title.trim() || !form.body.trim()}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                {isSaving ? "Saving..." : editItem ? "Save Changes" : "Create Response"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141B2D] border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Canned Response?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The canned response will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-400">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
