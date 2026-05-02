/**
 * Teams Remote Assistance Button
 * Launches a remote session from a helpdesk ticket and notifies Teams channel
 * with an Adaptive Card containing session details and join link
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Monitor, MessageSquare, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';


interface TeamsRemoteAssistanceButtonProps {
  ticketId: number;
  ticketTitle: string;
  clientName: string;
  clientEmail: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

type SessionType = 'screen_share_only' | 'remote_control' | 'file_transfer' | 'collaborative';

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  screen_share_only: '🖥️ Screen Share (View Only)',
  remote_control: '🖱️ Remote Control (Full Access)',
  file_transfer: '📁 File Transfer',
  collaborative: '🤝 Collaborative Session',
};

const SESSION_TYPE_DESCRIPTIONS: Record<SessionType, string> = {
  screen_share_only: 'View the client\'s screen without taking control',
  remote_control: 'Full remote control of client\'s device',
  file_transfer: 'Securely transfer files to/from client',
  collaborative: 'Collaborative screen sharing and support',
};

export const TeamsRemoteAssistanceButton: React.FC<TeamsRemoteAssistanceButtonProps> = ({
  ticketId,
  ticketTitle,
  clientName,
  clientEmail,
  urgency = 'medium',
  variant = 'default',
  size = 'default',
}) => {
  const [open, setOpen] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('screen_share_only');
  const [notes, setNotes] = useState('');
  const [launched, setLaunched] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [sessionLink, setSessionLink] = useState('');

  // Initiate remote session
  const initiateSession = trpc.remoteAssistance.initiateSession.useMutation();

  // Notify Teams channel
  const notifyTeams = trpc.teamsRemoteAssistance.notifySessionStarted.useMutation();

  const urgencyColors: Record<string, string> = {
    low: 'bg-green-500/10 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  const handleLaunchSession = async () => {
    try {
      // Step 1: Create the remote session
      const session = await initiateSession.mutateAsync({
        clientUserId: 0, // Will be resolved server-side from email
        clientEmail,
        sessionType,
        ticketId,
        issueDescription: ticketTitle,
      });

      const code = session.sessionToken;
      const link = `${window.location.origin}/remote-session/${session.sessionId}`;

      setSessionCode(code);
      setSessionLink(link);

      // Step 2: Notify Teams channel
      await notifyTeams.mutateAsync({
        ticketId,
        ticketTitle,
        clientName,
        clientEmail,
        sessionType,
        sessionCode: code,
        sessionLink: link,
        urgency,
      });

      setLaunched(true);

      console.log({
        title: '✅ Session Launched & Teams Notified',
        description: `Session code: ${code} — Teams channel has been notified.`,
      });
    } catch (err: any) {
      console.log({
        title: '❌ Failed to Launch Session',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sessionCode);
    console.log({ title: 'Session code copied to clipboard' });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sessionLink);
    console.log({ title: 'Session link copied to clipboard' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Monitor className="w-4 h-4" />
          Remote Assist via Teams
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            Launch Remote Assistance Session
          </DialogTitle>
          <DialogDescription>
            Start a remote session for Ticket #{ticketId} and notify the Teams Helpdesk channel.
          </DialogDescription>
        </DialogHeader>

        {!launched ? (
          <div className="space-y-4 py-2">
            {/* Ticket Info */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <p className="text-sm font-medium">{ticketTitle}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Client: {clientName}</span>
                <span>•</span>
                <span>{clientEmail}</span>
                <span>•</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${urgencyColors[urgency]}`}
                >
                  {urgency.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label>Session Type</Label>
              <Select
                value={sessionType}
                onValueChange={(v) => setSessionType(v as SessionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div>
                        <div>{SESSION_TYPE_LABELS[type]}</div>
                        <div className="text-xs text-muted-foreground">
                          {SESSION_TYPE_DESCRIPTIONS[type]}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Session Notes (optional)</Label>
              <Textarea
                placeholder="Describe the issue or any pre-session notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Teams notification info */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
              <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-300">
                An Adaptive Card will be posted to the <strong>Helpdesk Teams channel</strong> with
                the session details and a direct join link for team visibility.
              </p>
            </div>
          </div>
        ) : (
          /* Session Launched State */
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Session Active — Teams Notified</span>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Session Code</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold tracking-widest text-cyan-400">
                    {sessionCode}
                  </code>
                  <Button size="sm" variant="ghost" onClick={handleCopyCode}>
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Session Link</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {sessionLink}
                  </span>
                  <Button size="sm" variant="ghost" onClick={handleCopyLink}>
                    Copy
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <AlertCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <p className="text-xs text-green-300">
                The client has been emailed the session code. The Teams Helpdesk channel has been
                notified with full session details.
              </p>
            </div>

            <Button
              className="w-full gap-2"
              onClick={() => window.open(sessionLink, '_blank')}
            >
              <Monitor className="w-4 h-4" />
              Open Session as Technician
            </Button>
          </div>
        )}

        <DialogFooter>
          {!launched ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLaunchSession}
                disabled={initiateSession.isPending || notifyTeams.isPending}
                className="gap-2"
              >
                {initiateSession.isPending || notifyTeams.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Launch & Notify Teams
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeamsRemoteAssistanceButton;
