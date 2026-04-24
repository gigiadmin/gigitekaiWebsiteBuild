import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminClientOnboarding() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyEmail: "",
    contactFirstName: "",
    contactLastName: "",
    contactEmail: "",
    contactPhone: "",
    serviceType: "",
    annualValue: 0,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const mutation = trpc.clientOnboarding.startOnboarding.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(`✅ ${data.message}`);
      setFormData({
        companyName: "",
        companyEmail: "",
        contactFirstName: "",
        contactLastName: "",
        contactEmail: "",
        contactPhone: "",
        serviceType: "",
        annualValue: 0,
      });
      // Reset after 5 seconds
      setTimeout(() => setStatus("idle"), 5000);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(`❌ Error: ${error.message}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "annualValue" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    // Validate form
    if (
      !formData.companyName ||
      !formData.companyEmail ||
      !formData.contactFirstName ||
      !formData.contactLastName ||
      !formData.contactEmail ||
      !formData.contactPhone ||
      !formData.serviceType
    ) {
      setStatus("error");
      setMessage("❌ Please fill in all required fields");
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Client Onboarding Workflow</CardTitle>
            <CardDescription>
              Automate the complete client onboarding process including HubSpot, Microsoft 365, Teams, and calendar setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status !== "idle" && (
              <Alert className={status === "success" ? "mb-6 border-green-500 bg-green-50" : "mb-6 border-red-500 bg-red-50"}>
                <AlertCircle className={status === "success" ? "text-green-600" : "text-red-600"} />
                <AlertDescription className={status === "success" ? "text-green-800" : "text-red-800"}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Acme Corp"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="companyEmail">Company Email Domain *</Label>
                    <Input
                      id="companyEmail"
                      name="companyEmail"
                      value={formData.companyEmail}
                      onChange={handleChange}
                      placeholder="acme.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceType">Service Type *</Label>
                    <Input
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleChange}
                      placeholder="e.g., M365/Helpdesk/Security/Backup"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="annualValue">Annual Contract Value ($) *</Label>
                    <Input
                      id="annualValue"
                      name="annualValue"
                      type="number"
                      value={formData.annualValue || ""}
                      onChange={handleChange}
                      placeholder="50000"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Primary Contact</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactFirstName">First Name *</Label>
                    <Input
                      id="contactFirstName"
                      name="contactFirstName"
                      value={formData.contactFirstName}
                      onChange={handleChange}
                      placeholder="John"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactLastName">Last Name *</Label>
                    <Input
                      id="contactLastName"
                      name="contactLastName"
                      value={formData.contactLastName}
                      onChange={handleChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Email *</Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="john@acme.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Phone *</Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      placeholder="555-1234"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* What Gets Created */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">✨ What Gets Automated:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ HubSpot company and contact creation</li>
                  <li>✓ Outlook calendar kickoff meeting (2 days from now)</li>
                  <li>✓ Welcome email sent to contact</li>
                  <li>✓ Teams notification to onboarding team</li>
                  <li>✓ Owner notification in Manus</li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full"
                size="lg"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Onboarding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Start Client Onboarding
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
