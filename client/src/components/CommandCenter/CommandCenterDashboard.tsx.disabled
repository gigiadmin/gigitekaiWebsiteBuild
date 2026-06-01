import React, { useState } from "react";
import { GripVertical, X, Plus, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CommandPalette } from "./CommandPalette";
import { UptimeWidget } from "./widgets/UptimeWidget";
import { AgentsWidget } from "./widgets/AgentsWidget";
import { EmailWidget } from "./widgets/EmailWidget";
import { TicketsWidget } from "./widgets/TicketsWidget";
import { AlertsWidget } from "./widgets/AlertsWidget";
import { ApiStatusWidget } from "./widgets/ApiStatusWidget";

interface Widget {
  id: number;
  widgetType: "uptime" | "agents" | "email" | "tickets" | "alerts" | "api_status";
  title: string;
  position: number;
  isVisible: boolean;
  refreshInterval: number;
  config?: any;
}

export const CommandCenterDashboard: React.FC = () => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const getWidgets = trpc.commandCenter.getWidgets.useQuery(undefined, {
    enabled: !!user,
  });

  const updateWidgetOrder = trpc.commandCenter.updateWidgetOrder.useMutation();
  const toggleWidgetVisibility = trpc.commandCenter.toggleWidgetVisibility.useMutation();
  const deleteWidget = trpc.commandCenter.deleteWidget.useMutation();
  const addWidget = trpc.commandCenter.addWidget.useMutation();

  // Load widgets from query
  React.useEffect(() => {
    if (getWidgets.data) {
      setWidgets(getWidgets.data);
    }
  }, [getWidgets.data]);

  const visibleWidgets = widgets.filter((w) => w.isVisible).sort((a, b) => a.position - b.position);

  const handleDragStart = (e: React.DragEvent, widgetId: number) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("widgetId", widgetId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const sourceId = parseInt(e.dataTransfer.getData("widgetId"));

    if (sourceId === targetId) return;

    const sourceWidget = widgets.find((w) => w.id === sourceId);
    const targetWidget = widgets.find((w) => w.id === targetId);

    if (!sourceWidget || !targetWidget) return;

    // Swap positions
    const newWidgets = widgets.map((w) => {
      if (w.id === sourceId) return { ...w, position: targetWidget.position };
      if (w.id === targetId) return { ...w, position: sourceWidget.position };
      return w;
    });

    setWidgets(newWidgets);
    setIsDragging(false);

    // Save to backend
    await updateWidgetOrder.mutateAsync({
      widgetId: sourceId,
      newPosition: targetWidget.position,
    });
  };

  const handleToggleVisibility = async (widgetId: number) => {
    const widget = widgets.find((w) => w.id === widgetId);
    if (!widget) return;

    await toggleWidgetVisibility.mutateAsync({
      widgetId,
      isVisible: !widget.isVisible,
    });

    setWidgets(
      widgets.map((w) => (w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  const handleDeleteWidget = async (widgetId: number) => {
    await deleteWidget.mutateAsync({ widgetId });
    setWidgets(widgets.filter((w) => w.id !== widgetId));
  };

  const handleAddWidget = async (widgetType: Widget["widgetType"]) => {
    const result = await addWidget.mutateAsync({
      widgetType,
      title: `${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget`,
    });

    setWidgets([...widgets, result]);
    setShowAddWidget(false);
  };

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      title: widget.title,
      refreshInterval: widget.refreshInterval,
      config: widget.config,
    };

    switch (widget.widgetType) {
      case "uptime":
        return <UptimeWidget {...commonProps} />;
      case "agents":
        return <AgentsWidget {...commonProps} />;
      case "email":
        return <EmailWidget {...commonProps} />;
      case "tickets":
        return <TicketsWidget {...commonProps} />;
      case "alerts":
        return <AlertsWidget {...commonProps} />;
      case "api_status":
        return <ApiStatusWidget {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Command Center</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor infrastructure, agents, and APIs in real-time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddWidget(!showAddWidget)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Widget
            </button>

            <button
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Command Palette (Cmd+K)"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Widget Menu */}
        {showAddWidget && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-sm text-slate-300 mb-3">Select a widget to add:</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { type: "uptime", label: "Website Uptime" },
                  { type: "agents", label: "Agent Status" },
                  { type: "email", label: "Email Queue" },
                  { type: "tickets", label: "Tickets" },
                  { type: "alerts", label: "Alerts" },
                  { type: "api_status", label: "API Status" },
                ] as const
              ).map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleAddWidget(type)}
                  className="p-2 text-sm rounded bg-slate-700 hover:bg-slate-600 text-cyan-300 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {visibleWidgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No widgets added yet</p>
            <button
              onClick={() => setShowAddWidget(true)}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
            >
              Add Your First Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWidgets.map((widget) => (
              <div
                key={widget.id}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widget.id)}
                className={`relative bg-slate-800 rounded-lg border border-slate-700 overflow-hidden transition-all ${
                  isDragging ? "opacity-50" : "hover:border-slate-600"
                }`}
              >
                {/* Widget Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
                    <h3 className="font-semibold text-white">{widget.title}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleVisibility(widget.id)}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Hide widget"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWidget(widget.id)}
                      className="p-1 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete widget"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Widget Content */}
                <div className="p-4 min-h-64">{renderWidget(widget)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
};
