/**
 * Support Services Ticket - Remote Assistance Integration
 * Launch remote assistance sessions directly from support tickets
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Monitor, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TicketRemoteAssistanceButtonProps {
  ticketId: number;
  clientEmail: string;
  clientName: string;
  ticketTitle: string;
  ticketDescription: string;
}

/**
 * Remote Assistance Session Initiator for Tickets
 */
export const TicketRemoteAssistanceButton: React.FC<TicketRemoteAssistanceButtonProps> = ({
  ticketId,
  clientEmail,
  clientName,
  ticketTitle,
  ticketDescription,
}) => {
  const [open, setOpen] = useState(false);
  const [sessionType, setSessionType] = useState<'screen_share_only' | 'remote_control' | 'collaborative'>(
    'screen_share_only'
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'creating' | 'success' | 'error'>(
    'idle'
  );
  const [sessionLink, setSessionLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // tRPC mutation to create remote assistance session
  const createSessionMutation = trpc.remoteAssistance.initiateSession.useMutation({
    onSuccess: (data: any) => {
      setSessionStatus('success');
      const link = `${window.location.origin}/remote-assistance/${data.sessionId}?token=${data.sessionToken}`;
      setSessionLink(link);
      setIsLoading(false);

      // Auto-copy link to clipboard
      if (link) {
        navigator.clipboard.writeText(link);
      }
    },
    onError: (error) => {
      setSessionStatus('error');
      setErrorMessage(error.message || 'Failed to create remote assistance session');
      setIsLoading(false);
    },
  });

  const handleInitiateSession = async () => {
    setIsLoading(true);
    setSessionStatus('creating');
    setErrorMessage('');

    try {
      await createSessionMutation.mutateAsync({
        clientUserId: 0,
        clientEmail,
        sessionType: sessionType as any,
        allowRemoteControl: sessionType !== 'screen_share_only',
        notes: notes || `Ticket: ${ticketTitle}`,
        issueDescription: ticketDescription,
      } as any);
    } catch (error) {
      console.error('Failed to initiate session:', error);
    }
  };

  const handleCopyLink = () => {
    if (sessionLink) {
      navigator.clipboard.writeText(sessionLink);
      alert('Session link copied to clipboard!');
    }
  };

  const handleSendToClient = async () => {
    if (sessionLink) {
      // Send email to client with session link
      try {
        // Email sending would be handled by backend
        // For now, just copy link and show message
        alert(`Session link: ${sessionLink}\n\nSend this link to ${clientEmail}`);
      } catch (error) {
        console.error('Failed to send invite:', error);
        alert('Failed to send invite. Please send manually.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="gap-2 bg-cyan-600 hover:bg-cyan-700"
        >
          <Monitor className="w-4 h-4" />
          Start Remote Session
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Initiate Remote Assistance</DialogTitle>
          <DialogDescription>
            Start a remote assistance session with {clientName} for ticket #{ticketId}
          </DialogDescription>
        </DialogHeader>

        {sessionStatus === 'idle' || sessionStatus === 'creating' ? (
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Client</Label>
                <p className="font-semibold">{clientName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-mono text-sm">{clientEmail}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Ticket</Label>
                <p className="text-sm">{ticketTitle}</p>
              </div>
            </div>

            {/* Session Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <Select value={sessionType} onValueChange={(value: any) => setSessionType(value)}>
                <SelectTrigger id="session-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="screen_share_only">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Screen Share Only
                    </div>
                  </SelectItem>
                  <SelectItem value="remote_control">Remote Control</SelectItem>
                  <SelectItem value="collaborative">Collaborative (Both Control)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {sessionType === 'screen_share_only' && 'Client can see your screen but cannot control'}
                {sessionType === 'remote_control' && 'You can control the client\'s computer'}
                {sessionType === 'collaborative' && 'Both you and client can control the session'}
              </p>
            </div>

            {/* Session Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Session Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this session..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInitiateSession}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Creating Session...' : 'Create Session'}
              </Button>
            </div>
          </div>
        ) : sessionStatus === 'success' ? (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Remote assistance session created successfully!
              </AlertDescription>
            </Alert>

            {/* Session Link */}
            <div className="space-y-2">
              <Label>Session Link</Label>
              <div className="flex gap-2">
                <Input
                  value={sessionLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Link copied to clipboard. Share with client or send via email.
              </p>
            </div>

            {/* Send to Client */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 mb-3">
                Send session invite to {clientName}?
              </p>
              <Button
                size="sm"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={handleSendToClient}
              >
                Send Invite Email
              </Button>
            </div>

            {/* Close Dialog */}
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                setSessionStatus('idle');
                setSessionLink('');
              }}
            >
              Done
            </Button>
          </div>
        ) : sessionStatus === 'error' ? (
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setSessionStatus('idle');
                  setErrorMessage('');
                }}
              >
                Close
              </Button>
              <Button
                onClick={handleInitiateSession}
                className="gap-2"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default TicketRemoteAssistanceButton;
