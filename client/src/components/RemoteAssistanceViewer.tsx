/**
 * Enterprise Remote Assistance Viewer
 * Real-time screen sharing, remote control, and collaboration
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Mouse,
  FileUp,
  MessageSquare,
  Settings,
  X,
  Pause,
  Play,
  Phone,
  Share2,
  Lock,
  Activity,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface RemoteAssistanceViewerProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Main Remote Assistance Viewer Component
 */
export const RemoteAssistanceViewer: React.FC<RemoteAssistanceViewerProps> = ({
  sessionId,
  isOpen,
  onClose,
}) => {
  const [isRemoteControlActive, setIsRemoteControlActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'connecting' | 'active' | 'paused' | 'ended'>(
    'connecting'
  );
  const [messages, setMessages] = useState<Array<{ id: string; sender: string; text: string }>>(
    []
  );
  const [inputMessage, setInputMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: sessionDetails } = trpc.remoteAssistance.getSessionDetails.useQuery({
    sessionId,
  });

  const sendMessageMutation = trpc.remoteAssistance.sendChatMessage.useMutation();
  const endSessionMutation = trpc.remoteAssistance.endSession.useMutation();

  // Handle sending chat messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        sessionId,
        message: inputMessage,
        messageType: 'text',
      });

      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          sender: 'You',
          text: inputMessage,
        },
      ]);

      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Handle ending session
  const handleEndSession = async () => {
    try {
      await endSessionMutation.mutateAsync({
        sessionId,
        issueResolved: true,
      });
      onClose();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  // Toggle remote control
  const handleToggleRemoteControl = () => {
    setIsRemoteControlActive(!isRemoteControlActive);
  };

  // Pause/Resume session
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    setSessionStatus(isPaused ? 'active' : 'paused');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-screen max-h-screen flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Remote Assistance Session
            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
              sessionStatus === 'active'
                ? 'bg-green-100 text-green-800'
                : sessionStatus === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {sessionStatus.toUpperCase()}
            </span>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Main Screen Sharing Area */}
          <div className="flex-1 flex flex-col gap-2">
            {/* Screen Canvas */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden border-2 border-border relative">
              <canvas
                ref={canvasRef}
                className={`w-full h-full cursor-${isRemoteControlActive ? 'pointer' : 'default'}`}
              />

              {/* Session Status Overlay */}
              {sessionStatus === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <Activity className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-2" />
                    <p className="text-white">Connecting to remote session...</p>
                  </div>
                </div>
              )}

              {sessionStatus === 'paused' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-center">
                    <Pause className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white">Session Paused</p>
                  </div>
                </div>
              )}

              {/* Remote Control Indicator */}
              {isRemoteControlActive && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Mouse className="w-3 h-3" />
                  Remote Control Active
                </div>
              )}
            </div>

            {/* Control Toolbar */}
            <div className="flex gap-2 bg-muted p-3 rounded-lg">
              <Button
                variant={isRemoteControlActive ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleRemoteControl}
                className="gap-2"
              >
                <Mouse className="w-4 h-4" />
                {isRemoteControlActive ? 'Disable Control' : 'Enable Control'}
              </Button>

              <Button
                variant={isPaused ? 'default' : 'outline'}
                size="sm"
                onClick={handleTogglePause}
                className="gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <FileUp className="w-4 h-4" />
                Send File
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigator.clipboard.writeText(sessionId)}
              >
                <Share2 className="w-4 h-4" />
                Copy Session ID
              </Button>

              <div className="flex-1" />

              <Button
                variant="destructive"
                size="sm"
                onClick={handleEndSession}
                className="gap-2"
              >
                <Phone className="w-4 h-4" />
                End Session
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Chat & Info */}
          <div className="w-80 flex flex-col gap-2 border-l border-border pl-4">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-2 bg-muted rounded">
                  {messages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No messages yet. Start typing to communicate with the client.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="text-xs">
                        <p className="font-semibold text-cyan-600">{msg.sender}</p>
                        <p className="text-foreground break-words">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                </div>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="flex-1 overflow-y-auto">
                <div className="space-y-3 text-xs">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Session Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-muted-foreground">Session ID</p>
                        <p className="font-mono text-xs break-all">{sessionId}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="capitalize">{sessionStatus}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Participants</p>
                        <p>{sessionDetails?.participants?.length || 0}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Latency:</span>
                        <span className="font-semibold">45ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bandwidth:</span>
                        <span className="font-semibold">2.5 Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FPS:</span>
                        <span className="font-semibold">30</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="flex-1 overflow-y-auto">
                <div className="space-y-3 text-xs">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-3 h-3" />
                        <span>Encryption Enabled</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-3 h-3" />
                        <span>Record Session</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="w-3 h-3" />
                        <span>Allow File Transfer</span>
                      </label>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Display</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-3 h-3" />
                        <span>Show Cursor</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="w-3 h-3" />
                        <span>Show Notifications</span>
                      </label>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Session Initiation Component
 */
export const RemoteAssistanceInitiator: React.FC<{ ticketId?: number }> = ({ ticketId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [sessionType, setSessionType] = useState<'screen_share_only' | 'remote_control'>(
    'screen_share_only'
  );
  const [allowRemoteControl, setAllowRemoteControl] = useState(false);
  const [allowRecording, setAllowRecording] = useState(true);

  const initiateSessionMutation = trpc.remoteAssistance.initiateSession.useMutation();

  const handleInitiate = async () => {
    try {
      const result = await initiateSessionMutation.mutateAsync({
        clientUserId: 0, // Will be populated from email lookup
        clientEmail,
        sessionType,
        allowRemoteControl,
        allowRecording,
        ticketId,
      });

      // Show success and copy session ID
      alert(`Session created! ID: ${result.sessionId}`);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to initiate session:', error);
      alert('Failed to create remote assistance session');
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Monitor className="w-4 h-4" />
        Start Remote Session
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Remote Assistance Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client Email</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Session Type</label>
              <select
                value={sessionType}
                onChange={(e) =>
                  setSessionType(e.target.value as 'screen_share_only' | 'remote_control')
                }
                className="w-full px-3 py-2 border border-border rounded mt-1"
              >
                <option value="screen_share_only">Screen Share Only</option>
                <option value="remote_control">Remote Control</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowRemoteControl}
                onChange={(e) => setAllowRemoteControl(e.target.checked)}
              />
              <span className="text-sm">Allow Remote Control</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowRecording}
                onChange={(e) => setAllowRecording(e.target.checked)}
              />
              <span className="text-sm">Record Session</span>
            </label>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleInitiate}
                disabled={!clientEmail || initiateSessionMutation.isPending}
              >
                {initiateSessionMutation.isPending ? 'Creating...' : 'Create Session'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RemoteAssistanceViewer;
