/**
 * Team Members — Admin Portal
 * Shows all users who have authenticated via Manus OAuth.
 * Admins can promote/demote roles, activate/deactivate, soft-delete, and restore accounts.
 * Deleted accounts are held in a 30-day Recycle Bin before permanent purge.
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
import {
  Users,
  Shield,
  ShieldCheck,
  Wrench,
  Search,
  UserCheck,
  UserX,
  RefreshCw,
  Trash2,
  RotateCcw,
  Trash,
  Clock,
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

function daysRemaining(deletedAt: Date | string | null | undefined): number {
  if (!deletedAt) return 30;
  const deleted = new Date(deletedAt).getTime();
  const expiry = deleted + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((expiry - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function AdminAccountManagement() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "recycle">("active");
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "approve" | "revoke" | "delete" | "restore" | "purge-all";
    userId?: number;
    label: string;
    newRole?: Role;
    destructive?: boolean;
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: users = [], isLoading, refetch } = trpc.users.getAll.useQuery();
  const { data: deletedUsers = [], isLoading: isLoadingDeleted, refetch: refetchDeleted } =
    trpc.users.listDeleted.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated successfully"); utils.users.getAll.invalidate(); },
    onError: (err) => toast.error(err.message || "Failed to update role"),
  });

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => { toast.success("User activated successfully"); utils.users.getAll.invalidate(); },
    onError: (err) => toast.error(err.message || "Failed to activate user"),
  });

  const revokeMutation = trpc.users.revoke.useMutation({
    onSuccess: () => { toast.success("User deactivated successfully"); utils.users.getAll.invalidate(); },
    onError: (err) => toast.error(err.message || "Failed to deactivate user"),
  });

  const softDeleteMutation = trpc.users.softDelete.useMutation({
    onSuccess: () => {
      toast.success("Account moved to Recycle Bin. Recoverable for 30 days.");
      utils.users.getAll.invalidate();
      utils.users.listDeleted.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to delete account"),
  });

  const restoreMutation = trpc.users.restore.useMutation({
    onSuccess: () => {
      toast.success("Account restored successfully.");
      utils.users.getAll.invalidate();
      utils.users.listDeleted.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to restore account"),
  });

  const purgeExpiredMutation = trpc.users.purgeExpired.useMutation({
    onSuccess: (data) => {
      toast.success(`Purged ${data.purged} expired account(s).`);
      utils.users.listDeleted.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to purge expired accounts"),
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.role ?? "").toLowerCase().includes(q)
    );
  });

  const filteredDeleted = deletedUsers.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q)
    );
  });

  function handleConfirm() {
    if (!confirmAction) return;
    const { type, userId, newRole } = confirmAction;
    if (type === "role" && userId && newRole) {
      updateRoleMutation.mutate({ userId, role: newRole });
    } else if (type === "approve" && userId) {
      approveMutation.mutate({ userId });
    } else if (type === "revoke" && userId) {
      revokeMutation.mutate({ userId });
    } else if (type === "delete" && userId) {
      softDeleteMutation.mutate({ userId });
    } else if (type === "restore" && userId) {
      restoreMutation.mutate({ userId });
    } else if (type === "purge-all") {
      purgeExpiredMutation.mutate();
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
          onClick={() => { refetch(); refetchDeleted(); }}
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
          <div key={s.label} className="bg-[#0D1526] border border-slate-700/50 rounded-lg p-4 flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "active"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Active Members
          <span className="ml-2 bg-slate-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
            {users.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("recycle")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "recycle"
              ? "border-red-400 text-red-400"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Trash2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Recycle Bin
          {deletedUsers.length > 0 && (
            <span className="ml-2 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">
              {deletedUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder={activeTab === "active" ? "Search by name, email, or role..." : "Search deleted accounts..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#0D1526] border-slate-700 text-white placeholder:text-gray-500 focus:border-cyan-500"
        />
      </div>

      {/* ── ACTIVE MEMBERS TAB ── */}
      {activeTab === "active" && (
        <div className="bg-[#0D1526] border border-slate-700/50 rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">{search ? "No members match your search." : "No team members yet."}</p>
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
                          <SelectValue><RoleBadge role={user.role as Role} /></SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="admin" className="text-white hover:bg-slate-700">
                            <div className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-cyan-400" /> Admin</div>
                          </SelectItem>
                          <SelectItem value="technician" className="text-white hover:bg-slate-700">
                            <div className="flex items-center gap-2"><Wrench className="w-3 h-3 text-purple-400" /> Technician</div>
                          </SelectItem>
                          <SelectItem value="user" className="text-white hover:bg-slate-700">
                            <div className="flex items-center gap-2"><Shield className="w-3 h-3 text-slate-400" /> User</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.approved
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                        }
                      >
                        {user.approved ? "Active" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-400 text-xs capitalize">{user.loginMethod ?? "OAuth"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-400 text-xs">{formatDate(user.lastSignedIn)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.approved ? (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setConfirmAction({ type: "revoke", userId: user.id, label: `Deactivate ${user.name ?? user.email ?? "this user"}?` })}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                          >
                            <UserX className="w-3 h-3 mr-1" /> Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setConfirmAction({ type: "approve", userId: user.id, label: `Activate ${user.name ?? user.email ?? "this user"}?` })}
                            className="text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs h-7"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => setConfirmAction({
                            type: "delete",
                            userId: user.id,
                            label: `Move ${user.name ?? user.email ?? "this user"} to the Recycle Bin? They can be restored within 30 days.`,
                            destructive: true,
                          })}
                          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-xs h-7 ml-1"
                          title="Move to Recycle Bin"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* ── RECYCLE BIN TAB ── */}
      {activeTab === "recycle" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-orange-300 text-sm font-medium">30-Day Recovery Window</p>
              <p className="text-orange-400/70 text-xs mt-0.5">
                Deleted accounts are held here for 30 days. After that, they are permanently removed and cannot be recovered.
              </p>
            </div>
            {deletedUsers.length > 0 && (
              <Button
                variant="ghost" size="sm"
                onClick={() => setConfirmAction({
                  type: "purge-all",
                  label: "Permanently delete all expired accounts (older than 30 days)? This cannot be undone.",
                  destructive: true,
                })}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 flex-shrink-0"
              >
                <Trash className="w-3 h-3 mr-1" /> Purge Expired
              </Button>
            )}
          </div>

          <div className="bg-[#0D1526] border border-slate-700/50 rounded-lg overflow-hidden">
            {isLoadingDeleted ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : filteredDeleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <Trash2 className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm font-medium text-gray-400">Recycle Bin is empty</p>
                <p className="text-xs mt-1">Deleted accounts appear here for 30 days before permanent removal.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-medium">Member</TableHead>
                    <TableHead className="text-gray-400 font-medium">Role</TableHead>
                    <TableHead className="text-gray-400 font-medium">Deleted On</TableHead>
                    <TableHead className="text-gray-400 font-medium">Expires In</TableHead>
                    <TableHead className="text-gray-400 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeleted.map((user) => {
                    const days = daysRemaining(user.deletedAt);
                    return (
                      <TableRow key={user.id} className="border-slate-700/50 hover:bg-slate-800/30 opacity-80">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-gray-300 font-medium text-sm line-through decoration-red-500/50">
                                {user.name ?? <span className="text-gray-500 italic">No name</span>}
                              </p>
                              <p className="text-gray-500 text-xs">{user.email ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><RoleBadge role={user.role as Role} /></TableCell>
                        <TableCell>
                          <span className="text-gray-400 text-xs">{formatDate(user.deletedAt)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              days <= 3
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : days <= 7
                                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            }
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {days === 0 ? "Expires today" : `${days}d left`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="sm"
                            onClick={() => setConfirmAction({
                              type: "restore",
                              userId: user.id,
                              label: `Restore ${user.name ?? user.email ?? "this user"}'s account?`,
                            })}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-xs h-7"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-[#0D1526] border-slate-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className={confirmAction?.destructive ? "text-red-400" : "text-white"}>
              {confirmAction?.type === "delete" ? "Move to Recycle Bin"
                : confirmAction?.type === "restore" ? "Restore Account"
                : confirmAction?.type === "purge-all" ? "Purge Expired Accounts"
                : "Confirm Action"}
            </AlertDialogTitle>
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
              className={
                confirmAction?.destructive
                  ? "bg-red-600 hover:bg-red-700 text-white font-semibold"
                  : "bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
              }
            >
              {confirmAction?.type === "delete" ? "Move to Recycle Bin"
                : confirmAction?.type === "restore" ? "Restore"
                : confirmAction?.type === "purge-all" ? "Purge Expired"
                : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
