import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

export default function AdminFormSubmissionsPage() {
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch submissions
  const { data: submissionsData, isLoading, refetch } = trpc.formSubmissions.getSubmissions.useQuery({
    limit,
    offset,
    status: statusFilter as any,
    category: categoryFilter,
    search: searchTerm,
  });

  // Fetch stats
  const { data: stats } = trpc.formSubmissions.getStats.useQuery();

  // Mutations
  const markAsContactedMutation = trpc.formSubmissions.markAsContacted.useMutation({
    onSuccess: () => {
      toast.success("Marked as contacted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update");
    },
  });

  const markAsConvertedMutation = trpc.formSubmissions.markAsConverted.useMutation({
    onSuccess: () => {
      toast.success("Marked as converted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update");
    },
  });

  const deleteSubmissionMutation = trpc.formSubmissions.deleteSubmission.useMutation({
    onSuccess: () => {
      toast.success("Submission deleted");
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete");
    },
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (!submissionsData?.submissions) return;

    const headers = ["Email", "Name", "Company", "Category", "Message", "Status", "Date"];
    const rows = submissionsData.submissions.map((sub) => [
      sub.email,
      sub.name,
      sub.company || "",
      sub.category,
      sub.message.replace(/"/g, '""'),
      sub.status,
      new Date(sub.submittedAt).toLocaleString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `form-submissions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-500/20 text-yellow-700";
      case "contacted":
        return "bg-blue-500/20 text-blue-700";
      case "converted":
        return "bg-green-500/20 text-green-700";
      case "spam":
        return "bg-red-500/20 text-red-700";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const totalPages = Math.ceil((submissionsData?.total || 0) / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Form Submissions</h1>
          <p className="text-gray-500 mt-1">Manage captured emails and form submissions</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" disabled={!submissionsData?.submissions?.length}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Total Submissions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-yellow-700">New</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.newCount}</p>
          </div>
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-700">Contacted</p>
            <p className="text-2xl font-bold text-blue-700">{stats.contactedCount}</p>
          </div>
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-700">Converted</p>
            <p className="text-2xl font-bold text-green-700">{stats.convertedCount}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setOffset(0);
          }}
          className="flex-1"
        />
        <Select value={statusFilter || ""} onValueChange={(v) => {
          setStatusFilter(v || undefined);
          setOffset(0);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter || ""} onValueChange={(v) => {
          setCategoryFilter(v || undefined);
          setOffset(0);
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="helpdesk-pricing">Helpdesk Pricing</SelectItem>
            <SelectItem value="free-audit">Free Audit</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="compliance-scorecard">Compliance Scorecard</SelectItem>
            <SelectItem value="specialist-contact">Specialist Contact</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : submissionsData?.submissions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              submissionsData?.submissions?.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-sm">{submission.email}</TableCell>
                  <TableCell>{submission.name}</TableCell>
                  <TableCell>{submission.company || "-"}</TableCell>
                  <TableCell className="text-sm">{submission.category}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{submission.message}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {submission.status === "new" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsContactedMutation.mutate({ id: submission.id })}
                          disabled={markAsContactedMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {submission.status !== "converted" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsConvertedMutation.mutate({ id: submission.id })}
                          disabled={markAsConvertedMutation.isPending}
                        >
                          ✓
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSubmissionMutation.mutate({ id: submission.id })}
                        disabled={deleteSubmissionMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Page {currentPage} of {totalPages} ({submissionsData?.total || 0} total)
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
