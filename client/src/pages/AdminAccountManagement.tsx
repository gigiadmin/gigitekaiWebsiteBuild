/**
 * Team Members — Admin Portal
 * Shows all users who have authenticated via Manus OAuth.
 * Admins can promote/demote roles and activate/deactivate accounts.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// AdminLayout is provided by AdminAccountsPage wrapper — do NOT wrap again here
import {
  Users,
  Shield,
  ShieldCheck,
  Wrench,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";

type Role = "user" | "admin" | "technician";

const ROLE_CONFIG: Record<Role, { label: string; color: string; icon: React.ReactNode }> = {
  admin: {
    label: "Admin",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  technician: {
    label: "Technician",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: <Wrench className="w-3 h-3" />,
  },
  user: {
    label: "User",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    icon: <Shield className="w-3 h-3" />,
  },
};

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.user;
  return (
    <Badge
      variant="outline"
      className={`flex items-center gap-1 text-xs font-medium border ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAccountManagement() {
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "approve" | "revoke";
    userId: number;
    label: string;
    newRole?: Role;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: users = [], isLoading, refetch } = trpc.users.getAll.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      utils.users.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update role"),
  });

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      toast.success("User activated successfully");
      utils.users.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to activate user"),
  });

  const revokeMutation = trpc.users.revoke.useMutation({
    onSuccess: () => {
      toast.success("User deactivated successfully");
      utils.users.getAll.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to deactivate user"),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.role ?? "").toLowerCase().includes(q)
    );
  });

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === "role" && confirmAction.newRole) {
      updateRoleMutation.mutate({ userId: confirmAction.userId, role: confirmAction.newRole });
    } else if (confirmAction.type === "approve") {
      approveMutation.mutate({ userId: confirmAction.userId });
    } else if (confirmAction.type === "revoke") {
      revokeMutation.mutate({ userId: confirmAction.userId });
    }
    setConfirmAction(null);
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    technicians: users.filter((u) => u.role === "technician").length,
    active: users.filter((u) => u.approved).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Members</h1>
          <p className="text-sm text-gray-400 mt-1">
            All users authenticated via Manus OAuth. Manage roles and access.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-slate-700 text-gray-300 hover:text-white hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: stats.total, icon: <Users className="w-5 h-5 text-cyan-400" /> },
          { label: "Admins", value: stats.admins, icon: <ShieldCheck className="w-5 h-5 text-cyan-400" /> },
          { label: "Technicians", value: stats.technicians, icon: <Wrench className="w-5 h-5 text-purple-400" /> },
          { label: "Active", value: stats.active, icon: <UserCheck className="w-5 h-5 text-green-400" /> },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0D1526] border border-slate-700/50 rounded-lg p-4 flex items-center gap-3"
          >
            <div className="p-2 bg-slate-800 rounded-lg">{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search by name, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#0D1526] border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0D1526] border border-slate-700/50 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">
              {search
                ? "No members match your search."
                : "No team members yet. Users appear here after they log in via OAuth."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-gray-400 font-medium">Member</TableHead>
                <TableHead className="text-gray-400 font-medium">Role</TableHead>
                <TableHead className="text-gray-400 font-medium">Status</TableHead>
                <TableHead className="text-gray-400 font-medium">Login Method</TableHead>
                <TableHead className="text-gray-400 font-medium">Last Sign In</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id} className="border-slate-700/50 hover:bg-slate-800/30">
                  {/* Member info */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">
                          {user.name ?? <span className="text-gray-500 italic">No name</span>}
                        </p>
                        <p className="text-gray-400 text-xs">{user.email ?? "—"}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role selector */}
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(val) =>
                        setConfirmAction({
                          type: "role",
                          userId: user.id,
                          newRole: val as Role,
                          label: `Change ${user.name ?? user.email ?? "this user"}'s role to ${val}?`,
                        })
                      }
                    >
                      <SelectTrigger className="w-36 bg-slate-800 border-slate-600 text-white h-8 text-xs">
                        <SelectValue>
                          <RoleBadge role={user.role as Role} />
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="admin" className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-cyan-400" /> Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="technician" className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <Wrench className="w-3 h-3 text-purple-400" /> Technician
                          </div>
                        </SelectItem>
                        <SelectItem value="user" className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-slate-400" /> User
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.approved
                          ? "bg-green-500/10 text-green-400 border-green-500/30 text-xs"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs"
                      }
                    >
                      {user.approved ? "Active" : "Pending"}
                    </Badge>
                  </TableCell>

                  {/* Login method */}
                  <TableCell>
                    <span className="text-gray-400 text-xs capitalize">
                      {user.loginMethod ?? "OAuth"}
                    </span>
                  </TableCell>

                  {/* Last sign in */}
                  <TableCell>
                    <span className="text-gray-400 text-xs">
                      {formatDate(user.lastSignedIn)}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {user.approved ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({
                            type: "revoke",
                            userId: user.id,
                            label: `Deactivate ${user.name ?? user.email ?? "this user"}?`,
                          })
                        }
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                      >
                        <UserX className="w-3 h-3 mr-1" /> Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({
                            type: "approve",
                            userId: user.id,
                            label: `Activate ${user.name ?? user.email ?? "this user"}?`,
                          })
                        }
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs h-7"
                      >
                        <UserCheck className="w-3 h-3 mr-1" /> Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent className="bg-[#0D1526] border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {confirmAction?.label}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
