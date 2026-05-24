/**
 * M365 Service Degradations Component
 * 
 * Displays detailed information about all M365 service degradations
 * including affected features, users, and estimated resolution times.
 * Click any degraded service card to open the full incident detail drawer.
 */

import { useState } from "react";
import { AlertCircle, AlertTriangle, Clock, Users, Zap, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { M365IncidentDetailDrawer } from "@/components/M365IncidentDetailDrawer";

interface M365ServiceDegradationProps {
  degradations: Array<{
    serviceName: string;
    serviceId: string;
    status: "operational" | "degraded" | "interrupted" | "extended_recovery";
    lastUpdated: Date | string;
    description?: string;
    impactedFeatures?: string[] | string;
    affectedUsers?: string;
    estimatedResolution?: Date | string;
  }>;
  isLoading?: boolean;
}

export function M365ServiceDegradations({
  degradations,
  isLoading = false,
}: M365ServiceDegradationProps) {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading M365 degradations...</div>
      </div>
    );
  }

  if (!degradations || degradations.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
        <p className="text-muted-foreground">No service degradations detected</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4">
      {degradations.map((degradation) => {
        // Ensure we have valid data
        const serviceName = degradation.serviceName || degradation.serviceId || "Unknown Service";
        const status = degradation.status || "operational";
        const description = degradation.description || "No description available";
        const impactedFeatures = typeof degradation.impactedFeatures === "string" ? degradation.impactedFeatures.split(", ") : Array.isArray(degradation.impactedFeatures) ? degradation.impactedFeatures : [];
        const affectedUsers = degradation.affectedUsers || "Unknown";
        const lastUpdated = new Date(degradation.lastUpdated || new Date());
        const estimatedResolution = degradation.estimatedResolution ? new Date(degradation.estimatedResolution || new Date()) : null;

        return (
          <Card
            key={degradation.serviceId}
            className="border-l-4 border-l-amber-500 bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => {
              setSelectedIssueId(degradation.serviceId);
              setSelectedServiceName(serviceName);
            }}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-card-foreground">{serviceName}</h3>
                  <p className="text-sm text-muted-foreground">ID: {degradation.serviceId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="px-2 py-1 bg-amber-500/20 text-amber-600 text-xs font-medium rounded">
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-cyan-500 hover:text-cyan-400">
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-xs ml-1">Details</span>
                  </Button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-card-foreground mb-4">{description}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Impacted Features */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Impacted Features</span>
                  </div>
                  {impactedFeatures.length > 0 ? (
                    <ul className="text-sm space-y-1">
                      {impactedFeatures.map((feature, idx) => (
                        <li key={idx} className="text-card-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">None specified</p>
                  )}
                </div>

                {/* Affected Users */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Affected Users</span>
                  </div>
                  <p className="text-sm text-card-foreground">{affectedUsers}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Last Updated</span>
                  </div>
                  <p className="text-sm text-card-foreground">
                    {lastUpdated.toLocaleString()}
                  </p>
                </div>

                {estimatedResolution && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Est. Resolution</span>
                    </div>
                    <p className="text-sm text-card-foreground">
                      {estimatedResolution.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
    {/* Incident detail drawer */}
    <M365IncidentDetailDrawer
      issueId={selectedIssueId}
      serviceName={selectedServiceName}
      onClose={() => setSelectedIssueId(null)}
    />
    </>
  );
}
