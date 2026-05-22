import React, { useState, useEffect } from "react";
import { GripVertical, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  section: string;
}

const DEFAULT_MENU: MenuItem[] = [
  // Overview
  { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", section: "OVERVIEW" },
  { id: "metrics", label: "Metrics", icon: "BarChart3", section: "OVERVIEW" },
  // Operations
  { id: "helpdesk", label: "Helpdesk", icon: "Headphones", section: "OPERATIONS" },
  { id: "closed-tickets", label: "Closed Tickets", icon: "CheckCircle", section: "OPERATIONS" },
  { id: "agent-dashboard", label: "Agent Dashboard", icon: "Users", section: "OPERATIONS" },
  { id: "canned-responses", label: "Canned Responses", icon: "MessageSquare", section: "OPERATIONS" },
  { id: "live-chat", label: "Live Chat", icon: "MessageCircle", section: "OPERATIONS" },
  { id: "ai-agents", label: "AI Agents", icon: "Zap", section: "OPERATIONS" },
  { id: "notifications", label: "Notifications", icon: "Bell", section: "OPERATIONS" },
  // Content
  { id: "blog", label: "Blog", icon: "BookOpen", section: "CONTENT" },
  { id: "newsletter", label: "Newsletter", icon: "Mail", section: "CONTENT" },
  { id: "kb", label: "Knowledge Base", icon: "HelpCircle", section: "CONTENT" },
  // Analytics
  { id: "surveys", label: "Surveys", icon: "BarChart2", section: "ANALYTICS" },
  { id: "workload", label: "Workload", icon: "TrendingUp", section: "ANALYTICS" },
  { id: "kb-analytics", label: "KB Analytics", icon: "LineChart", section: "ANALYTICS" },
];

export function AdminMenuCustomizer() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);

  const saveCustomization = trpc.adminMenuCustomization.saveMenuCustomization.useMutation();
  const loadCustomization = trpc.adminMenuCustomization.getMenuCustomization.useQuery();

  // Load saved customization on mount
  useEffect(() => {
    if (loadCustomization.data?.menuOrder) {
      // Reconstruct menu items from saved order
      const savedIds = loadCustomization.data.menuOrder;
      const reorderedItems = savedIds
        .map((id: string) => DEFAULT_MENU.find((item) => item.id === id))
        .filter((item): item is MenuItem => item !== undefined);
      setMenuItems(reorderedItems);
    }
  }, [loadCustomization.data]);

  const handleDragStart = (item: MenuItem) => {
    setDraggedItem(item);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItem: MenuItem) => {
    if (!draggedItem) return;

    const draggedIndex = menuItems.findIndex((item) => item.id === draggedItem.id);
    const targetIndex = menuItems.findIndex((item) => item.id === targetItem.id);

    if (draggedIndex === targetIndex) return;

    const newItems = [...menuItems];
    newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    setMenuItems(newItems);
    setIsDragging(false);
    setDraggedItem(null);
  };

  const handleSave = async () => {
    try {
      await saveCustomization.mutateAsync({
        menuOrder: menuItems.map((item) => item.id),
        collapsedSections: [],
      });
      alert("Menu customization saved!");
    } catch (error) {
      alert("Failed to save customization");
    }
  };

  const handleReset = () => {
    setMenuItems(DEFAULT_MENU);
  };

  const groupedItems = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return (
    <div className="p-6 bg-background rounded-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Customize Admin Menu</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={saveCustomization.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveCustomization.isPending ? "Saving..." : "Save Order"}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              {section}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(item)}
                  className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-move transition-[opacity,transform] ${
                    isDragging && draggedItem?.id === item.id
                      ? "opacity-50 bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.icon}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          💡 Drag menu items to reorder them. Your custom order will be saved and applied to your admin sidebar.
        </p>
      </div>
    </div>
  );
}
