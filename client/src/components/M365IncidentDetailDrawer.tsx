/**
 * M365 Incident Detail Drawer
 *
 * Displays full incident details from Microsoft Graph Service Communications API:
 * - Incident ID, classification, severity, status
 * - Start time, last modified, estimated resolution
 * - Affected features and users
 * - Complete message timeline with all posted updates
 * - Workarounds (extracted from posts)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Users,
  Zap,
  RefreshCw,
  ExternalLink,
  Info,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────

interface IncidentPost {
  createdDateTime: string;
  postType: string;
  description: { contentType: string; content: string };
}

interface IncidentDetail {
  id: string;
  title: string;
  service: string;
  status: string;
  classification: string;
  severity: string;
  startDateTime: string;
  endDateTime: string | null;
  lastModifiedDateTime: string;
  impactDescription: string;
  affectedFeatures: string[];
  affectedUsers: string | null;
  estimatedResolution: string | null;
  posts: IncidentPost[];
  _demo?: boolean;
}

interface M365IncidentDetailDrawerProps {
  issueId: string | null;
  serviceName: string;
  onClose: () => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("operational") || s.includes("restored") || s.includes("resolved")) return "text-green-500";
  if (s.includes("investigating") || s.includes("verifying")) return "text-yellow-500";
  if (s.includes("degradation") || s.includes("advisory")) return "text-amber-500";
  if (s.includes("interruption") || s.includes("extended")) return "text-red-500";
  return "text-muted-foreground";
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const s = status.toLowerCase();
  if (s.includes("operational") || s.includes("restored") || s.includes("resolved")) return "default";
  if (s.includes("interruption") || s.includes("extended")) return "destructive";
  return "secondary";
}

function getSeverityIcon(severity: string) {
  switch (severity?.toLowerCase()) {
    case "critical": return <XCircle className="w-4 h-4 text-red-500" />;
    case "major": return <AlertCircle className="w-4 h-4 text-amber-500" />;
    case "minor": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default: return <Info className="w-4 h-4 text-blue-500" />;
  }
}

function formatStatus(status: string): string {
  return status
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── component ────────────────────────────────────────────────────────────────

export function M365IncidentDetailDrawer({
  issueId,
  serviceName,
  onClose,
}: M365IncidentDetailDrawerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: incident,
    isLoading,
    error,
    refetch,
  } = trpc.serviceHealthMonitoring.getM365IncidentDetail.useQuery(
    { issueId: issueId ?? "" },
    {
      enabled: !!issueId,
      refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
      staleTime: 60 * 1000,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <Dialog open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="sticky top-0 bg-card z-10 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-card-foreground leading-tight">
                {isLoading ? "Loading incident details..." : (incident?.title ?? serviceName)}
              </DialogTitle>
              {incident && (
                <p className="text-sm text-muted-foreground mt-1">
                  {incident.service} · Incident ID: <span className="font-mono text-xs">{incident.id}</span>
                  {incident._demo && (
                    <Badge variant="outline" className="ml-2 text-xs">Demo Data</Badge>
                  )}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">Fetching incident details from Microsoft Graph...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-card-foreground font-medium mb-1">Failed to load incident details</p>
            <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        )}

        {/* Incident detail */}
        {incident && !isLoading && (
          <div className="space-y-6 pt-2">

            {/* Status row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(incident.status).replace("text-", "bg-")}`} />
                  <Badge variant={getStatusBadgeVariant(incident.status)} className="text-xs">
                    {formatStatus(incident.status)}
                  </Badge>
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Severity</p>
                <div className="flex items-center gap-1.5">
                  {getSeverityIcon(incident.severity)}
                  <span className="text-sm font-medium text-card-foreground capitalize">
                    {incident.severity || "Unknown"}
                  </span>
                </div>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Classification</p>
                <span className="text-sm font-medium text-card-foreground capitalize">
                  {incident.classification || "Unknown"}
                </span>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Updates</p>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-cyan-500" />
                  <span className="text-sm font-medium text-card-foreground">
                    {incident.posts?.length ?? 0} posts
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm text-card-foreground">
                    {new Date(incident.startDateTime).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm text-card-foreground">
                    {new Date(incident.lastModifiedDateTime).toLocaleString()}
                  </p>
                </div>
              </div>
              {incident.estimatedResolution && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Resolution</p>
                    <p className="text-sm text-card-foreground">
                      {new Date(incident.estimatedResolution).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Impact description */}
            <div>
              <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Impact Description
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed bg-background/50 rounded-lg p-3">
                {incident.impactDescription || "No impact description available."}
              </p>
            </div>

            {/* Affected features & users */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {incident.affectedFeatures && incident.affectedFeatures.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-500" />
                    Affected Features
                  </h3>
                  <ul className="space-y-1">
                    {incident.affectedFeatures.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {incident.affectedUsers && (
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-500" />
                    Affected Users
                  </h3>
                  <p className="text-sm text-muted-foreground">{incident.affectedUsers}</p>
                </div>
              )}
            </div>

            {/* Message timeline */}
            {incident.posts && incident.posts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-500" />
                  Incident Timeline ({incident.posts.length} updates)
                </h3>
                <div className="space-y-3">
                  {[...incident.posts].reverse().map((post, idx) => (
                    <div
                      key={idx}
                      className="border border-border rounded-lg p-4 bg-background/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                          <span className="text-xs font-medium text-cyan-500 uppercase tracking-wide">
                            {post.postType === "Regular" ? "Update" : post.postType}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.createdDateTime).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-card-foreground leading-relaxed whitespace-pre-line">
                        {post.description?.contentType === "html"
                          ? stripHtml(post.description.content)
                          : (post.description?.content ?? "No content")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Microsoft Admin Center link */}
            <div className="pt-2 border-t border-border">
              <a
                href="https://admin.microsoft.com/Adminportal/Home#/servicehealth"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-500 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View in Microsoft 365 Admin Center
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
