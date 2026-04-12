import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, ExternalLink } from "lucide-react";

export function SupportTicketWidget() {
  // Hardcoded support ticket info for now
  // In production, this would fetch from an API
  const ticketInfo = {
    id: "TICKET-001",
    subject: "Add OAuth Redirect URI for gigitekai.com",
    status: "pending", // pending, in-progress, resolved, closed
    createdAt: new Date("2026-04-12"),
    lastUpdated: new Date("2026-04-12"),
    priority: "high",
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending":
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
      case "closed":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "pending":
      default:
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Support Ticket</CardTitle>
            <CardDescription>Manus support request status</CardDescription>
          </div>
          {getStatusIcon(ticketInfo.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Ticket ID:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{ticketInfo.id}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subject:</span>
            <span className="text-sm font-medium">{ticketInfo.subject}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge className={`${getStatusColor(ticketInfo.status)} border`}>
              {ticketInfo.status.charAt(0).toUpperCase() + ticketInfo.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Created:</span>
            <span className="text-sm">{ticketInfo.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">
            {ticketInfo.status === "pending" && "Waiting for Manus support team to review your request..."}
            {ticketInfo.status === "in-progress" && "Manus support team is working on your request..."}
            {ticketInfo.status === "resolved" && "Your request has been completed!"}
            {ticketInfo.status === "closed" && "Your support ticket has been closed."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open("https://help.manus.im", "_blank")}
          >
            <ExternalLink className="w-3 h-3 mr-2" />
            View on Manus Help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
