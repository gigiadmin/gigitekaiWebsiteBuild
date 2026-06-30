import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useRef } from "react";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ticketId: number) => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const utils = trpc.useUtils();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      description: "",
      stepsAttempted: "",
      category: "general_support",
      priority: "medium",
    },
  });

  const userMutation = trpc.helpdesk.createTicket.useMutation({
    onSuccess: (data) => {
      submitInProgressRef.current = false;
      console.log("[CreateTicketModal] userCreateTicket success:", data);
      toast.success("Ticket created successfully!");
      utils.helpdesk.getAllTickets.invalidate();
      reset();
      onClose();
    },
    onError: (err: any) => {
      submitInProgressRef.current = false;
      console.error("[CreateTicketModal] userCreateTicket error:", err);
      toast.error(err.message || "Failed to create ticket");
    },
  });

  const adminMutation = trpc.helpdesk.adminCreateTicket.useMutation({
    onSuccess: (data) => {
      submitInProgressRef.current = false;
      console.log("[CreateTicketModal] adminCreateTicket success:", data);
      // Just show success and close - don't try to extract ID
      toast.success("Ticket created successfully!");
      utils.helpdesk.getAllTickets.invalidate();
      reset();
      onClose();
    },
    onError: (err: any) => {
      submitInProgressRef.current = false;
      console.error("[CreateTicketModal] adminCreateTicket error:", err);
      toast.error(err.message || "Failed to create ticket");
    },
  });

  const isPending = userMutation.isPending || adminMutation.isPending;
  const submitInProgressRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);

  const onSubmit = async (data: any) => {
    // Prevent concurrent submissions
    if (submitInProgressRef.current) {
      console.warn("[CreateTicketModal] Submission already in progress, ignoring");
      return;
    }

    // Debounce: prevent rapid re-submissions
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1000) {
      console.warn("[CreateTicketModal] Submission rate-limited, ignoring");
      return;
    }

    submitInProgressRef.current = true;
    lastSubmitTimeRef.current = now;

    try {
      // Try admin mutation first
      await adminMutation.mutateAsync({
        title: data.title,
        description: data.description,
        stepsAttempted: data.stepsAttempted,
        category: data.category,
        priority: data.priority,
        channel: "web",
      });
    } catch (e) {
      console.error("[CreateTicketModal] Admin mutation failed:", e);
      submitInProgressRef.current = false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ticket (On Behalf Of)</DialogTitle>
          <DialogDescription>Open a ticket on behalf of a customer or for internal tracking</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Subject / Title */}
          <div>
            <Label htmlFor="title" className="text-cyan-400">Subject / Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...register("title", { required: "Title is required", minLength: { value: 5, message: "Title must be at least 5 characters" } })}
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
            />
            {errors.title && <span className="text-red-500 text-sm">{errors.title.message}</span>}
            <span className="text-slate-400 text-sm">35 chars (min 5)</span>
          </div>

          {/* Issue Description */}
          <div>
            <Label htmlFor="description" className="text-cyan-400">Issue Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue"
              {...register("description", { required: "Description is required", minLength: { value: 10, message: "Description must be at least 10 characters" } })}
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 resize-none"
              rows={4}
            />
            {errors.description && <span className="text-red-500 text-sm">{errors.description.message}</span>}
            <span className="text-slate-400 text-sm">35 chars (min 10)</span>
          </div>

          {/* Steps Already Tried */}
          <div>
            <Label htmlFor="stepsAttempted" className="text-slate-300">Steps Already Tried (Optional)</Label>
            <Textarea
              id="stepsAttempted"
              placeholder="What troubleshooting steps have already been attempted?"
              {...register("stepsAttempted")}
              className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 resize-none"
              rows={3}
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-slate-300">Category</Label>
            <Select defaultValue="general_support" onValueChange={(value) => register("category").onChange({ target: { value } })}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="bug_report">Bug Report</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="general_support">General Support</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="printer">Printer</SelectItem>
                <SelectItem value="internet">Internet</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div>
            <Label className="text-slate-300">Priority Level</Label>
            <div className="flex gap-2">
              {[
                { value: "low", label: "Low", color: "bg-green-600" },
                { value: "medium", label: "Medium", color: "bg-yellow-600" },
                { value: "high", label: "High", color: "bg-orange-600" },
                { value: "critical", label: "Critical", color: "bg-red-600" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => register("priority").onChange({ target: { value: p.value } })}
                  className={`px-4 py-2 rounded text-sm font-medium transition ${p.color} hover:opacity-80`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-300">
            <p className="font-semibold text-cyan-400">What happens next?</p>
            <p>The ticket will be created immediately, classified by AI, and routed to the appropriate team. Teams will be notified via Slack/Teams.</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              {isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
