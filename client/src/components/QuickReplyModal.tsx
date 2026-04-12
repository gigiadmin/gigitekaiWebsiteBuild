/**
 * QuickReplyModal — Send a quick email reply from Helpdesk or Chat
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - linkedTicketId?: number (for Helpdesk)
 *  - linkedSessionId?: number (for Chat)
 *  - recipientEmail: string
 *  - recipientName?: string
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send } from "lucide-react";

interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedTicketId?: number;
  linkedSessionId?: number;
  recipientEmail: string;
  recipientName?: string;
  onSuccess?: () => void;
}

export default function QuickReplyModal({
  isOpen,
  onClose,
  linkedTicketId,
  linkedSessionId,
  recipientEmail,
  recipientName,
  onSuccess,
}: QuickReplyModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Fetch templates
  const { data: templates = [] } = trpc.email.getTemplates.useQuery({});

  // Send email mutation
  const sendEmail = trpc.email.sendEmail.useMutation({
    onSuccess: () => {
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      onSuccess?.();
      onClose();
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
    if (!subject || !body) {
      alert("Please fill in subject and body");
      return;
    }

    setIsSending(true);
    try {
      await sendEmail.mutateAsync({
        to: recipientEmail,
        subject,
        body,
        templateId: selectedTemplate ? parseInt(selectedTemplate) : undefined,
        linkedTicketId,
        linkedSessionId,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail size={18} />
            Quick Reply
          </DialogTitle>
          <DialogDescription>
            Send an email to {recipientName || recipientEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template selector */}
          {templates.length > 0 && (
            <div>
              <label className="text-sm font-medium">Template (optional)</label>
              <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              rows={6}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !subject || !body}
            >
              <Send size={14} className="mr-2" />
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
