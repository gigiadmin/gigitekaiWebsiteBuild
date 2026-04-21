/**
 * EscalateToMeetingDialog
 * Allows agents to create a Teams meeting for a ticket with one click.
 * Sends the join link to the customer via email and posts to Teams channel.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Video, Calendar, Clock, AlertTriangle, ExternalLink, Copy } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
  ticketTitle: string;
  agentEmail?: string;
}

export default function EscalateToMeetingDialog({ open, onOpenChange, ticketId, ticketTitle, agentEmail }: Props) {
  const now = new Date();
  // Default: 30 minutes from now, 1 hour duration
  const defaultStart = new Date(now.getTime() + 30 * 60 * 1000);
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const toLocalDatetimeInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [startTime, setStartTime] = useState(toLocalDatetimeInput(defaultStart));
  const [endTime, setEndTime] = useState(toLocalDatetimeInput(defaultEnd));
  const [subject, setSubject] = useState(`Support Escalation: ${ticketTitle}`);
  const [message, setMessage] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState(agentEmail ?? "");
  const [result, setResult] = useState<{ joinUrl: string; subject: string } | null>(null);

  const escalate = trpc.teamsMeetingEscalation.escalateToMeeting.useMutation({
    onSuccess: (data) => {
      setResult({ joinUrl: data.joinUrl, subject: data.subject });
      toast.success("🎉 Meeting created!", {
        description: "Customer has been notified. Join link is ready.",
      });
    },
    onError: (err) => {
      toast.error("Failed to create meeting", { description: err.message });
    },
  });

  const handleSubmit = () => {
    if (!organizerEmail) {
      toast.error("Please enter the organizer's M365 email address.");
      return;
    }
    escalate.mutate({
      ticketId,
      scheduledStart: new Date(startTime).toISOString(),
      scheduledEnd: new Date(endTime).toISOString(),
      agentEmail: organizerEmail,
      subject,
      message: message || undefined,
    });
  };

  const handleClose = () => {
    setResult(null);
    setStartTime(toLocalDatetimeInput(defaultStart));
    setEndTime(toLocalDatetimeInput(defaultEnd));
    setSubject(`Support Escalation: ${ticketTitle}`);
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            Escalate to Teams Meeting
          </DialogTitle>
        </DialogHeader>

        {result ? (
          // Success state — show join link
          <div className="py-4 space-y-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-green-400" />
              </div>
              <p className="font-semibold text-green-300 text-lg">Meeting Created!</p>
              <p className="text-slate-400 text-sm mt-1">Customer has been notified via email</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Meeting Subject</p>
              <p className="text-white text-sm font-medium">{result.subject}</p>
            </div>

            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-2">Join URL</p>
              <div className="flex items-center gap-2">
                <code className="text-cyan-300 text-xs flex-1 truncate">{result.joinUrl}</code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(result.joinUrl);
                    toast.success("Copied to clipboard!");
                  }}
                  className="border-slate-600 text-slate-300 h-7 px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(result.joinUrl, "_blank")}
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 h-7 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Form state
          <div className="py-2 space-y-4">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Ticket</Label>
              <div className="bg-slate-800 rounded px-3 py-2 text-sm text-slate-300">
                #{ticketId}: {ticketTitle}
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Meeting Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Start Time
                </Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> End Time
                </Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Organizer M365 Email *</Label>
              <Input
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="agent@gigitekai.com"
                className="bg-slate-800 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">The meeting will be created on behalf of this M365 user</p>
            </div>

            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Custom Message to Customer (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your ticket has been escalated to a live meeting..."
                className="bg-slate-800 border-slate-600 text-white resize-none"
                rows={2}
              />
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Requires <strong>OnlineMeetings.ReadWrite.All</strong> permission on the M365 app registration.
                The customer will receive an email with the join link.
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="border-slate-600 text-slate-300">
            {result ? "Done" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleSubmit}
              disabled={escalate.isPending || !subject || !startTime || !endTime}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {escalate.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating Meeting...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Create Meeting & Notify
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
