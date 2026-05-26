import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Trash2,
  CheckCircle,
  Mail,
  UserPlus,
  PauseCircle,
  XCircle,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkTicketActionsProps {
  selectedTicketIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onActionComplete: () => void;
}

export function BulkTicketActions({
  selectedTicketIds,
  onSelectionChange,
  onActionComplete,
}: BulkTicketActionsProps) {
  const [newStatus, setNewStatus] = useState<
    "open" | "in_progress" | "on_hold" | "resolved" | "closed"
  >("open");
  const [isLoading, setIsLoading] = useState(false);

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Assign dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const bulkUpdateStatus = trpc.helpdesk.bulkUpdateStatus.useMutation();
  const bulkDelete = trpc.helpdesk.bulkDelete.useMutation();
  const bulkAssignAgent = trpc.helpdesk.bulkAssignAgent.useMutation();
  const bulkSendEmail = trpc.helpdesk.bulkSendEmail.useMutation();
  const { data: adminUsers } = trpc.helpdesk.getAdminUsers.useQuery();

  const handleBulkUpdateStatus = async (status?: typeof newStatus) => {
    const targetStatus = status || newStatus;
    if (selectedTicketIds.length === 0) return;
    setIsLoading(true);
    try {
      await bulkUpdateStatus.mutateAsync({
        ticketIds: selectedTicketIds,
        status: targetStatus,
      });
      toast.success(`Updated ${selectedTicketIds.length} ticket(s) to ${targetStatus.replace("_", " ")}`);
      onSelectionChange([]);
      onActionComplete();
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedTicketIds.length} ticket(s)? This cannot be undone.`)) return;
    setIsLoading(true);
    try {
      await bulkDelete.mutateAsync({ ticketIds: selectedTicketIds });
      toast.success(`Deleted ${selectedTicketIds.length} ticket(s)`);
      onSelectionChange([]);
      onActionComplete();
    } catch (e) {
      toast.error("Failed to delete tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedAgentId) return;
    setIsLoading(true);
    try {
      const result = await bulkAssignAgent.mutateAsync({
        ticketIds: selectedTicketIds,
        agentId: parseInt(selectedAgentId),
      });
      toast.success(`Assigned ${result.count} ticket(s)`);
      setAssignDialogOpen(false);
      setSelectedAgentId("");
      onSelectionChange([]);
      onActionComplete();
    } catch (e) {
      toast.error("Failed to assign tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    if (!emailSubject || !emailMessage) return;
    setIsLoading(true);
    try {
      const result = await bulkSendEmail.mutateAsync({
        ticketIds: selectedTicketIds,
        subject: emailSubject,
        message: emailMessage,
      });
      toast.success(`Email sent to ${result.sent} of ${result.total} ticket submitters`);
      setEmailDialogOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch (e) {
      toast.error("Failed to send emails");
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedTicketIds.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-blue-950/60 border border-blue-800 rounded-lg flex-wrap">
        <span className="text-sm font-semibold text-blue-300 mr-1">
          {selectedTicketIds.length} ticket{selectedTicketIds.length !== 1 ? "s" : ""} selected
        </span>

        {/* Status Update */}
        <div className="flex items-center gap-1">
          <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => handleBulkUpdateStatus()}
            disabled={isLoading}
            variant="default"
            size="sm"
            className="h-8 text-xs bg-cyan-600 hover:bg-cyan-500"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Update Status
          </Button>
        </div>

        <div className="h-5 w-px bg-blue-700 mx-1" />

        {/* Quick Actions */}
        <Button
          onClick={() => handleBulkUpdateStatus("on_hold")}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"
          title="Put selected tickets on hold"
        >
          <PauseCircle className="w-3 h-3 mr-1" />
          On Hold
        </Button>

        <Button
          onClick={() => handleBulkUpdateStatus("closed")}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-gray-600 text-gray-400 hover:bg-gray-800"
          title="Close selected tickets"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Close
        </Button>

        {/* Assign Agent */}
        <Button
          onClick={() => setAssignDialogOpen(true)}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-purple-600 text-purple-400 hover:bg-purple-900/30"
          title="Assign selected tickets to an agent"
        >
          <UserPlus className="w-3 h-3 mr-1" />
          Assign
        </Button>

        {/* Email */}
        <Button
          onClick={() => setEmailDialogOpen(true)}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="h-8 text-xs border-green-600 text-green-400 hover:bg-green-900/30"
          title="Send email to ticket submitters"
        >
          <Mail className="w-3 h-3 mr-1" />
          Email
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isLoading}>
              More <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleBulkUpdateStatus("in_progress")}>
              Set In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkUpdateStatus("resolved")}>
              Mark Resolved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkUpdateStatus("open")}>
              Reopen Tickets
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleBulkDelete}
              className="text-red-400 focus:text-red-400"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Selection */}
        <Button
          onClick={() => onSelectionChange([])}
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-400 ml-auto"
        >
          Clear
        </Button>
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedTicketIds.length} Ticket Submitter{selectedTicketIds.length !== 1 ? "s" : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="e.g. Update on your support ticket"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={5}
                className="mt-1"
              />
            </div>
            <p className="text-xs text-gray-500">
              Emails will only be sent to tickets that have a requester email address on file.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkEmail}
              disabled={isLoading || !emailSubject || !emailMessage}
              className="bg-green-600 hover:bg-green-500"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign {selectedTicketIds.length} Ticket{selectedTicketIds.length !== 1 ? "s" : ""} to Agent</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Agent</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {adminUsers && adminUsers.length > 0 ? (
                  adminUsers.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {agent.name || agent.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="0" disabled>No agents available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleBulkAssign}
              disabled={isLoading || !selectedAgentId}
              className="bg-purple-600 hover:bg-purple-500"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
