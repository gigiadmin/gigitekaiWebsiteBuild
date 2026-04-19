import React, { useState } from "react";
import { Users, UserPlus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AdminUserRoleAssignment() {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);

  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = trpc.adminRoles.listUsers.useQuery();

  const { data: roles = [], isLoading: rolesLoading } = trpc.adminRoles.listRoles.useQuery();

  const assignRole = trpc.adminRoles.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast.success("Role assigned successfully");
      setSelectedRole(null);
      setEditingUserId(null);
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });

  const removeRole = trpc.adminRoles.removeRoleFromUser.useMutation({
    onSuccess: () => {
      toast.success("Role removed successfully");
      refetchUsers();
    },
    onError: (error) => {
      toast.error(`Failed to remove role: ${error.message}`);
    },
  });

  const handleAssignRole = async (userId: number) => {
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }

    await assignRole.mutateAsync({
      userId,
      roleId: selectedRole,
    });
  };

  const handleRemoveRole = async (userId: number, roleId: number) => {
    if (confirm("Remove this role from the user?")) {
      await removeRole.mutateAsync({
        userId,
        roleId,
      });
    }
  };

  const filteredUsers = users.filter(
    (user: any) =>
      user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
      user.name.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-cyan-500" />
        <h3 className="text-lg font-semibold">User Role Assignment</h3>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <Input
          placeholder="Search users by email or name..."
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="w-full"
        />
      </Card>

      {/* Users List */}
      <div className="space-y-3">
        {usersLoading ? (
          <div className="text-center py-8 text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {searchEmail ? "No users found matching your search" : "No users available"}
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <Card key={user.id} className="p-4">
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{user.name}</h4>
                    <p className="text-sm text-gray-400">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Default Role:</span>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Custom Roles */}
                {user.customRoles && user.customRoles.length > 0 && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 mb-2">Custom Roles:</p>
                    <div className="flex flex-wrap gap-2">
                      {user.customRoles.map((roleId: number) => {
                        const role = roles.find((r: any) => r.id === roleId);
                        return (
                          <div key={roleId} className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {role?.name || `Role #${roleId}`}
                            </Badge>
                            <button
                              onClick={() => handleRemoveRole(user.id, roleId)}
                              disabled={removeRole.isPending}
                              className="ml-1 text-red-500 hover:text-red-400 disabled:opacity-50"
                              title="Remove role"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Assign Role */}
                {editingUserId === user.id ? (
                  <div className="pt-3 border-t border-gray-700 space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Role to Assign</label>
                      <select
                        value={selectedRole || ""}
                        onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white text-sm"
                        disabled={assignRole.isPending || rolesLoading}
                      >
                        <option value="">-- Select a role --</option>
                        {roles.map((role: any) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAssignRole(user.id)}
                        disabled={assignRole.isPending || !selectedRole}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingUserId(null);
                          setSelectedRole(null);
                        }}
                        disabled={assignRole.isPending}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-700">
                    <Button
                      onClick={() => setEditingUserId(user.id)}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Assign Custom Role
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-950/30 border-blue-900">
        <p className="text-sm text-blue-200">
          💡 <strong>Tip:</strong> Users retain their default role (admin/user) and can have additional custom roles
          assigned. Custom roles provide granular permission control.
        </p>
      </Card>
    </div>
  );
}
