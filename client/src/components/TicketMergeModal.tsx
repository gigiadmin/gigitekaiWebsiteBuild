import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TicketMergeModalProps {
  sourceTicketId: number;
  sourceTicketTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onMergeSuccess?: () => void;
}

export function TicketMergeModal({
  sourceTicketId,
  sourceTicketTitle,
  isOpen,
  onClose,
  onMergeSuccess,
}: TicketMergeModalProps) {
  // Toast notifications are handled via sonner
  const [targetTicketId, setTargetTicketId] = useState<string>("");
  const [mergeNotes, setMergeNotes] = useState<string>("");

  const mergeMutation = trpc.ticketMerge.mergeTicket.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTargetTicketId("");
      setMergeNotes("");
      onClose();
      onMergeSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to merge tickets");
    },
  });

  const handleMerge = () => {
    if (!targetTicketId.trim()) {
      toast.error("Please enter a target ticket ID");
      return;
    }

    const targetId = parseInt(targetTicketId, 10);
    if (isNaN(targetId)) {
      toast.error("Target ticket ID must be a valid number");
      return;
    }

    if (targetId === sourceTicketId) {
      toast.error("Cannot merge a ticket into itself");
      return;
    }

    mergeMutation.mutate({
      sourceTicketId,
      targetTicketId: targetId,
      mergeNotes: mergeNotes || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Merge Ticket</DialogTitle>
          <DialogDescription>
            Merge ticket #{sourceTicketId} into another ticket
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Ticket Info */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-gray-400">Source Ticket</p>
            <p className="text-sm font-semibold text-white">
              #{sourceTicketId}: {sourceTicketTitle}
            </p>
          </div>

          {/* Alert */}
          <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              This ticket will be marked as closed and merged into the target ticket. This action can be undone.
            </p>
          </div>

          {/* Target Ticket ID */}
          <div className="space-y-2">
            <Label htmlFor="target-ticket">Target Ticket ID *</Label>
            <Input
              id="target-ticket"
              type="number"
              placeholder="Enter target ticket number (e.g., 42)"
              value={targetTicketId}
              onChange={(e) => setTargetTicketId(e.target.value)}
              disabled={mergeMutation.isPending}
              className="border-gray-700 bg-[#0A0E1A]"
            />
            <p className="text-xs text-gray-500">
              The ticket this will be merged into
            </p>
          </div>

          {/* Merge Notes */}
          <div className="space-y-2">
            <Label htmlFor="merge-notes">Merge Notes (Optional)</Label>
            <textarea
              id="merge-notes"
              placeholder="Add notes about why these tickets are being merged..."
              value={mergeNotes}
              onChange={(e) => setMergeNotes(e.target.value)}
              disabled={mergeMutation.isPending}
              className="w-full h-24 px-3 py-2 border border-gray-700 bg-[#0A0E1A] text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mergeMutation.isPending}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={mergeMutation.isPending || !targetTicketId.trim()}
            className="bg-[#00D4FF] text-black hover:bg-[#00B8D4]"
          >
            {mergeMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Merge Tickets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
