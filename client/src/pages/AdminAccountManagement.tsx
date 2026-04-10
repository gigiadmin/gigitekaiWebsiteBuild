/**
 * AdminAccountManagement
 * Provides: Change Password, Create Agent Account, Manage All Accounts
 * Role-based: Only admins can create/manage accounts; all roles can change own password
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { KeyRound, UserPlus, Users, Shield, Eye, Loader2, Trash2, Edit2, CheckCircle, XCircle } from "lucide-react";

interface AdminAccountManagementProps {
  currentRole: string;
}

export default function AdminAccountManagement({ currentRole }: AdminAccountManagementProps) {
  const isAdmin = currentRole === "admin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Account Management</h2>
        <p className="text-gray-400 mt-1">
          {isAdmin
            ? "Manage team accounts, roles, and security settings"
            : "Update your account security settings"}
        </p>
      </div>

      <Tabs defaultValue="change-password" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="change-password" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <KeyRound className="w-4 h-4 mr-2" />
            Change Password
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="create-account" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Create Account
              </TabsTrigger>
              <TabsTrigger value="manage-accounts" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Users className="w-4 h-4 mr-2" />
                Manage Accounts
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Change Password Tab */}
        <TabsContent value="change-password" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>

        {/* Create Account Tab (admin only) */}
        {isAdmin && (
          <TabsContent value="create-account" className="mt-6">
            <CreateAccountForm />
          </TabsContent>
        )}

        {/* Manage Accounts Tab (admin only) */}
        {isAdmin && (
          <TabsContent value="manage-accounts" className="mt-6">
            <ManageAccountsTable />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ── Change Password Form ──────────────────────────────────────────────────────

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = trpc.adminAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to change password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Card className="bg-slate-900 border-slate-700 max-w-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400" />
          Change Your Password
        </CardTitle>
        <CardDescription className="text-gray-400">
          Update your admin portal password. Must be at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Current Password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <Button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {changePasswordMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Create Account Form ───────────────────────────────────────────────────────

function CreateAccountForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");
  const utils = trpc.useUtils();

  const createAccountMutation = trpc.adminAuth.createAccount.useMutation({
    onSuccess: (data) => {
      toast.success(`Account created for ${data.account.email}`);
      setEmail("");
      setName("");
      setPassword("");
      setRole("agent");
      utils.adminAuth.listAccounts.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create account");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate({ email, name, password, role });
  };

  return (
    <Card className="bg-slate-900 border-slate-700 max-w-md">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-cyan-400" />
          Create Team Account
        </CardTitle>
        <CardDescription className="text-gray-400">
          Add a new admin, agent, or viewer to the portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Full Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Smith"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@gigitek.com"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Temporary Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              className="bg-slate-800 border-slate-600 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "admin" | "agent" | "viewer")}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span>Admin — Full access</span>
                  </div>
                </SelectItem>
                <SelectItem value="agent">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400" />
                    <span>Agent — Chat & Tickets</span>
                  </div>
                </SelectItem>
                <SelectItem value="viewer">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span>Viewer — Read-only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            disabled={createAccountMutation.isPending}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {createAccountMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Manage Accounts Table ─────────────────────────────────────────────────────

function ManageAccountsTable() {
  const { data: accounts, isLoading, refetch } = trpc.adminAuth.listAccounts.useQuery();
  const utils = trpc.useUtils();

  const updateAccountMutation = trpc.adminAuth.updateAccount.useMutation({
    onSuccess: () => {
      toast.success("Account updated");
      utils.adminAuth.listAccounts.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to update account"),
  });

  const deleteAccountMutation = trpc.adminAuth.deleteAccount.useMutation({
    onSuccess: () => {
      toast.success("Account removed");
      utils.adminAuth.listAccounts.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to remove account"),
  });

  const toggleActive = (id: number, currentActive: boolean) => {
    updateAccountMutation.mutate({ id, isActive: !currentActive });
  };

  const changeRole = (id: number, newRole: "admin" | "agent" | "viewer") => {
    updateAccountMutation.mutate({ id, role: newRole });
  };

  const roleColor = (role: string) => {
    if (role === "admin") return "bg-red-900/30 text-red-400 border-red-800";
    if (role === "agent") return "bg-cyan-900/30 text-cyan-400 border-cyan-800";
    return "bg-gray-800 text-gray-400 border-gray-700";
  };

  const roleIcon = (role: string) => {
    if (role === "admin") return <Shield className="w-3 h-3" />;
    if (role === "agent") return <Users className="w-3 h-3" />;
    return <Eye className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-cyan-400" />
          Team Accounts ({accounts?.length ?? 0})
        </CardTitle>
        <CardDescription className="text-gray-400">
          Manage roles, activate/deactivate, or remove team members.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Last Login</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map((account) => (
                <TableRow key={account.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-white font-medium">{account.name}</TableCell>
                  <TableCell className="text-gray-300">{account.email}</TableCell>
                  <TableCell>
                    <Select
                      value={account.role}
                      onValueChange={(v) => changeRole(account.id, v as "admin" | "agent" | "viewer")}
                    >
                      <SelectTrigger className={`w-28 h-7 text-xs border ${roleColor(account.role)} bg-transparent`}>
                        <div className="flex items-center gap-1">
                          {roleIcon(account.role)}
                          <span className="capitalize">{account.role}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={account.isActive
                        ? "bg-green-900/30 text-green-400 border-green-800"
                        : "bg-gray-800 text-gray-500 border-gray-700"}
                    >
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {account.lastLoginAt
                      ? new Date(account.lastLoginAt).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(account.id, account.isActive)}
                        className="h-7 px-2 text-gray-400 hover:text-white"
                        title={account.isActive ? "Deactivate" : "Activate"}
                      >
                        {account.isActive
                          ? <XCircle className="w-4 h-4 text-yellow-500" />
                          : <CheckCircle className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remove account for ${account.email}? This cannot be undone.`)) {
                            deleteAccountMutation.mutate({ id: account.id });
                          }
                        }}
                        className="h-7 px-2 text-gray-400 hover:text-red-400"
                        title="Delete account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!accounts || accounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No accounts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
