/**
 * M365 Service Degradations Component
 * 
 * Displays detailed information about all M365 service degradations
 * including affected features, users, and estimated resolution times
 */

import { AlertCircle, AlertTriangle, Clock, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface M365ServiceDegradation {
  serviceName: string;
  serviceId: string;
  status: "operational" | "degraded" | "interrupted" | "extended_recovery";
  lastUpdated: Date;
  description?: string;
  impactedFeatures?: string[];
  affectedUsers?: string;
  estimatedResolution?: Date;
}

interface M365ServiceDegradationsProps {
  degradations: M365ServiceDegradation[];
  isLoading?: boolean;
}

export function M365ServiceDegradations({
  degradations,
  isLoading = false,
}: M365ServiceDegradationsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!degradations || degradations.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">All M365 services operational</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "interrupted":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "extended_recovery":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interrupted":
        return "border-red-500/30 bg-red-500/5";
      case "extended_recovery":
        return "border-orange-500/30 bg-orange-500/5";
      case "degraded":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "border-gray-500/30 bg-gray-500/5";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "interrupted":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "extended_recovery":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "degraded":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const formatStatusLabel = (status: string) => {
    switch (status) {
      case "interrupted":
        return "Service Interrupted";
      case "extended_recovery":
        return "Extended Recovery";
      case "degraded":
        return "Degraded";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      {degradations.map((degradation) => (
        <Card
          key={degradation.serviceId}
          className={`border ${getStatusColor(degradation.status)} p-5`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              {getStatusIcon(degradation.status)}
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {degradation.serviceName}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  ID: {degradation.serviceId}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(degradation.status)}`}
            >
              {formatStatusLabel(degradation.status)}
            </span>
          </div>

          {/* Description */}
          {degradation.description && (
            <div className="mb-4 p-3 bg-black/30 rounded border border-gray-700/50">
              <p className="text-sm text-gray-300">{degradation.description}</p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Impacted Features */}
            {degradation.impactedFeatures && degradation.impactedFeatures.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Impacted Features
                  </p>
                </div>
                <div className="space-y-1">
                  {degradation.impactedFeatures.map((feature, idx) => (
                    <div key={idx} className="text-sm text-gray-300 pl-6">
                      • {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affected Users */}
            {degradation.affectedUsers && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-cyan-500" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Affected Users
                  </p>
                </div>
                <p className="text-sm text-gray-300">{degradation.affectedUsers}</p>
              </div>
            )}

            {/* Last Updated */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-cyan-500" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Last Updated
                </p>
              </div>
              <p className="text-sm text-gray-300">
                {new Date(degradation.lastUpdated).toLocaleString()}
              </p>
            </div>

            {/* Estimated Resolution */}
            {degradation.estimatedResolution && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Est. Resolution
                  </p>
                </div>
                <p className="text-sm text-green-400">
                  {new Date(degradation.estimatedResolution).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
