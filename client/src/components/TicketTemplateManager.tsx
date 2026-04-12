import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface TicketTemplateManagerProps {
  onTemplateSelect?: (template: any) => void;
}

export function TicketTemplateManager({
  onTemplateSelect,
}: TicketTemplateManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "General Support",
  });

  const { data: templates, isLoading, refetch } = trpc.helpdesk.listTemplates.useQuery(undefined, { enabled: true });
  const createTemplate = trpc.helpdesk.createTemplate.useMutation();
  const deleteTemplate = trpc.helpdesk.deleteTemplate.useMutation();

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.subject || !formData.body) return;
    setIsCreating(true);
    try {
      await createTemplate.mutateAsync({
        name: formData.name,
        subject: formData.subject,
        body: formData.body,
        category: formData.category,
      });
      setFormData({ name: "", subject: "", body: "", category: "General Support" });
      refetch();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await deleteTemplate.mutateAsync({ templateId });
      refetch();
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ticket Templates</DialogTitle>
          <DialogDescription>
            Create and manage response templates for common issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Template */}
          <div className="border-b pb-4">
            <h3 className="font-semibold mb-3">Create New Template</h3>
            <div className="space-y-3">
              <Input
                placeholder="Template name (e.g., Password Reset)"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General Support">General Support</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Subject line"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
              />
              <Textarea
                placeholder="Template body"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                rows={4}
              />
              <Button
                onClick={handleCreateTemplate}
                disabled={isCreating || !formData.name || !formData.subject || !formData.body}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Template"
                )}
              </Button>
            </div>
          </div>

          {/* Existing Templates */}
          <div>
            <h3 className="font-semibold mb-3">Existing Templates</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {templates.map((template: any) => (
                  <div
                    key={template.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition"
                    onClick={() => {
                      if (onTemplateSelect) {
                        onTemplateSelect(template);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.category}
                        </p>
                        <p className="text-sm mt-1 line-clamp-2">
                          {template.subject}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(template.id);
                        }}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No templates yet. Create one above.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
