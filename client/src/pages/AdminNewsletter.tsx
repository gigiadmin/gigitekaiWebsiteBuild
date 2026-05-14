import AdminLayout from "@/components/AdminLayout";
/**
 * AdminNewsletter — Newsletter management hub
 * Tabs: Subscribers (list, stats, CSV export, delete) | Broadcast (compose & send campaigns)
 */

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";
import { Mail, Trash2, Download, Loader2, Users } from "lucide-react";

function SubscribersList() {
  const utils = trpc.useUtils();
  const { data: subscribers, isLoading } = trpc.newsletter.listSubscribers.useQuery();
  const { data: stats } = trpc.newsletter.subscriberStats.useQuery();
  const { data: csvData } = trpc.newsletter.exportCsv.useQuery();

  const deleteSubscriber = trpc.newsletter.deleteSubscriber.useMutation({
    onSuccess: () => {
      toast.success("Subscriber removed");
      utils.newsletter.listSubscribers.invalidate();
      utils.newsletter.subscriberStats.invalidate();
      utils.newsletter.exportCsv.invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteTarget, setDeleteTarget] = useState<{ id: number; email: string } | null>(null);

  function handleExportCsv() {
    if (!csvData?.csv) {
      toast.error("No active subscribers to export.");
      return;
    }
    const blob = new Blob([csvData.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gigitekai-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Mail className="text-[#00D4FF]" size={22} />
          <div>
            <h2 className="text-xl font-bold text-white">Newsletter Subscribers</h2>
            <p className="text-gray-400 text-sm">Manage email subscribers from the blog</p>
          </div>
        </div>
        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="border-[rgba(0,212,255,0.3)] text-[#00D4FF] hover:bg-[rgba(0,212,255,0.1)]"
        >
          <Download size={14} className="mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-[#00D4FF]" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)] p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail size={16} className="text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Active</span>
            </div>
            <p className="text-3xl font-bold text-white">{stats.active}</p>
          </div>
        </div>
      )}

      {/* Subscriber table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#00D4FF] mr-3" size={24} />
          <span className="text-gray-400">Loading subscribers…</span>
        </div>
      ) : !subscribers || subscribers.length === 0 ? (
        <div className="text-center py-16 bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)]">
          <Mail className="mx-auto text-gray-600 mb-4" size={40} />
          <p className="text-gray-400 text-lg mb-1">No subscribers yet</p>
          <p className="text-gray-500 text-sm">Subscribers will appear here once visitors sign up from the blog.</p>
        </div>
      ) : (
        <div className="bg-[#141B2D] rounded-xl border border-[rgba(0,212,255,0.1)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(0,212,255,0.1)] text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Subscribed</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr
                  key={sub.id}
                  className="border-b border-[rgba(0,212,255,0.05)] hover:bg-[rgba(0,212,255,0.03)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white font-medium">{sub.email}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                    {sub.source || "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-400 text-xs">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {sub.active ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Unsubscribed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                        title="Delete subscriber"
                        onClick={() => setDeleteTarget({ id: sub.id, email: sub.email })}
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

      {/* Delete confirmation dialog — SubscribersList */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove Subscriber</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to permanently remove <strong className="text-white">{deleteTarget?.email}</strong> from the subscriber list? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteSubscriber.mutate({ id: deleteTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminNewsletter() {
  return (
    <div className="space-y-4">
      <SubscribersList />
    </div>
  );
}
