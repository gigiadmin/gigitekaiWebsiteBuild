/**
 * AdminEmailPage — Full two-way email management for the admin portal
 *
 * Features:
 *  - Compose and send emails from support@gigitekai.com via Microsoft Graph
 *  - Sync incoming replies from Exchange Online inbox
 *  - Pre-built email templates with variable substitution ({{ticketId}}, etc.)
 *  - Email history showing both sent and received messages
 *  - Link emails to helpdesk tickets
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Send,
  Inbox,
  FileText,
  AlertCircle,
  CheckCircle,
  Users,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  X,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import RecipientGroupsManager from "@/components/RecipientGroupsManager";
import { toast } from "sonner";

export default function AdminEmailPage() {
  const [tab, setTab] = useState<"compose" | "inbox" | "templates" | "groups">("inbox");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [linkedTicketId, setLinkedTicketId] = useState<number | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [inboxFilter, setInboxFilter] = useState<"all" | "sent" | "received">("all");
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const autoSyncRef = useRef(false);

  // Fetch templates
  const { data: templates = [] } = trpc.email.getTemplates.useQuery({});

  // Fetch inbox
  const { data: inbox = [], refetch: refetchInbox } = trpc.email.getInbox.useQuery({
    limit: 100,
    direction: inboxFilter,
  });

  // Send email mutation
  const sendEmailMutation = trpc.email.sendEmail.useMutation({
    onSuccess: () => {
      setRecipient("");
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setLinkedTicketId(undefined);
      refetchInbox();
      toast.success("Email sent successfully!");
    },
    onError: (err) => {
      toast.error("Failed to send email: " + err.message);
    },
  });

  // Clear ALL emails from portal DB
  const clearAllEmailsMutation = trpc.email.clearAllEmails.useMutation({
    onSuccess: (result) => {
      refetchInbox();
      toast.success(`Cleared ${result.deleted} email(s) from portal. Inbox is now empty.`);
    },
    onError: (err) => {
      toast.error("Clear failed: " + err.message);
    },
  });

  function handleClearAll() {
    if (!confirm(`Clear ALL ${inbox.length} emails from the portal?\n\nThis removes them from the portal database only. Emails already deleted from Outlook won't come back.`)) return;
    clearAllEmailsMutation.mutate();
  }

  // Delete single email mutation (portal DB + Outlook mailbox)
  const deleteMessageMutation = trpc.email.deleteMessage.useMutation({
    onSuccess: (result, variables) => {
      refetchInbox();
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(variables.id); return next; });
      if (result.deletedFromMailbox) {
        toast.success("Email deleted from portal and Outlook mailbox");
      } else if (variables.messageId) {
        toast.warning("Deleted from portal, but Outlook delete failed — it may reappear on sync");
      } else {
        toast.success("Email deleted from portal");
      }
      // Close detail modal if it was showing this email
      if (selectedEmail?.id === variables.id) setSelectedEmail(null);
    },
    onError: (err, variables) => {
      setDeletingIds((prev) => { const next = new Set(prev); next.delete(variables.id); return next; });
      toast.error("Delete failed: " + err.message);
    },
  });

  // Sync inbox mutation
  const syncInboxMutation = trpc.email.syncInbox.useMutation({
    onSuccess: (result) => {
      refetchInbox();
      const messages = [];
      if (result.synced > 0) {
        messages.push(`${result.synced} new message${result.synced !== 1 ? "s" : ""}`);
      }
      if (result.removed && result.removed > 0) {
        messages.push(`${result.removed} deleted message${result.removed !== 1 ? "s" : ""}`);
      }
      if (messages.length > 0) {
        toast.success(`Synced: ${messages.join(" • ")} from Exchange Online`);
      } else {
        toast.info("Inbox is up to date — no changes found");
      }
    },
    onError: (err) => {
      toast.error("Sync failed: " + err.message);
    },
  });

  // Auto-sync inbox on page load and every 2 minutes
  useEffect(() => {
    // Sync on first mount
    if (!autoSyncRef.current) {
      autoSyncRef.current = true;
      syncInboxMutation.mutate({ limit: 50 });
    }

    // Set up periodic sync every 2 minutes
    const interval = setInterval(() => {
      if (!isSyncing) {
        syncInboxMutation.mutate({ limit: 50 });
      }
    }, 120_000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle template selection — replace {{ticketId}} and other variables with real values
  function handleSelectTemplate(templateId: string) {
    const template = templates.find((t) => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplate(templateId);
      const ticketLabel = linkedTicketId ? String(linkedTicketId) : "";
      const resolveVars = (text: string) =>
        text
          .replace(/\{\{ticketId\}\}/gi, ticketLabel)
          .replace(/\{\{ticket_id\}\}/gi, ticketLabel)
          .replace(/\{\{recipient\}\}/gi, recipient || "Customer")
          .replace(/\{\{date\}\}/gi, new Date().toLocaleDateString());
      setSubject(resolveVars(template.subject));
      setBody(resolveVars(template.body));
    }
  }

  // Handle send email
  async function handleSendEmail() {
    if (!recipient || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSending(true);
    try {
      await sendEmailMutation.mutateAsync({
        to: recipient,
        subject,
        body,
        templateId: selectedTemplate ? parseInt(selectedTemplate) : undefined,
        linkedTicketId,
      });
    } finally {
      setIsSending(false);
    }
  }

  // Handle inbox sync
  async function handleSync() {
    setIsSyncing(true);
    try {
      await syncInboxMutation.mutateAsync({ limit: 50 });
    } finally {
      setIsSyncing(false);
    }
  }

  function handleDeleteEmail(e: React.MouseEvent, email: any) {
    e.stopPropagation(); // Don't open the detail modal
    if (!confirm(`Delete "${email.subject}"?\n\nThis will permanently remove it from the portal AND the Outlook mailbox.`)) return;
    setDeletingIds((prev) => new Set(prev).add(email.id));
    deleteMessageMutation.mutate({
      id: email.id,
      messageId: email.messageId ?? undefined,
    });
  }

  const sentCount = inbox.filter((e) => e.direction === "sent").length;
  const receivedCount = inbox.filter((e) => e.direction === "received").length;

  return (
    
    <AdminLayout title="Email Management">
      <div className="space-y-6">
        {/* Email detail modal */}
        {selectedEmail && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedEmail(null)}>
            <div
              className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">{selectedEmail.subject}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {selectedEmail.direction === "sent"
                      ? `To: ${selectedEmail.to}`
                      : `From: ${selectedEmail.from}`}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDistanceToNow(new Date(selectedEmail.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <button onClick={() => setSelectedEmail(null)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {selectedEmail.linkedTicketId && (
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
                  Linked to Ticket #{selectedEmail.linkedTicketId}
                </Badge>
              )}
              <div className="border-t border-slate-700 pt-4">
                <div
                  className="text-sm text-slate-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.bodyPreview || "(no content)" }}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setRecipient(selectedEmail.direction === "sent" ? selectedEmail.to : selectedEmail.from);
                    setSubject(`Re: ${selectedEmail.subject}`);
                    setLinkedTicketId(selectedEmail.linkedTicketId ?? undefined);
                    setSelectedEmail(null);
                    setTab("compose");
                  }}
                >
                  <Send size={14} className="mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox size={14} />
              Inbox
              {receivedCount > 0 && (
                <Badge className="ml-1 h-4 px-1 text-xs bg-cyan-500 text-black">{receivedCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail size={14} />
              Compose
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText size={14} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users size={14} />
              Groups
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                {(["all", "received", "sent"] as const).map((f) => (
                  <Button
                    key={f}
                    size="sm"
                    variant={inboxFilter === f ? "default" : "outline"}
                    onClick={() => setInboxFilter(f)}
                    className="capitalize"
                  >
                    {f === "all" ? `All (${inbox.length})` : f === "received" ? `Received (${receivedCount})` : `Sent (${sentCount})`}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                {inbox.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearAll}
                    disabled={clearAllEmailsMutation.isPending}
                    className="flex items-center gap-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Inbox"}
                </Button>
              </div>
            </div>

            {inbox.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Inbox size={40} className="text-slate-500 mb-3" />
                  <p className="text-slate-400 font-medium">No emails yet</p>
                  <p className="text-slate-500 text-sm mt-1">Click "Sync Inbox" to pull messages from Exchange Online</p>
                  <Button size="sm" className="mt-4" onClick={handleSync} disabled={isSyncing}>
                    <RefreshCw size={14} className={`mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                    Sync Now
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {inbox.map((email) => (
                  <Card
                    key={email.id}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer border ${
                      email.direction === "received" ? "border-cyan-500/20" : "border-slate-700/50"
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`mt-1 flex-shrink-0 ${email.direction === "received" ? "text-cyan-400" : "text-slate-400"}`}>
                            {email.direction === "received" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-sm font-medium text-white truncate">{email.subject}</span>
                              <Badge
                                variant={email.direction === "received" ? "default" : "outline"}
                                className={`text-xs flex-shrink-0 ${email.direction === "received" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : ""}`}
                              >
                                {email.direction === "received" ? "Received" : "Sent"}
                              </Badge>
                              {email.linkedTicketId && (
                                <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30 flex-shrink-0">
                                  Ticket #{email.linkedTicketId}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {email.direction === "sent" ? `To: ${email.to}` : `From: ${email.from}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                          </span>
                          {email.status === "sent" ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : email.status === "failed" ? (
                            <AlertCircle size={14} className="text-red-500" />
                          ) : (
                            <Eye size={14} className="text-slate-500" />
                          )}
                          <button
                            onClick={(e) => handleDeleteEmail(e, email)}
                            disabled={deletingIds.has(email.id)}
                            className="ml-1 p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                            title="Delete from portal and Outlook mailbox"
                          >
                            {deletingIds.has(email.id) ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                <CardDescription>Send an email from support@gigitekai.com via Exchange Online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className="text-sm font-medium">Recipient Email *</label>
                  <Input
                    type="email"
                    placeholder="customer@example.com"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                  />
                </div>

                {/* Linked Ticket */}
                <div>
                  <label className="text-sm font-medium">Link to Ticket (optional)</label>
                  <Input
                    type="number"
                    placeholder="Ticket ID"
                    value={linkedTicketId || ""}
                    onChange={(e) =>
                      setLinkedTicketId(e.target.value ? parseInt(e.target.value) : undefined)
                    }
                  />
                </div>

                {/* Template selector */}
                <div>
                  <label className="text-sm font-medium">Template (optional)</label>
                  <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template to pre-fill subject & body..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name} ({t.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium">Subject *</label>
                  <Input
                    placeholder="Email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium">Message *</label>
                  <Textarea
                    placeholder="Email body (supports HTML)"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={10}
                  />
                </div>

                {/* Send button */}
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !recipient || !subject || !body}
                  className="w-full"
                >
                  <Send size={14} className="mr-2" />
                  {isSending ? "Sending..." : "Send Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <FileText size={32} className="text-slate-500 mb-2" />
                  <p className="text-slate-500">No templates yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:bg-slate-800/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription>{template.category}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-slate-400">Subject:</p>
                          <p className="text-sm">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400">Body:</p>
                          <p className="text-sm line-clamp-3">{template.body}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleSelectTemplate(template.id.toString());
                            setTab("compose");
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <RecipientGroupsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
