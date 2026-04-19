/**
 * Alert Threshold Configuration Component
 * 
 * Allows admins to configure alert thresholds for each service
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Save, X, Edit2 } from "lucide-react";

interface AlertThresholdConfig {
  service: string;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  unprocessedTicketsThreshold?: number;
  agentAvailabilityThreshold?: number;
  slaComplianceThreshold?: number;
  enabled: boolean;
  notifyOnDegraded: boolean;
  notifyOnCritical: boolean;
  notifyOnRecovery: boolean;
}

export function AlertThresholdConfig() {
  const [editingService, setEditingService] = useState<string | null>(null);
  const [formData, setFormData] = useState<AlertThresholdConfig | null>(null);

  // Query all thresholds
  const { data: thresholds, isLoading, refetch } = trpc.serviceHealthThresholds.getAllAlertThresholds.useQuery();

  // Update threshold mutation
  const updateThreshold = trpc.serviceHealthThresholds.updateAlertThreshold.useMutation({
    onSuccess: () => {
      refetch();
      setEditingService(null);
      setFormData(null);
    },
  });

  const handleEdit = (threshold: AlertThresholdConfig) => {
    setEditingService(threshold.service);
    setFormData({ ...threshold });
  };

  const handleCancel = () => {
    setEditingService(null);
    setFormData(null);
  };

  const handleSave = async () => {
    if (!formData) return;

    await updateThreshold.mutateAsync({
      service: formData.service,
      responseTimeThreshold: formData.responseTimeThreshold,
      errorRateThreshold: formData.errorRateThreshold,
      unprocessedTicketsThreshold: formData.unprocessedTicketsThreshold,
      agentAvailabilityThreshold: formData.agentAvailabilityThreshold,
      slaComplianceThreshold: formData.slaComplianceThreshold,
      enabled: formData.enabled,
      notifyOnDegraded: formData.notifyOnDegraded,
      notifyOnCritical: formData.notifyOnCritical,
      notifyOnRecovery: formData.notifyOnRecovery,
    });
  };

  const handleInputChange = (field: keyof AlertThresholdConfig, value: any) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading thresholds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {thresholds?.map((threshold) => (
        <Card
          key={threshold.service}
          className={`border p-6 ${
            editingService === threshold.service
              ? "border-cyan-500/50 bg-cyan-500/5"
              : "border-gray-700/50 bg-gray-900/30"
          }`}
        >
          {editingService === threshold.service && formData ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{threshold.service}</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={updateThreshold.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Enable/Disable */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`enabled-${threshold.service}`}
                  checked={formData.enabled}
                  onChange={(e) => handleInputChange("enabled", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900 cursor-pointer"
                />
                <label
                  htmlFor={`enabled-${threshold.service}`}
                  className="text-sm text-gray-300 cursor-pointer"
                >
                  Enable alerts for this service
                </label>
              </div>

              {/* Response Time Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Response Time Threshold (ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="60000"
                  value={formData.responseTimeThreshold}
                  onChange={(e) =>
                    handleInputChange("responseTimeThreshold", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert if response time exceeds this value
                </p>
              </div>

              {/* Error Rate Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Error Rate Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.errorRateThreshold}
                  onChange={(e) =>
                    handleInputChange("errorRateThreshold", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert if error rate exceeds this percentage
                </p>
              </div>

              {/* Unprocessed Tickets Threshold */}
              {formData.unprocessedTicketsThreshold !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Unprocessed Tickets Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.unprocessedTicketsThreshold}
                    onChange={(e) =>
                      handleInputChange("unprocessedTicketsThreshold", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert if unprocessed tickets exceed this count
                  </p>
                </div>
              )}

              {/* Agent Availability Threshold */}
              {formData.agentAvailabilityThreshold !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Agent Availability Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.agentAvailabilityThreshold}
                    onChange={(e) =>
                      handleInputChange("agentAvailabilityThreshold", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert if agent availability drops below this percentage
                  </p>
                </div>
              )}

              {/* SLA Compliance Threshold */}
              {formData.slaComplianceThreshold !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SLA Compliance Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.slaComplianceThreshold}
                    onChange={(e) =>
                      handleInputChange("slaComplianceThreshold", Number(e.target.value))
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert if SLA compliance drops below this percentage
                  </p>
                </div>
              )}

              {/* Notification Preferences */}
              <div className="border-t border-gray-700/50 pt-4">
                <p className="text-sm font-medium text-gray-300 mb-3">Notification Preferences</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`degraded-${threshold.service}`}
                      checked={formData.notifyOnDegraded}
                      onChange={(e) =>
                        handleInputChange("notifyOnDegraded", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 cursor-pointer"
                    />
                    <label
                      htmlFor={`degraded-${threshold.service}`}
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Notify on degraded status
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`critical-${threshold.service}`}
                      checked={formData.notifyOnCritical}
                      onChange={(e) =>
                        handleInputChange("notifyOnCritical", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 cursor-pointer"
                    />
                    <label
                      htmlFor={`critical-${threshold.service}`}
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Notify on critical status
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`recovery-${threshold.service}`}
                      checked={formData.notifyOnRecovery}
                      onChange={(e) =>
                        handleInputChange("notifyOnRecovery", e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-600 bg-gray-900 cursor-pointer"
                    />
                    <label
                      htmlFor={`recovery-${threshold.service}`}
                      className="text-sm text-gray-300 cursor-pointer"
                    >
                      Notify on recovery
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-3">{threshold.service}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Response Time</p>
                    <p className="text-cyan-400 font-mono">{threshold.responseTimeThreshold}ms</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Error Rate</p>
                    <p className="text-cyan-400 font-mono">{threshold.errorRateThreshold}%</p>
                  </div>
                  {threshold.unprocessedTicketsThreshold !== undefined && (
                    <div>
                      <p className="text-gray-400">Unprocessed Tickets</p>
                      <p className="text-cyan-400 font-mono">
                        {threshold.unprocessedTicketsThreshold}
                      </p>
                    </div>
                  )}
                  {threshold.agentAvailabilityThreshold !== undefined && (
                    <div>
                      <p className="text-gray-400">Agent Availability</p>
                      <p className="text-cyan-400 font-mono">
                        {threshold.agentAvailabilityThreshold}%
                      </p>
                    </div>
                  )}
                  {threshold.slaComplianceThreshold !== undefined && (
                    <div>
                      <p className="text-gray-400">SLA Compliance</p>
                      <p className="text-cyan-400 font-mono">
                        {threshold.slaComplianceThreshold}%
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    {threshold.enabled ? "✅ Enabled" : "⊘ Disabled"}
                  </span>
                  {threshold.notifyOnDegraded && <span>📢 Degraded</span>}
                  {threshold.notifyOnCritical && <span>🚨 Critical</span>}
                  {threshold.notifyOnRecovery && <span>✅ Recovery</span>}
                </div>
              </div>
              <Button
                onClick={() => handleEdit(threshold)}
                variant="outline"
                size="sm"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
