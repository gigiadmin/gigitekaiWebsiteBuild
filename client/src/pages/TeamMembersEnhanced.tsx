import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  Trash2,
  RotateCcw,
  Users,
  Plus,
  Shield,
  Wrench,
} from "lucide-react";

export default function TeamMembersEnhanced() {
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "technician" | "user">("user");
  const [selectedUserForRole, setSelectedUserForRole] = useState<number | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<"admin" | "technician" | "user">("user");

  // Queries
  const { data: users = [], isLoading, refetch: refetchUsers } = trpc.userAccountMgmt.getAllUsersWithStatus.useQuery({
    search,
    includeDeleted,
  });

  const { data: recoveryQueue = [] } = trpc.userAccountMgmt.getRecoveryQueue.useQuery();
  const { data: roleStats = { admin: 0, technician: 0, user: 0, total: 0 } } = trpc.userAccountMgmt.getRoleStats.useQuery();

  // Mutations
  const disableUserMut = trpc.userAccountMgmt.disableUser.useMutation();
  const enableUserMut = trpc.userAccountMgmt.enableUser.useMutation();
  const deleteUserMut = trpc.userAccountMgmt.deleteUser.useMutation();
  const restoreUserMut = trpc.userAccountMgmt.restoreUser.useMutation();
  const bulkDisableMut = trpc.userAccountMgmt.bulkDisableUsers.useMutation();
  const bulkEnableMut = trpc.userAccountMgmt.bulkEnableUsers.useMutation();
  const addUserMut = trpc.userAccountMgmt.addUser.useMutation();
  const changeRoleMut = trpc.userAccountMgmt.changeUserRole.useMutation();

  const handleDisable = async (userId: number) => {
    await disableUserMut.mutateAsync({ userId });
    refetchUsers();
  };

  const handleEnable = async (userId: number) => {
    await enableUserMut.mutateAsync({ userId });
    refetchUsers();
  };

  const handleDelete = async (userId: number) => {
    if (confirm("Delete this user account? It can be restored within 30 days.")) {
      await deleteUserMut.mutateAsync({ userId });
      refetchUsers();
    }
  };

  const handleRestore = async (userId: number) => {
    await restoreUserMut.mutateAsync({ userId });
    refetchUsers();
  };

  const handleBulkDisable = async () => {
    if (selectedUsers.length === 0) return;
    await bulkDisableMut.mutateAsync({ userIds: selectedUsers });
    setSelectedUsers([]);
    refetchUsers();
  };

  const handleBulkEnable = async () => {
    if (selectedUsers.length === 0) return;
    await bulkEnableMut.mutateAsync({ userIds: selectedUsers });
    setSelectedUsers([]);
    refetchUsers();
  };

  const handleAddUser = async () => {
    if (!newUserEmail || !newUserName) {
      alert("Please fill in all fields");
      return;
    }
    try {
      await addUserMut.mutateAsync({
        email: newUserEmail,
        name: newUserName,
        role: newUserRole,
      });
      setNewUserEmail("");
      setNewUserName("");
      setNewUserRole("user");
      setShowAddUser(false);
      refetchUsers();
    } catch (error) {
      alert("Error adding user: " + (error as any).message);
    }
  };

  const handleChangeRole = async (userId: number) => {
    try {
      await changeRoleMut.mutateAsync({
        userId,
        newRole: selectedNewRole,
      });
      setSelectedUserForRole(null);
      refetchUsers();
    } catch (error) {
      alert("Error changing role: " + (error as any).message);
    }
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const activeCount = users.filter((u: any) => u.isActive).length;
  const disabledCount = users.filter((u: any) => !u.isActive && !u.deletedAt).length;
  const deletedCount = users.filter((u: any) => u.deletedAt).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">Total Members</span>
          </div>
          <div className="text-2xl font-bold">{roleStats.total}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">Admins</span>
          </div>
          <div className="text-2xl font-bold">{roleStats.admin}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Technicians</span>
          </div>
          <div className="text-2xl font-bold">{roleStats.technician}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Active</span>
          </div>
          <div className="text-2xl font-bold">{activeCount}</div>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Recoverable</span>
          </div>
          <div className="text-2xl font-bold">{deletedCount}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4 items-center flex-wrap">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={includeDeleted} onCheckedChange={(checked) => setIncludeDeleted(checked as boolean)} />
          <span className="text-sm">Show deleted accounts</span>
        </label>

        {/* Add User Dialog */}
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700 ml-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new team member with a specific role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  placeholder="Full Name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </div>
                    </SelectItem>
                    <SelectItem value="technician">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Technician
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={addUserMut.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {addUserMut.isPending ? "Adding..." : "Add User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recovery Queue Dialog */}
        <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Recovery Queue ({deletedCount})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Recovery Queue</DialogTitle>
              <DialogDescription>
                Accounts can be restored within 30 days of deletion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recoveryQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground">No accounts pending recovery</p>
              ) : (
                recoveryQueue.map((account: any) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{account.name || account.email}</p>
                      <p className="text-xs text-muted-foreground">{account.email}</p>
                      <p className="text-xs text-orange-500">
                        {account.daysRemaining} days remaining
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRestore(account.id)}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {selectedUsers.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDisable}
              disabled={bulkDisableMut.isPending}
            >
              <Ban className="w-4 h-4 mr-1" />
              Disable ({selectedUsers.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkEnable}
              disabled={bulkEnableMut.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Enable ({selectedUsers.length})
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedUsers(users.map((u: any) => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name || "—"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer"
                          onClick={() => {
                            setSelectedUserForRole(user.id);
                            setSelectedNewRole(user.role);
                          }}
                        >
                          {user.role === "admin" && <Shield className="w-3 h-3 inline mr-1" />}
                          {user.role === "technician" && <Wrench className="w-3 h-3 inline mr-1" />}
                          {user.role}
                        </button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change User Role</DialogTitle>
                          <DialogDescription>
                            Update the role for {user.name || user.email}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select value={selectedNewRole} onValueChange={(value: any) => setSelectedNewRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="technician">
                                <div className="flex items-center gap-2">
                                  <Wrench className="w-4 h-4" />
                                  Technician
                                </div>
                              </SelectItem>
                              <SelectItem value="user">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  User
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-2 justify-end pt-4">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedUserForRole(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleChangeRole(user.id)}
                              disabled={changeRoleMut.isPending}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              {changeRoleMut.isPending ? "Updating..." : "Update Role"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    {user.deletedAt ? (
                      <span className="flex items-center gap-1 text-orange-500 text-sm">
                        <Clock className="w-4 h-4" />
                        Deleted
                      </span>
                    ) : user.isActive ? (
                      <span className="flex items-center gap-1 text-green-500 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-500 text-sm">
                        <Ban className="w-4 h-4" />
                        Disabled
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {user.deletedAt ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRestore(user.id)}
                          disabled={restoreUserMut.isPending}
                          title="Restore account"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      ) : user.isActive ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDisable(user.id)}
                          disabled={disableUserMut.isPending}
                          title="Disable account"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEnable(user.id)}
                          disabled={enableUserMut.isPending}
                          title="Enable account"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {!user.deletedAt && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteUserMut.isPending}
                          title="Delete account"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
