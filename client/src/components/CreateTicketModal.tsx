import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useRef, useState, useEffect } from "react";
import { BookOpen, X, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";

interface CreateTicketModalProps {
  mode?: "user" | "admin";
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (ticketId?: number) => void;
}

export function CreateTicketModal({ mode = "admin", open, isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const dialogOpen = open ?? isOpen ?? false;
  const utils = trpc.useUtils();
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [kbQuery, setKbQuery] = useState("");
  const [showKbSuggestions, setShowKbSuggestions] = useState(false);
  const [, navigate] = useLocation();
  const kbDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: kbSuggestions } = trpc.kb.search.useQuery(
    { query: kbQuery, limit: 4 },
    { enabled: kbQuery.length >= 5 }
  );

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      requesterName: "",
      requesterEmail: "",
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
      console.log("[CreateTicketModal] User mutation succeeded:", data);
      toast.success("Ticket created successfully!");
      // Wrap invalidation in try/catch to prevent errors from affecting UX
      try {
        utils.helpdesk.getAllTickets.invalidate();
      } catch (e) {
        console.warn("[Support Services] Failed to invalidate tickets cache:", e);
      }
      reset();
      setSelectedPriority("medium");
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      submitInProgressRef.current = false;
      console.error("[CreateTicketModal] User mutation error:", err);
      const errorMessage = err?.message || err?.data?.message || "Failed to create ticket";
      toast.error(errorMessage);
    },
  });

  const adminMutation = trpc.helpdesk.adminCreateTicket.useMutation({
    onSuccess: (data) => {
      submitInProgressRef.current = false;
      console.log("[CreateTicketModal] Admin mutation succeeded:", data);
      toast.success("Ticket created successfully!");
      // Wrap invalidation in try/catch to prevent errors from affecting UX
      try {
        utils.helpdesk.getAllTickets.invalidate();
      } catch (e) {
        console.warn("[Support Services] Failed to invalidate tickets cache:", e);
      }
      reset();
      setSelectedPriority("medium");
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      submitInProgressRef.current = false;
      console.error("[CreateTicketModal] Admin mutation error:", err);
      const errorMessage = err?.message || err?.data?.message || "Failed to create ticket";
      toast.error(errorMessage);
    },
  });

  const submitInProgressRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);
  const isPending = userMutation.isPending || adminMutation.isPending;

  // Watch title field for KB suggestions (user mode only)
  const titleValue = watch("title");
  useEffect(() => {
    if (mode !== "user") return;
    if (kbDebounceRef.current) clearTimeout(kbDebounceRef.current);
    if (!titleValue || titleValue.length < 5) {
      setShowKbSuggestions(false);
      setKbQuery("");
      return;
    }
    kbDebounceRef.current = setTimeout(() => {
      setKbQuery(titleValue);
      setShowKbSuggestions(true);
    }, 600);
    return () => {
      if (kbDebounceRef.current) clearTimeout(kbDebounceRef.current);
    };
  }, [titleValue, mode]);

  const onSubmit = async (data: any) => {
    console.log("[CreateTicketModal] onSubmit called", { mode, data });
    if (submitInProgressRef.current) {
      console.log("[CreateTicketModal] Submission already in progress, ignoring");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTimeRef.current < 1000) {
      console.log("[CreateTicketModal] Throttled - last submit was", now - lastSubmitTimeRef.current, "ms ago");
      return;
    }

    submitInProgressRef.current = true;
    lastSubmitTimeRef.current = now;

    try {
      // Use correct mutation based on mode
      const mutation = mode === "user" ? userMutation : adminMutation;
      console.log("[CreateTicketModal] Using mutation:", mode === "user" ? "userMutation" : "adminMutation");
      console.log("[CreateTicketModal] Mutation object exists:", !!mutation);
      
      const result = await mutation.mutateAsync({
        title: data.title,
        description: data.description,
        stepsAttempted: data.stepsAttempted,
        category: data.category,
        priority: data.priority,
        channel: "web",
        requesterName: data.requesterName || "",
        requesterEmail: data.requesterEmail || "",
      });
      console.log("[CreateTicketModal] Mutation succeeded with result:", result);
    } catch (e) {
      // Error is already handled by mutation.onError
      console.error("[CreateTicketModal] Submission error:", e);
      submitInProgressRef.current = false;
    }
  };

  const handlePrioritySelect = (value: string) => {
    setSelectedPriority(value);
    setValue("priority", value);
  };

  // Handle dialog open/close properly - only close on close, not open
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Ticket (On Behalf Of)</DialogTitle>
          <DialogDescription>Open a ticket on behalf of a customer or for internal tracking</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer / Requester Info */}
          <div className="border border-slate-700 rounded-lg p-4 space-y-3">
            <Label className="text-cyan-400 text-sm font-semibold">Customer / Requester Info</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="requesterName" className="text-slate-300 text-xs">Customer Name (optional)</Label>
                <Input
                  id="requesterName"
                  placeholder="Customer's full name"
                  {...register("requesterName")}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
              <div>
                <Label htmlFor="requesterEmail" className="text-slate-300 text-xs">Customer Email (optional)</Label>
                <Input
                  id="requesterEmail"
                  type="email"
                  placeholder="customer@example.com"
                  {...register("requesterEmail")}
                  className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>

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
          </div>

          {/* KB Suggestions Panel - user mode only */}
          {mode === "user" && showKbSuggestions && kbSuggestions && kbSuggestions.length > 0 && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium">
                  <BookOpen className="w-4 h-4" />
                  <span>Found {kbSuggestions.length} related KB article{kbSuggestions.length > 1 ? "s" : ""} — check if this solves your issue first:</span>
                </div>
                <button type="button" onClick={() => setShowKbSuggestions(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {kbSuggestions.slice(0, 4).map((article: any) => (
                  <a
                    key={article.id}
                    href={`/kb/${article.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 rounded bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-cyan-500/30 transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0 group-hover:text-cyan-300" />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate group-hover:text-cyan-300">{article.title}</p>
                      {article.summary && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.summary}</p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">If none of these help, continue filling out the form below.</p>
            </div>
          )}

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
            <Select defaultValue="general_support" onValueChange={(value) => setValue("category", value)}>
              <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="general_support">💬 General Support</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="printer">🖨️ Printer</SelectItem>
                <SelectItem value="internet">🌐 Internet</SelectItem>
                <SelectItem value="network">🔗 Network</SelectItem>
                <SelectItem value="bug_report">🐛 Bug Report</SelectItem>
                <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                <SelectItem value="billing">💳 Billing</SelectItem>
                <SelectItem value="other">❓ Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div>
            <Label className="text-slate-300">Priority Level</Label>
            <div className="flex gap-2 mt-2">
              {[
                { value: "low", label: "Low", color: "bg-green-600", ring: "ring-green-400" },
                { value: "medium", label: "Medium", color: "bg-yellow-600", ring: "ring-yellow-400" },
                { value: "high", label: "High", color: "bg-orange-600", ring: "ring-orange-400" },
                { value: "critical", label: "Critical", color: "bg-red-600", ring: "ring-red-400" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePrioritySelect(p.value)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-all ${p.color} hover:opacity-90 ${
                    selectedPriority === p.value
                      ? `ring-2 ${p.ring} ring-offset-2 ring-offset-slate-900 scale-105 opacity-100`
                      : "opacity-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-800 border border-slate-700 rounded p-3 text-sm text-slate-300">
            <p className="font-semibold text-cyan-400">What happens next?</p>
            <p>The ticket will be created immediately, classified by AI, and routed to the appropriate team. Teams will be notified.</p>
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

// Default export for backward compatibility
export default CreateTicketModal;
