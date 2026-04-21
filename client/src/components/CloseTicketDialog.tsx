/**
 * CloseTicketDialog
 * Intercepts the "Close" action on a ticket and requires the admin to enter
 * closing notes (min 10 chars) before the ticket can be set to "closed".
 * After closing, offers Copilot KB generation via KbAwarenessPanel.
 */
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { XCircle, FileText, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import KbAwarenessPanel from "./KbAwarenessPanel";

interface CloseTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  ticketTitle: string;
  ticketStatus: string;
  onSuccess?: () => void;
}

const MIN_CHARS = 10;
const MAX_CHARS = 2000;

export default function CloseTicketDialog({
  open,
  onOpenChange,
  ticketId,
  ticketTitle,
  ticketStatus,
  onSuccess,
}: CloseTicketDialogProps) {
  const [notes, setNotes] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const utils = trpc.useUtils();

  const closeTicket = trpc.helpdesk.closeTicket.useMutation({
    onSuccess: () => {
      toast.success(`Ticket #${ticketId} closed successfully`);
      utils.helpdesk.getAllTickets.invalidate();
      utils.helpdesk.getMetrics.invalidate();
      setIsClosed(true);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(`Failed to close ticket: ${err.message}`);
    },
  });

  const charCount = notes.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const isSubmitting = closeTicket.isPending;

  const handleClose = () => {
    if (!isValid) return;
    closeTicket.mutate({ ticketId, closingNotes: notes });
  };

  const handleCancel = () => {
    setNotes("");
    setIsClosed(false);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#161B22] border-slate-700 max-w-lg">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle size={18} className="text-red-400" />
            </div>
            <AlertDialogTitle className="text-white text-base">
              Close Ticket
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-400 text-sm leading-relaxed">
            You are about to close this ticket. This action will notify the customer
            and mark the issue as resolved. Closing notes are required and will be
            visible to the customer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Ticket summary */}
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 space-y-1.5">
          <div className="flex items-start gap-2">
            <FileText size={13} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">{ticketTitle}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-xs">#{ticketId}</span>
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 border-amber-500/40 text-amber-400 bg-amber-500/10"
                >
                  {ticketStatus.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Closing notes input */}
        <div className="space-y-2">
          <Label className="text-slate-300 text-xs font-medium flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-400" />
            Closing Notes
            <span className="text-red-400">*</span>
          </Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe the resolution, steps taken, and any follow-up actions required. This will be visible to the customer..."
            className="bg-slate-900/60 border-slate-600 text-slate-200 placeholder:text-slate-500 text-sm resize-none focus:border-cyan-500/50 min-h-[120px]"
            maxLength={MAX_CHARS}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            {charCount > 0 && charCount < MIN_CHARS ? (
              <p className="text-red-400 text-xs">
                Minimum {MIN_CHARS} characters required ({MIN_CHARS - charCount} more needed)
              </p>
            ) : charCount >= MIN_CHARS ? (
              <p className="text-emerald-400 text-xs">✓ Notes look good</p>
            ) : (
              <p className="text-slate-500 text-xs">Minimum {MIN_CHARS} characters</p>
            )}
            <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? "text-amber-400" : "text-slate-500"}`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>
        </div>

        {/* KB Awareness Panel — shown after ticket is closed */}
        {isClosed && (
          <KbAwarenessPanel
            ticketId={ticketId}
            ticketTitle={ticketTitle}
            ticketStatus="closed"
          />
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            onClick={handleCancel}
            className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
            disabled={isSubmitting}
          >
            {isClosed ? "Done" : "Keep Open"}
          </AlertDialogCancel>
          {!isClosed && (
            <Button
              onClick={handleClose}
              disabled={!isValid || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white border-0 gap-2"
            >
              <XCircle size={14} />
              {isSubmitting ? "Closing..." : "Close Ticket"}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
