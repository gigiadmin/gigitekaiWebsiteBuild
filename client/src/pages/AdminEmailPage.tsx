/**
 * AdminEmailPage — Email management for the admin portal
 *
 * Features:
 *  - Compose and send emails from support@gigitekai.com
 *  - Pre-built email templates
 *  - Email history and inbox view
 *  - Link emails to tickets or chat sessions
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { Mail, Send, Inbox, FileText, AlertCircle, CheckCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import RecipientGroupsManager from "@/components/RecipientGroupsManager";

export default function AdminEmailPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"compose" | "inbox" | "templates" | "groups">("compose") as any;
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [linkedTicketId, setLinkedTicketId] = useState<number | undefined>();
  const [isSending, setIsSending] = useState(false);

  // Fetch templates
  const { data: templates = [] } = trpc.email.getTemplates.useQuery({});

  // Fetch inbox
  const { data: inbox = [], refetch: refetchInbox } = trpc.email.getInbox.useQuery({
    limit: 50,
    direction: "all",
  });

  // Send email mutation
  const sendEmail = trpc.email.sendEmail.useMutation({
    onSuccess: () => {
      setRecipient("");
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setLinkedTicketId(undefined);
      refetchInbox();
    },
  });

  // Handle template selection
  function handleSelectTemplate(templateId: string) {
    const template = templates.find((t) => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplate(templateId);
      setSubject(template.subject);
      setBody(template.body);
    }
  }

  // Handle send email
  async function handleSendEmail() {
    if (!recipient || !subject || !body) {
      alert("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      await sendEmail.mutateAsync({
        to: recipient,
        subject,
        body,
        templateId: selectedTemplate ? parseInt(selectedTemplate) : undefined,
        linkedTicketId,
      });
      alert("Email sent successfully!");
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AdminLayout title="Email Management">
      <div className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Mail size={14} />
              Compose
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox size={14} />
              Inbox
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

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                <CardDescription>Send an email from support@gigitekai.com</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template selector */}
                <div>
                  <label className="text-sm font-medium">Template (optional)</label>
                  <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
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

                {/* Recipient */}
                <div>
                  <label className="text-sm font-medium">Recipient Email</label>
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
                    onChange={(e) => setLinkedTicketId(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-sm font-medium">Message</label>
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

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            {inbox.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Inbox size={32} className="text-slate-500 mb-2" />
                  <p className="text-slate-500">No emails yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {inbox.map((email) => (
                  <Card key={email.id} className="hover:bg-slate-800/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{email.subject}</span>
                            <Badge
                              variant={email.direction === "sent" ? "outline" : "default"}
                              className="text-xs"
                            >
                              {email.direction === "sent" ? "Sent" : "Received"}
                            </Badge>
                            <Badge
                              variant={email.status === "sent" ? "outline" : "secondary"}
                              className="text-xs"
                            >
                              {email.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            {email.direction === "sent" ? "To:" : "From:"} {email.direction === "sent" ? email.to : email.from}
                          </p>
                          {email.linkedTicketId && (
                            <p className="text-xs text-cyan-400">
                              Linked to Ticket #{email.linkedTicketId}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {email.status === "sent" ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : email.status === "failed" ? (
                            <AlertCircle size={16} className="text-red-500" />
                          ) : (
                            <Mail size={16} className="text-slate-500" />
                          )}
                        </div>
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
