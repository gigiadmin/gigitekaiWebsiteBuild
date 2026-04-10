import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Bell, CheckCircle } from "lucide-react";

export default function EmailDigestSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch current preferences
  const { data: preferences, isLoading } = trpc.emailDigest.getPreferences.useQuery();
  const { data: summary } = trpc.emailDigest.getDigestSummary.useQuery();

  // Mutations
  const updateMutation = trpc.emailDigest.updatePreferences.useMutation({
    onSuccess: () => {
      alert("Email digest preferences updated successfully");
      setIsSaving(false);
    },
    onError: (error) => {
      alert(error.message || "Failed to update preferences");
      setIsSaving(false);
    },
  });

  const testMutation = trpc.emailDigest.testSend.useMutation({
    onSuccess: () => {
      alert("Test digest email sent successfully");
      setIsTesting(false);
    },
    onError: (error) => {
      alert(error.message || "Failed to send test digest");
      setIsTesting(false);
    },
  });

  const handleToggleEnabled = async (enabled: boolean) => {
    setIsSaving(true);
    await updateMutation.mutateAsync({ enabled });
  };

  const handleFrequencyChange = async (frequency: "daily" | "weekly") => {
    setIsSaving(true);
    await updateMutation.mutateAsync({ frequency });
  };

  const handleTimeChange = async (time: string) => {
    setIsSaving(true);
    await updateMutation.mutateAsync({ sendTime: time });
  };

  const handleToggleInclude = async (
    field: "includeLeads" | "includeTickets" | "includeApprovals",
    value: boolean
  ) => {
    setIsSaving(true);
    await updateMutation.mutateAsync({ [field]: value });
  };

  const handleTestSend = async () => {
    setIsTesting(true);
    await testMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Digest Settings</h1>
        <p className="text-gray-400 mt-2">
          Configure your daily email digest preferences
        </p>
      </div>

      {/* Digest Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-cyan-500" />
            Digest Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Email Digest</Label>
              <p className="text-sm text-gray-400 mt-1">
                Receive daily email summaries of your account activity
              </p>
            </div>
            <Switch
              checked={preferences?.enabled ?? true}
              onCheckedChange={handleToggleEnabled}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      {preferences?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-cyan-500" />
              Digest Settings
            </CardTitle>
            <CardDescription>
              Customize when and what you receive in your digest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Frequency */}
            <div>
              <Label className="text-base mb-3 block">Frequency</Label>
              <div className="flex gap-3">
                <Button
                  variant={preferences?.frequency === "daily" ? "default" : "outline"}
                  onClick={() => handleFrequencyChange("daily")}
                  disabled={isSaving}
                >
                  Daily
                </Button>
                <Button
                  variant={preferences?.frequency === "weekly" ? "default" : "outline"}
                  onClick={() => handleFrequencyChange("weekly")}
                  disabled={isSaving}
                >
                  Weekly
                </Button>
              </div>
            </div>

            {/* Send Time */}
            <div>
              <Label htmlFor="sendTime" className="text-base mb-3 block">
                Send Time (UTC)
              </Label>
              <input
                id="sendTime"
                type="time"
                value={preferences?.sendTime ?? "06:00"}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={isSaving}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
              />
              <p className="text-sm text-gray-400 mt-2">
                Your digest will be sent daily at this time (UTC timezone)
              </p>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <Label className="text-base">Include in Digest</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Leads</p>
                  <p className="text-sm text-gray-400">
                    Include new leads from chat conversations
                  </p>
                </div>
                <Switch
                  checked={preferences?.includeLeads ?? true}
                  onCheckedChange={(value) => handleToggleInclude("includeLeads", value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Tickets</p>
                  <p className="text-sm text-gray-400">
                    Include open and in-progress support tickets
                  </p>
                </div>
                <Switch
                  checked={preferences?.includeTickets ?? true}
                  onCheckedChange={(value) => handleToggleInclude("includeTickets", value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Pending Approvals</p>
                  <p className="text-sm text-gray-400">
                    Include users awaiting approval
                  </p>
                </div>
                <Switch
                  checked={preferences?.includeApprovals ?? true}
                  onCheckedChange={(value) => handleToggleInclude("includeApprovals", value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Digest Preview */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-cyan-500" />
              Digest Preview
            </CardTitle>
            <CardDescription>
              This is what your next digest will contain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cyan-500">{summary.leadsCount}</div>
                <div className="text-sm text-gray-400">New Leads</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cyan-500">{summary.ticketsCount}</div>
                <div className="text-sm text-gray-400">Open Tickets</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cyan-500">{summary.approvalsCount}</div>
                <div className="text-sm text-gray-400">Pending Approvals</div>
              </div>
            </div>

            <Button
              onClick={handleTestSend}
              disabled={isTesting}
              className="w-full"
              variant="outline"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test Digest
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
