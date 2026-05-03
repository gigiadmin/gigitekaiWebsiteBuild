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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  Trash2,
  RotateCcw,
  Users,
} from "lucide-react";

export default function TeamMembersEnhanced() {
  const [search, setSearch] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showRecovery, setShowRecovery] = useState(false);

  // Queries
  const { data: users = [], isLoading } = trpc.userAccountMgmt.getAllUsersWithStatus.useQuery({
    search,
    includeDeleted,
  });

  const { data: recoveryQueue = [] } = trpc.userAccountMgmt.getRecoveryQueue.useQuery();

  // Mutations
  const disableUserMut = trpc.userAccountMgmt.disableUser.useMutation();
  const enableUserMut = trpc.userAccountMgmt.enableUser.useMutation();
  const deleteUserMut = trpc.userAccountMgmt.deleteUser.useMutation();
  const restoreUserMut = trpc.userAccountMgmt.restoreUser.useMutation();
  const bulkDisableMut = trpc.userAccountMgmt.bulkDisableUsers.useMutation();
  const bulkEnableMut = trpc.userAccountMgmt.bulkEnableUsers.useMutation();

  const handleDisable = async (userId: number) => {
    await disableUserMut.mutateAsync({ userId });
    window.location.reload();
  };

  const handleEnable = async (userId: number) => {
    await enableUserMut.mutateAsync({ userId });
    window.location.reload();
  };

  const handleDelete = async (userId: number) => {
    if (confirm("Delete this user account? It can be restored within 30 days.")) {
      await deleteUserMut.mutateAsync({ userId });
      window.location.reload();
    }
  };

  const handleRestore = async (userId: number) => {
    await restoreUserMut.mutateAsync({ userId });
    window.location.reload();
  };

  const handleBulkDisable = async () => {
    if (selectedUsers.length === 0) return;
    await bulkDisableMut.mutateAsync({ userIds: selectedUsers });
    setSelectedUsers([]);
    window.location.reload();
  };

  const handleBulkEnable = async () => {
    if (selectedUsers.length === 0) return;
    await bulkEnableMut.mutateAsync({ userIds: selectedUsers });
    setSelectedUsers([]);
    window.location.reload();
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
      <div className="grid grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-muted-foreground">Total Members</span>
          </div>
          <div className="text-2xl font-bold">{users.length}</div>
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
            <Ban className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-muted-foreground">Disabled</span>
          </div>
          <div className="text-2xl font-bold">{disabledCount}</div>
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
      <div className="flex gap-4 items-center">
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
                    <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-300">
                      {user.role}
                    </span>
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
