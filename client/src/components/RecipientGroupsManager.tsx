/**
 * RecipientGroupsManager — Manage email recipient groups for targeted campaigns
 *
 * Features:
 *  - Create, edit, delete recipient groups
 *  - Add/remove members from groups
 *  - Bulk import emails from CSV
 *  - View group members
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Users, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface RecipientGroup {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  memberCount?: number;
}

export default function RecipientGroupsManager() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupType, setNewGroupType] = useState<"custom" | "newsletter_subscribers" | "customers">("custom");
  const [bulkEmails, setBulkEmails] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);

  // Fetch all groups
  const { data: groups = [], refetch: refetchGroups } = trpc.emailGroups.listGroups.useQuery();

  // Fetch selected group details
  const { data: selectedGroup } = trpc.emailGroups.getGroup.useQuery(
    { groupId: selectedGroupId || 0 },
    { enabled: !!selectedGroupId }
  );

  // Create group mutation
  const createGroup = trpc.emailGroups.createGroup.useMutation({
    onSuccess: () => {
      toast.success("Group created successfully!");
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupType("custom");
      setShowCreateDialog(false);
      refetchGroups();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  // Add members mutation
  const addMembers = trpc.emailGroups.addMembers.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Added ${result.added} members to group!`);
      setBulkEmails("");
      setShowAddMembersDialog(false);
      refetchGroups();
      if (selectedGroupId) {
        // Refetch selected group to update member count
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add members");
    },
  });

  // Delete group mutation
  const deleteGroup = trpc.emailGroups.deleteGroup.useMutation({
    onSuccess: () => {
      toast.success("Group deleted successfully!");
      setSelectedGroupId(null);
      refetchGroups();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete group");
    },
  });

  // Remove member mutation
  const removeMember = trpc.emailGroups.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed from group");
      refetchGroups();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  // Handle create group
  async function handleCreateGroup() {
    if (!newGroupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsCreating(true);
    try {
      await createGroup.mutateAsync({
        name: newGroupName,
        description: newGroupDescription,
        type: newGroupType,
      });
    } finally {
      setIsCreating(false);
    }
  }

  // Handle add members
  async function handleAddMembers() {
    if (!selectedGroupId) {
      toast.error("Please select a group first");
      return;
    }

    if (!bulkEmails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    // Parse emails from textarea (comma or newline separated)
    const emailList = bulkEmails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (emailList.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }

    setIsAddingMembers(true);
    try {
      await addMembers.mutateAsync({
        groupId: selectedGroupId,
        members: emailList.map((email) => ({ email })),
      });
    } finally {
      setIsAddingMembers(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Recipient Groups</h3>
          <p className="text-sm text-gray-400 mt-1">Manage groups for targeted email campaigns</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90"
        >
          <Plus size={16} className="mr-2" />
          New Group
        </Button>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.length === 0 ? (
          <Card className="bg-[#141B2D] border-gray-800/40 p-8 text-center col-span-full">
            <Users size={32} className="mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No groups created yet</p>
          </Card>
        ) : (
          groups.map((group: RecipientGroup) => (
            <Card
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={`bg-[#141B2D] border-gray-800/40 p-4 cursor-pointer transition-[opacity,transform] ${
                selectedGroupId === group.id
                  ? "border-[#00D4FF]/50 shadow-lg shadow-[#00D4FF]/10"
                  : "hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-white">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{group.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGroup.mutate({ groupId: group.id });
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{group.memberCount || 0} members</span>
                <span className="text-xs bg-[#00D4FF]/10 text-[#00D4FF] px-2 py-1 rounded">
                  {group.type}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Selected Group Details */}
      {selectedGroup && selectedGroup.members && (
        <Card className="bg-[#141B2D] border-gray-800/40 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white">Members ({selectedGroup.members.length})</h4>
            <Button
              onClick={() => setShowAddMembersDialog(true)}
              size="sm"
              className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90"
            >
              <Plus size={14} className="mr-1" />
              Add Members
            </Button>
          </div>

          {selectedGroup.members.length === 0 ? (
            <p className="text-sm text-gray-400">No members in this group yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedGroup.members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between bg-[#0A0E1A] p-3 rounded-lg"
                >
                  <div>
                    <p className="text-sm text-white">{member.email}</p>
                    {member.name && <p className="text-xs text-gray-400">{member.name}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      removeMember.mutate({
                        groupId: selectedGroup.id,
                        email: member.email,
                      })
                    }
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Create a new recipient group for email campaigns</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">Group Name</label>
              <Input
                placeholder="e.g., VIP Customers"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white">Description</label>
              <Input
                placeholder="Optional description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white">Group Type</label>
              <Select value={newGroupType} onValueChange={(v: any) => setNewGroupType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="newsletter_subscribers">Newsletter Subscribers</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90"
              >
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to Group</DialogTitle>
            <DialogDescription>
              Enter email addresses separated by commas or newlines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="email1@example.com&#10;email2@example.com&#10;email3@example.com"
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              rows={6}
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddMembersDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={isAddingMembers}
                className="bg-[#00D4FF] text-black hover:bg-[#00D4FF]/90"
              >
                <Upload size={14} className="mr-1" />
                {isAddingMembers ? "Adding..." : "Add Members"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
