import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Permission {
  id: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "view_tickets", label: "View Tickets", description: "Can view all tickets" },
  { id: "create_tickets", label: "Create Tickets", description: "Can create new tickets" },
  { id: "edit_tickets", label: "Edit Tickets", description: "Can edit ticket details" },
  { id: "close_tickets", label: "Close Tickets", description: "Can close tickets" },
  { id: "assign_tickets", label: "Assign Tickets", description: "Can assign tickets to agents" },
  { id: "view_analytics", label: "View Analytics", description: "Can view analytics dashboards" },
  { id: "manage_kb", label: "Manage KB", description: "Can manage knowledge base articles" },
  { id: "manage_users", label: "Manage Users", description: "Can manage user accounts" },
  { id: "manage_roles", label: "Manage Roles", description: "Can create and manage roles" },
  { id: "view_reports", label: "View Reports", description: "Can view reports" },
];

export function AdminRolesManager() {
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<number | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  const { data: roles = [], isLoading, refetch } = trpc.adminRoles.listRoles.useQuery();

  const createRole = trpc.adminRoles.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      setNewRoleName("");
      setSelectedPermissions([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });

  const updateRole = trpc.adminRoles.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      setEditingRole(null);
      setEditingPermissions([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });

  const deleteRole = trpc.adminRoles.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    await createRole.mutateAsync({
      name: newRoleName,
      permissions: selectedPermissions,
    });
  };

  const handleUpdateRole = async (roleId: number) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    await updateRole.mutateAsync({
      roleId,
      name: role.name,
      permissions: editingPermissions,
    });
  };

  const handleDeleteRole = async (roleId: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      await deleteRole.mutateAsync({ roleId });
    }
  };

  const togglePermission = (permissionId: string, isEditing: boolean) => {
    if (isEditing) {
      setEditingPermissions((prev) =>
        prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
      );
    } else {
      setSelectedPermissions((prev) =>
        prev.includes(permissionId) ? prev.filter((p) => p !== permissionId) : [...prev, permissionId]
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Role Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Role</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Role Name</label>
            <Input
              placeholder="e.g., Support Manager, Team Lead"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              disabled={createRole.isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <button
                  key={permission.id}
                  onClick={() => togglePermission(permission.id, false)}
                  className={`p-3 rounded-lg border-2 text-left transition-[opacity,transform] ${
                    selectedPermissions.includes(permission.id)
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                  disabled={createRole.isPending}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-4 h-4 rounded border mt-1 flex-shrink-0 ${
                        selectedPermissions.includes(permission.id)
                          ? "bg-cyan-500 border-cyan-500"
                          : "border-gray-600"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{permission.label}</p>
                      <p className="text-xs text-gray-400">{permission.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleCreateRole}
            disabled={createRole.isPending || !newRoleName.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {createRole.isPending ? "Creating..." : "Create Role"}
          </Button>
        </div>
      </Card>

      {/* Existing Roles List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Existing Roles</h3>

        {isLoading ? (
          <div className="text-center py-8 text-gray-400">Loading roles...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No custom roles created yet</div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <Card key={role.id} className="p-4">
                {editingRole === role.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-3 block">Permissions</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {AVAILABLE_PERMISSIONS.map((permission) => (
                          <button
                            key={permission.id}
                            onClick={() => togglePermission(permission.id, true)}
                            className={`p-2 rounded border-2 text-left text-sm transition-[opacity,transform] ${
                              editingPermissions.includes(permission.id)
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-gray-700 hover:border-gray-600"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-3 h-3 rounded border ${
                                  editingPermissions.includes(permission.id)
                                    ? "bg-cyan-500 border-cyan-500"
                                    : "border-gray-600"
                                }`}
                              />
                              <span>{permission.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateRole(role.id)}
                        disabled={updateRole.isPending}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingRole(null)}
                        disabled={updateRole.isPending}
                        size="sm"
                        variant="outline"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">{role.name}</h4>
                      <div className="flex flex-wrap gap-2">
                        {(role.permissions as string[]).map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingRole(role.id as number);
                          setEditingPermissions(role.permissions as string[]);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={deleteRole.isPending}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
