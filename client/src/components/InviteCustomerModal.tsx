import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, Mail, User, Building2 } from "lucide-react";

interface InviteCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteCustomerModal({ isOpen, onClose, onSuccess }: InviteCustomerModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendInviteMutation = trpc.customerInvites.sendCustomerInvite.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendInviteMutation.mutateAsync({
        invitedEmail: email.trim(),
        invitedName: name.trim() || undefined,
        invitedCompany: company.trim() || undefined,
      });

      if (result.success) {
        toast.success("Invite sent successfully!");
        setEmail("");
        setName("");
        setCompany("");
        onClose();
        onSuccess?.();
      } else {
        toast.error(result.message || "Failed to send invite");
      }
    } catch (error) {
      console.error("Failed to send invite:", error);
      toast.error("Failed to send invite. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-400" />
            Invite Customer to Support Portal
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a customer to access the GigitekAI support portal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-cyan-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-background border-border focus:border-cyan-400"
                required
              />
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-gray-500">(optional)</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-cyan-400 pointer-events-none" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-background border-border focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Company Field */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Company <span className="text-gray-500">(optional)</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 w-4 h-4 text-cyan-400 pointer-events-none" />
              <Input
                id="company"
                type="text"
                placeholder="Acme Corporation"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isLoading}
                className="pl-10 bg-background border-border focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-lg p-3 text-sm text-gray-300">
            <p className="font-medium text-cyan-400 mb-1">What happens next?</p>
            <ul className="space-y-1 text-xs">
              <li>• An invitation email will be sent to the customer</li>
              <li>• The invite link expires in 7 days</li>
              <li>• Customer can accept the invite and access the support portal</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-border hover:bg-background/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
