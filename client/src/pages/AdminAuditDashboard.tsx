/**
 * Admin Audit Dashboard
 * View and manage free audit submissions from the landing page
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Mail,
  Phone,
  Building2,
  User,
  FileText,
} from "lucide-react";

type AuditStatus = "submitted" | "contacted" | "in_progress" | "completed" | "archived";

interface AuditSubmission {
  id: number;
  companyName: string;
  industry: string;
  description: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  auditType: string | null;
  currentChallenges: string | null;
  goals: string | null;
  status: AuditStatus;
  notes: string | null;
  assignedTo: number | null;
  submittedAt: Date;
  contactedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

export default function AdminAuditDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuditStatus | "all">("all");
  const [selectedAudit, setSelectedAudit] = useState<AuditSubmission | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<AuditStatus>("submitted");

  const utils = trpc.useUtils();

  // Fetch all audit submissions
  const { data: audits, isLoading } = trpc.audit.list.useQuery();

  // Update audit status and notes
  const updateMutation = trpc.audit.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Audit submission updated");
      utils.audit.list.invalidate();
      setIsEditOpen(false);
      setSelectedAudit(null);
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  // Update only status
  const updateStatusMutation = trpc.audit.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.audit.list.invalidate();
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`),
  });

  // Filter and search
  const filteredAudits = (audits || []).filter((audit) => {
    const matchesSearch =
      audit.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || audit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (audit: AuditSubmission) => {
    setSelectedAudit(audit);
    setEditNotes(audit.notes || "");
    setEditStatus(audit.status);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedAudit) return;

    updateMutation.mutate({
      id: selectedAudit.id,
      notes: editNotes || undefined,
      status: editStatus,
    } as any);
  };

  const statusColors: Record<AuditStatus, string> = {
    submitted: "bg-blue-500/20 text-blue-400",
    contacted: "bg-yellow-500/20 text-yellow-400",
    in_progress: "bg-purple-500/20 text-purple-400",
    completed: "bg-green-500/20 text-green-400",
    archived: "bg-gray-500/20 text-gray-400",
  };

  const statusIcons: Record<AuditStatus, React.ReactNode> = {
    submitted: <AlertCircle className="w-4 h-4" />,
    contacted: <Mail className="w-4 h-4" />,
    in_progress: <Clock className="w-4 h-4" />,
    completed: <CheckCircle2 className="w-4 h-4" />,
    archived: <Trash2 className="w-4 h-4" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Free Audit Submissions</h1>
          <p className="text-gray-400 mt-1">Manage leads from the free audit landing page</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#00D4FF]">{audits?.length || 0}</div>
          <div className="text-sm text-gray-400">Total Submissions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by company, contact name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>

        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as AuditStatus | "all")}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading submissions...</div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No submissions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Company</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Industry</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-gray-300 font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-right text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredAudits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-medium">{audit.companyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-white">
                          <User className="w-4 h-4 text-gray-500" />
                          {audit.contactName}
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                          <Mail className="w-3 h-3" />
                          {audit.contactEmail}
                        </div>
                        {audit.contactPhone && (
                          <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                            <Phone className="w-3 h-3" />
                            {audit.contactPhone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{audit.industry}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColors[audit.status]} flex items-center gap-1 w-fit`}>
                        {statusIcons[audit.status]}
                        {audit.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(audit.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(audit)}
                          className="gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-[#0D1117] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#00D4FF]">Edit Audit Submission</DialogTitle>
          </DialogHeader>

          {selectedAudit && (
            <div className="space-y-4">
              {/* Company Info */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Company Name</span>
                    <div className="text-white font-medium">{selectedAudit.companyName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Industry</span>
                    <div className="text-white font-medium">{selectedAudit.industry}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">Description</span>
                    <div className="text-white text-sm mt-1">{selectedAudit.description || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name</span>
                    <div className="text-white font-medium">{selectedAudit.contactName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Email</span>
                    <div className="text-white font-medium">{selectedAudit.contactEmail}</div>
                  </div>
                  {selectedAudit.contactPhone && (
                    <div>
                      <span className="text-gray-400">Phone</span>
                      <div className="text-white font-medium">{selectedAudit.contactPhone}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Audit Details */}
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold text-white mb-3">Audit Details</h3>
                <div className="space-y-3 text-sm">
                  {selectedAudit.auditType && (
                    <div>
                      <span className="text-gray-400">Audit Type</span>
                      <div className="text-white font-medium">{selectedAudit.auditType}</div>
                    </div>
                  )}
                  {selectedAudit.currentChallenges && (
                    <div>
                      <span className="text-gray-400">Current Challenges</span>
                      <div className="text-white text-sm mt-1">{selectedAudit.currentChallenges}</div>
                    </div>
                  )}
                  {selectedAudit.goals && (
                    <div>
                      <span className="text-gray-400">Goals</span>
                      <div className="text-white text-sm mt-1">{selectedAudit.goals}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm font-medium">Status</label>
                  <Select value={editStatus} onValueChange={(val) => setEditStatus(val as AuditStatus)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-gray-300 text-sm font-medium">Admin Notes</label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this submission..."
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="bg-[#00D4FF] text-black hover:bg-[#00B8D4]"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
