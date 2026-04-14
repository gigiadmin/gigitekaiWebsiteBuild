import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Trash2, CheckCircle, AlertCircle } from "lucide-react";

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

  const bulkUpdateStatus = trpc.helpdesk.bulkUpdateStatus.useMutation();
  const bulkDelete = trpc.helpdesk.bulkDelete.useMutation();

  const handleBulkUpdateStatus = async () => {
    if (selectedTicketIds.length === 0) return;
    setIsLoading(true);
    try {
      await bulkUpdateStatus.mutateAsync({
        ticketIds: selectedTicketIds,
        newStatus,
      });
      onSelectionChange([]);
      onActionComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedTicketIds.length} ticket(s)?`)) return;
    setIsLoading(true);
    try {
      await bulkDelete.mutateAsync({ ticketIds: selectedTicketIds });
      onSelectionChange([]);
      onActionComplete();
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedTicketIds.length === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
      <span className="text-sm font-medium">
        {selectedTicketIds.length} ticket{selectedTicketIds.length !== 1 ? "s" : ""} selected
      </span>

      <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
        <SelectTrigger className="w-40">
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
        onClick={handleBulkUpdateStatus}
        disabled={isLoading}
        variant="default"
        size="sm"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Update Status
      </Button>

      <Button
        onClick={handleBulkDelete}
        disabled={isLoading}
        variant="destructive"
        size="sm"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete
      </Button>
    </div>
  );
}
