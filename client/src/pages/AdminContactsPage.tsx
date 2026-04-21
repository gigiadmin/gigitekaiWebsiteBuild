/**
 * AdminContactsPage — View and manage contact form submissions
 * Shows all submissions from the public contact form with search and detail view.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Inbox,
  Search,
  Mail,
  Building2,
  Calendar,
  Eye,
  RefreshCw,
  MessageSquare,
  Copy,
} from "lucide-react";

export default function AdminContactsPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const { data: submissions = [], isLoading, refetch } = trpc.contact.list.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.company ?? "").toLowerCase().includes(q) ||
      s.message.toLowerCase().includes(q)
    );
  });

  const selectedItem = submissions.find((s) => s.id === selected) ?? null;

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  }

  return (
    <AdminLayout title="Contact Submissions">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Inbox className="text-cyan-400" size={22} />
              Contact Submissions
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              All messages submitted via the public contact form
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{submissions.length} total</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              <RefreshCw size={14} className="mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by name, email, company, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#141B2D] border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Table */}
        <div className="bg-[#141B2D] border border-gray-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Loading submissions...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Inbox size={32} className="mx-auto mb-3 opacity-30" />
              <p>No contact submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Company</th>
                    <th className="text-left px-4 py-3">Message Preview</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white">{sub.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Mail size={12} className="text-gray-500 shrink-0" />
                          <span className="truncate max-w-[180px]">{sub.email}</span>
                          <button
                            onClick={() => copyEmail(sub.email)}
                            className="text-gray-600 hover:text-cyan-400 transition-colors"
                            title="Copy email"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sub.company ? (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Building2 size={12} className="text-gray-600" />
                            {sub.company}
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-400 text-xs truncate max-w-[220px]">{sub.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Calendar size={10} />
                          {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(sub.id)}
                          className="border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 text-xs h-7 px-2"
                        >
                          <Eye size={12} className="mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg bg-[#141B2D] border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-cyan-400" />
              Contact Message
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Submitted {selectedItem ? new Date(selectedItem.createdAt).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                  <p className="text-white font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company</p>
                  <p className="text-gray-300">{selectedItem.company ?? "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedItem.email}`}
                    className="text-cyan-400 hover:underline font-medium"
                  >
                    {selectedItem.email}
                  </a>
                  <button
                    onClick={() => copyEmail(selectedItem.email)}
                    className="text-gray-600 hover:text-cyan-400 transition-colors"
                    title="Copy email"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Message</p>
                <div className="bg-[#0A0E1A] border border-gray-800 rounded-lg p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedItem.message}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelected(null)}
                  className="border-gray-700 text-gray-400"
                >
                  Close
                </Button>
                <Button
                  asChild
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                >
                  <a href={`mailto:${selectedItem.email}?subject=Re: Your message to GigitekAI`}>
                    <Mail size={14} className="mr-1.5" />
                    Reply via Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
