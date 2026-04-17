import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Download, Search, Eye, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Ticket {
  id: number;
  title: string;
  category?: string;
  priority: string;
  createdAt: Date;
  closedAt: Date;
  closingNotes?: string;
}

export default function AdminClosedTicketsReportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const { data: closedTickets = [], isLoading } = trpc.helpdesk.getClosedTicketsReport.useQuery(
    { days: 30 },
    { refetchInterval: 30000 }
  );

  const reopenTicket = trpc.helpdesk.reopenTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket reopened successfully");
      setShowReopenDialog(false);
      setReopenReason("");
      setSelectedTicket(null);
    },
  });

  const filteredTickets = useMemo(() => {
    if (!searchQuery) return closedTickets as Ticket[];
    const query = searchQuery.toLowerCase();
    return (closedTickets as Ticket[]).filter(
      (t) =>
        t.id.toString().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.closingNotes?.toLowerCase().includes(query)
    );
  }, [closedTickets, searchQuery]);

  const metrics = useMemo(() => {
    if (filteredTickets.length === 0) return { avgResolutionTime: 0, totalTickets: 0 };

    const resolutionTimes = filteredTickets
      .map((t: Ticket) => (new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60))
      .filter((t: number) => t > 0);

    const avgResolutionTime = resolutionTimes.length > 0
      ? (resolutionTimes.reduce((a: number, b: number) => a + b, 0) / resolutionTimes.length).toFixed(1)
      : 0;

    return {
      avgResolutionTime,
      totalTickets: filteredTickets.length,
    };
  }, [filteredTickets]);

  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Category", "Priority", "Closed Date", "Resolution Time (hours)", "Closing Notes"];
    const rows = filteredTickets.map((t: Ticket) => {
      const resolutionHours = (
        (new Date(t.closedAt).getTime() - new Date(t.createdAt).getTime()) /
        (1000 * 60 * 60)
      ).toFixed(1);
      return [
        `#${t.id}`,
        t.title,
        t.category || "General",
        t.priority,
        new Date(t.closedAt).toLocaleDateString(),
        resolutionHours,
        `"${t.closingNotes || ""}"`,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `closed-tickets-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Closed Tickets Report</h1>
        <p className="text-slate-400 mt-1">Last 30 days — {filteredTickets.length} tickets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Closed</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.totalTickets}</p>
        </Card>
        <Card className="bg-slate-900/60 border-slate-700/50 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.avgResolutionTime}h</p>
        </Card>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by ticket ID, title, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/60 border-slate-700/50"
          />
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <Card className="bg-slate-900/60 border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No closed tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50 bg-slate-900/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Closed Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-300">Resolution Time</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredTickets.map((ticket: Ticket) => {
                  const resolutionHours = (
                    (new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime()) /
                    (1000 * 60 * 60)
                  ).toFixed(1);

                  return (
                    <tr key={ticket.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-cyan-400">#{ticket.id}</td>
                      <td className="px-4 py-3 text-slate-300">{ticket.title}</td>
                      <td className="px-4 py-3 text-slate-400">{ticket.category || "General"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(ticket.closedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{resolutionHours}h</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTicket(ticket)}
                            className="gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowReopenDialog(true);
                            }}
                            className="gap-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reopen
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedTicket && !showReopenDialog && (
        <Dialog open={true} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="bg-slate-900 border-slate-700/50">
            <DialogHeader>
              <DialogTitle>Ticket #{selectedTicket.id} — Closing Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Title</p>
                <p className="text-slate-300">{selectedTicket.title}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Closed</p>
                <p className="text-slate-300">
                  {new Date(selectedTicket.closedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Closing Notes</p>
                <p className="text-slate-300 whitespace-pre-wrap bg-slate-800/40 p-3 rounded border border-slate-700/30">
                  {selectedTicket.closingNotes || "No notes provided"}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedTicket && (
        <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
          <AlertDialogContent className="bg-slate-900 border-slate-700/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Reopen Ticket #{selectedTicket.id}?</AlertDialogTitle>
              <AlertDialogDescription>
                Provide a reason for reopening this ticket. This will help track why the issue wasn't fully resolved.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Reason for Reopening *</label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., Customer reports issue still occurring, incomplete resolution..."
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-slate-500">{reopenReason.length}/500</p>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (reopenReason.length < 10) {
                    toast.error("Reason must be at least 10 characters");
                    return;
                  }
                  reopenTicket.mutate({
                    ticketId: selectedTicket.id,
                    reopenReason,
                  });
                }}
                disabled={reopenReason.length < 10 || reopenTicket.isPending}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Reopen Ticket
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
