import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CreateTicket() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    category: "general_support" as const,
  });

  const createTicketMutation = trpc.helpdesk.createTicket.useMutation({
    onSuccess: () => {
      toast.success("Ticket created successfully!");
      navigate("/helpdesk/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/helpdesk");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4FF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#141B2D]">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00D4FF] rounded-lg flex items-center justify-center">
              <span className="text-[#0A0E1A] font-bold text-sm">?</span>
            </div>
            <span className="text-white font-bold">Help Desk</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/helpdesk/dashboard")}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </nav>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Ticket</h1>
        <p className="text-gray-400 mb-8">Describe your issue and we'll help you resolve it</p>

        <form onSubmit={handleSubmit} className="bg-[#141B2D] border border-gray-800 rounded-lg p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief summary of your issue"
              required
              minLength={5}
              className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-[#00D4FF] focus:outline-none transition"
            />
            <p className="text-gray-500 text-xs mt-1">Minimum 5 characters</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about your issue"
              required
              minLength={10}
              rows={6}
              className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-[#00D4FF] focus:outline-none transition resize-none"
            />
            <p className="text-gray-500 text-xs mt-1">Minimum 10 characters</p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-white font-semibold mb-2">Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-[#00D4FF] focus:outline-none transition"
            >
              <option value="general_support">General Support</option>
              <option value="bug_report">Bug Report</option>
              <option value="feature_request">Feature Request</option>
              <option value="billing">Billing</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-white font-semibold mb-2">Priority *</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full bg-[#0A0E1A] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-[#00D4FF] focus:outline-none transition"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="flex-1 bg-[#00D4FF] hover:bg-[#00B8CC] text-[#0A0E1A] font-semibold"
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/helpdesk/dashboard")}
              variant="outline"
              className="flex-1 border-gray-700 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
