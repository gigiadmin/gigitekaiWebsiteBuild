import { useEffect, useState } from "react";
import { useSearchParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [inviteStatus, setInviteStatus] = useState<"loading" | "valid" | "invalid" | "accepted">("loading");
  const [inviteData, setInviteData] = useState<any>(null);

  const token = searchParams.get("token") || "";

  const acceptInviteMutation = trpc.customerInvites.acceptCustomerInvite.useMutation();

  // Query to get invite details
  const getInviteQuery = trpc.customerInvites.getCustomerInvite.useQuery(
    { token },
    { enabled: !!token }
  );

  useEffect(() => {
    if (!token) {
      setInviteStatus("invalid");
      return;
    }

    if (getInviteQuery.isLoading) {
      setInviteStatus("loading");
    } else if (getInviteQuery.data?.success && getInviteQuery.data?.invite) {
      setInviteData(getInviteQuery.data.invite);
      setInviteStatus("valid");
    } else {
      setInviteStatus("invalid");
    }
  }, [token, getInviteQuery.isLoading, getInviteQuery.data]);

  const handleAcceptInvite = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please log in first to accept the invite");
      window.location.href = getLoginUrl();
      return;
    }

    try {
      const result = await acceptInviteMutation.mutateAsync({ token });
      if (result.success) {
        setInviteStatus("accepted");
        toast.success("Invite accepted! Redirecting to support portal...");
        setTimeout(() => {
          window.location.href = "/helpdesk";
        }, 2000);
      } else {
        toast.error(result.message || "Failed to accept invite");
        setInviteStatus("invalid");
      }
    } catch (error) {
      console.error("Failed to accept invite:", error);
      toast.error("Failed to accept invite. Please try again.");
      setInviteStatus("invalid");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {inviteStatus === "loading" && (
          <Card className="bg-card border-border p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300">Verifying your invite...</p>
          </Card>
        )}

        {/* Valid Invite */}
        {inviteStatus === "valid" && (
          <Card className="bg-card border-border p-8">
            <div className="text-center mb-6">
              <Mail className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
              <p className="text-gray-400">
                You've been invited to access the GigitekAI Support Portal
              </p>
            </div>

            {inviteData && (
              <div className="bg-background/50 border border-border rounded-lg p-4 mb-6 space-y-2">
                {inviteData.invitedName && (
                  <p className="text-sm">
                    <span className="text-gray-400">Name:</span> <span className="text-white">{inviteData.invitedName}</span>
                  </p>
                )}
                {inviteData.invitedCompany && (
                  <p className="text-sm">
                    <span className="text-gray-400">Company:</span> <span className="text-white">{inviteData.invitedCompany}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-gray-400">Email:</span> <span className="text-white">{inviteData.invitedEmail}</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              {isAuthenticated ? (
                <Button
                  onClick={handleAcceptInvite}
                  disabled={acceptInviteMutation.isPending}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                >
                  {acceptInviteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    "Accept Invite"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => { window.location.href = getLoginUrl(); }}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
                >
                  Sign In to Accept
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/"; }}
                className="w-full border-border hover:bg-background/50"
              >
                Back to Home
              </Button>
            </div>
          </Card>
        )}

        {/* Invalid/Expired Invite */}
        {inviteStatus === "invalid" && (
          <Card className="bg-card border-border p-8">
            <div className="text-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Invite Not Found</h1>
              <p className="text-gray-400">
                This invite is invalid or has expired. Please contact support@gigitekai.com for assistance.
              </p>
            </div>

            <Button
              onClick={() => { window.location.href = "/"; }}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-medium"
            >
              Back to Home
            </Button>
          </Card>
        )}

        {/* Accepted */}
        {inviteStatus === "accepted" && (
          <Card className="bg-card border-border p-8">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Invite Accepted!</h1>
              <p className="text-gray-400 mb-6">
                Redirecting to the support portal...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
