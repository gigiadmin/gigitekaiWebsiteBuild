import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Phone, Mail, Building2, FileText } from "lucide-react";

export default function AdminFormSubmissions() {
  const [filters, setFilters] = useState({
    status: "new" as const,
    search: "",
    limit: 50,
    offset: 0,
  });
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Fetch submissions
  const { data: submissions, isLoading, refetch } = trpc.formSubmissions.getAll.useQuery();
  const updateStatusMutation = trpc.formSubmissions.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });
  const bulkDeleteMutation = trpc.formSubmissions.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedRows(new Set());
      refetch();
    },
  });

  const toggleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (!submissions) return;
    if (selectedRows.size === submissions.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(submissions.map((s: any) => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;
    if (confirm(`Delete ${selectedRows.size} submission(s)? This cannot be undone.`)) {
      bulkDeleteMutation.mutate({ ids: Array.from(selectedRows) });
    }
  };

  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    converted: "bg-green-100 text-green-800",
    spam: "bg-red-100 text-red-800",
  };

  const statusIcons = {
    new: <AlertCircle className="w-4 h-4" />,
    contacted: <Phone className="w-4 h-4" />,
    converted: <CheckCircle className="w-4 h-4" />,
    spam: <AlertCircle className="w-4 h-4" />,
  };



  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Form Submissions</h1>
          <p className="text-gray-400">Track and manage all Web Discovery intake forms</p>
        </div>

        {/* Filters */}
        <div className="bg-[#0F1629] border border-cyan-500/20 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value as any, offset: 0 })
                }
                className="w-full px-3 py-2 bg-[#0A0E1A] border border-cyan-500/30 rounded-md text-white"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="spam">Spam</option>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-2">Search</label>
              <Input
                placeholder="Search by name, email, or company..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, offset: 0 })
                }
                className="bg-[#0A0E1A] border-cyan-500/30"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="mb-6 bg-[#0F1629] border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
            <div className="text-white">
              <p className="font-semibold">{selectedRows.size} submission(s) selected</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setSelectedRows(new Set())}
                variant="outline"
              >
                Clear Selection
              </Button>
              <Button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete Selected"}
              </Button>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="bg-[#0F1629] border border-cyan-500/20 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">Loading submissions...</p>
            </div>
          ) : submissions && Array.isArray(submissions) && submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0A0E1A] border-b border-cyan-500/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={submissions && selectedRows.size === submissions.length && submissions.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Company</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Submitted</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission: any) => (
                    <tr
                      key={submission.id}
                      className="border-b border-cyan-500/10 hover:bg-[#0A0E1A]/50 transition-colors"
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(submission.id)}
                          onChange={() => toggleSelectRow(submission.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedSubmission(submission)}>
                        <div className="font-medium">{submission.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`mailto:${submission.email}`}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          {submission.email}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          {submission.company || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{submission.category}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {statusIcons[submission.status as keyof typeof statusIcons]}
                          <Badge className={statusColors[submission.status as keyof typeof statusColors]}>
                            {submission.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <a
                            href={`tel:${submission.phone}`}
                            className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Call"
                          >
                            <Phone className="w-4 h-4 text-cyan-400" />
                          </a>
                          <a
                            href={`mailto:${submission.email}`}
                            className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Email"
                          >
                            <Mail className="w-4 h-4 text-cyan-400" />
                          </a>
                          <button
                            onClick={() => {
                              const newStatus = submission.status === "new" ? "contacted" : submission.status === "contacted" ? "converted" : "new";
                              updateStatusMutation.mutate({
                                id: submission.id,
                                status: newStatus as any,
                              });
                            }}
                            className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Update status"
                          >
                            <FileText className="w-4 h-4 text-cyan-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-400">No submissions found</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {submissions && Array.isArray(submissions) && submissions.length > 0 && (
          <div className="mt-6 bg-[#0F1629] border border-cyan-500/20 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0A0E1A] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-2xl font-bold text-cyan-400">{submissions.length}</p>
              </div>
              <div className="bg-[#0A0E1A] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">New</p>
                <p className="text-2xl font-bold text-blue-400">
                  {submissions.filter((s: any) => s.status === "new").length}
                </p>
              </div>
              <div className="bg-[#0A0E1A] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Contacted</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {submissions.filter((s: any) => s.status === "contacted").length}
                </p>
              </div>
              <div className="bg-[#0A0E1A] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Converted</p>
                <p className="text-2xl font-bold text-green-400">
                  {submissions.filter((s: any) => s.status === "converted").length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#0F1629] border border-cyan-500/20 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#0A0E1A] border-b border-cyan-500/20 p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">Form Submission Details</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Name</label>
                      <p className="text-white font-medium">{selectedSubmission.name}</p>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Email</label>
                      <a href={`mailto:${selectedSubmission.email}`} className="text-cyan-400 hover:text-cyan-300">
                        {selectedSubmission.email}
                      </a>
                    </div>
                    {selectedSubmission.phone && (
                      <div>
                        <label className="text-gray-400 text-sm">Phone</label>
                        <a href={`tel:${selectedSubmission.phone}`} className="text-cyan-400 hover:text-cyan-300">
                          {selectedSubmission.phone}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.company && (
                      <div>
                        <label className="text-gray-400 text-sm">Company</label>
                        <p className="text-white font-medium">{selectedSubmission.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submission Details */}
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">Submission Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Category</label>
                      <Badge variant="outline">{selectedSubmission.category}</Badge>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        {statusIcons[selectedSubmission.status as keyof typeof statusIcons]}
                        <Badge className={statusColors[selectedSubmission.status as keyof typeof statusColors]}>
                          {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Submitted</label>
                      <p className="text-white">{new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                    </div>
                    {selectedSubmission.contactedAt && (
                      <div>
                        <label className="text-gray-400 text-sm">Contacted</label>
                        <p className="text-white">{new Date(selectedSubmission.contactedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-lg font-semibold text-cyan-400 mb-4">Message</h3>
                  <div className="bg-[#0A0E1A] border border-cyan-500/20 rounded p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.message}</p>
                  </div>
                </div>

                {/* Notes */}
                {selectedSubmission.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-4">Notes</h3>
                    <div className="bg-[#0A0E1A] border border-cyan-500/20 rounded p-4">
                      <p className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-cyan-500/20">
                  {selectedSubmission.status !== "contacted" && (
                    <Button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedSubmission.id, status: "contacted" });
                        setSelectedSubmission(null);
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Mark as Contacted
                    </Button>
                  )}
                  {selectedSubmission.status !== "converted" && (
                    <Button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedSubmission.id, status: "converted" });
                        setSelectedSubmission(null);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Converted
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedSubmission(null)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
