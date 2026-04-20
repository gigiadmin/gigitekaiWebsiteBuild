/**
 * Service Status Subscription Form Component
 * 
 * Allows users to subscribe to service status updates via email
 * Features:
 * - Select specific services to monitor
 * - Customize notification preferences
 * - One-click unsubscribe links in emails
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  { id: "Email API", label: "Email API", description: "Email delivery and management" },
  { id: "Helpdesk System", label: "Helpdesk System", description: "Ticket management and support" },
  { id: "M365 Service Health", label: "Microsoft 365 Health", description: "M365 service status updates" },
];

interface SubscriptionFormState {
  email: string;
  selectedServices: string[];
  notifyOnHealthy: boolean;
  notifyOnDegraded: boolean;
  notifyOnCritical: boolean;
  notifyOnOffline: boolean;
}

export function ServiceStatusSubscriptionForm() {
  const [formState, setFormState] = useState<SubscriptionFormState>({
    email: "",
    selectedServices: ["Email API", "Helpdesk System", "M365 Service Health"],
    notifyOnHealthy: false,
    notifyOnDegraded: true,
    notifyOnCritical: true,
    notifyOnOffline: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const subscribeMutation = trpc.serviceStatusSubscriptions.subscribe.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Successfully subscribed to service updates!");
      setTimeout(() => {
        setFormState({
          email: "",
          selectedServices: ["Email API", "Helpdesk System", "M365 Service Health"],
          notifyOnHealthy: false,
          notifyOnDegraded: true,
          notifyOnCritical: true,
          notifyOnOffline: true,
        });
        setSubmitted(false);
      }, 3000);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to subscribe. Please try again.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formState.email) {
      toast.error("Please enter your email address");
      return;
    }

    if (formState.selectedServices.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setIsSubmitting(true);
    try {
      await subscribeMutation.mutateAsync({
        email: formState.email,
        services: formState.selectedServices,
        notifyOnHealthy: formState.notifyOnHealthy,
        notifyOnDegraded: formState.notifyOnDegraded,
        notifyOnCritical: formState.notifyOnCritical,
        notifyOnOffline: formState.notifyOnOffline,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormState((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((s) => s !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  if (submitted) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-50 mb-2">Subscription Confirmed!</h3>
            <p className="text-green-100/80 text-sm">
              Check your email for a confirmation message. You'll receive status updates for the services you selected.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-cyan-50 mb-2">Get Service Status Updates</h2>
        <p className="text-gray-400">Subscribe to email notifications for service status changes</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-cyan-50 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={formState.email}
            onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-cyan-50 placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">We'll never share your email address</p>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-cyan-50 mb-3">
            <Bell className="w-4 h-4 inline mr-2" />
            Select Services to Monitor
          </label>
          <div className="space-y-3">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/30 border border-gray-800 hover:border-cyan-500/30 transition-colors"
              >
                <Checkbox
                  checked={formState.selectedServices.includes(service.id)}
                  onCheckedChange={() => toggleService(service.id)}
                  disabled={isSubmitting}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-cyan-50">{service.label}</p>
                  <p className="text-xs text-gray-400">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <label className="block text-sm font-medium text-cyan-50 mb-3">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Notification Preferences
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={formState.notifyOnHealthy}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, notifyOnHealthy: checked as boolean }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-300">Notify when service recovers (Healthy)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={formState.notifyOnDegraded}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, notifyOnDegraded: checked as boolean }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-300">Notify on service degradation</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={formState.notifyOnCritical}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, notifyOnCritical: checked as boolean }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-300">Notify on critical issues</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={formState.notifyOnOffline}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, notifyOnOffline: checked as boolean }))
                }
                disabled={isSubmitting}
              />
              <span className="text-sm text-gray-300">Notify when service goes offline</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || subscribeMutation.isPending}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black font-semibold py-2 rounded-lg transition-all"
        >
          {isSubmitting || subscribeMutation.isPending ? "Subscribing..." : "Subscribe to Updates"}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          You can unsubscribe anytime by clicking the link in any email
        </p>
      </form>
    </div>
  );
}
