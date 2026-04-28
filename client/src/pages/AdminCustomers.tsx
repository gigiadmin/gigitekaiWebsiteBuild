// AdminLayout is provided by AdminInvitesPage wrapper
/**
 * AdminCustomers — Customer Accounts & Invites management
 * Uses AdminLayout — no standalone page wrapper needed
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send, UserPlus, Building2, Mail, Trash2, CheckCircle, Clock, XCircle, Loader2, RefreshCw } from "lucide-react";

export default function AdminCustomers() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", company: "" });

  const { data, isLoading, refetch } = trpc.customerInvites.listCustomerInvites.useQuery();
  const sendInvite = trpc.customerInvites.sendCustomerInvite.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        if ((res as any).emailDelivered === false) {
          toast.warning(res.message || "Invite created but email delivery failed — use Resend to retry");
        } else {
          toast.success("Invite sent successfully");
        }
        setInviteOpen(false);
        setForm({ email: "", name: "", company: "" });
        refetch();
      } else {
        toast.error(res.message || "Failed to send invite");
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const resendInvite = trpc.customerInvites.resendCustomerInvite.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Invite resent successfully");
        refetch();
      } else {
        toast.error(res.message || "Failed to resend invite");
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeInvite = trpc.customerInvites.revokeCustomerInvite.useMutation({
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Invite revoked");
        refetch();
      } else {
        toast.error(res.message);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const invites = data?.invites ?? [];

  const statusBadge = (status: string) => {
    if (status === "accepted") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Accepted</Badge>;
    if (status === "revoked") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Revoked</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending</Badge>;
  };

  return (
    
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Customer Accounts</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage customer portal access and invitations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={() => refetch()} aria-label="Refresh customer list">
              <RefreshCw size={15} />
            </Button>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black gap-2 h-9">
                  <UserPlus size={15} />
                  Send Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#161B22] border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Invite Customer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-slate-300 text-sm">Email *</Label>
                    <Input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="customer@company.com"
                      className="mt-1.5 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="John Smith"
                      className="mt-1.5 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Company</Label>
                    <Input
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Acme Corp"
                      className="mt-1.5 bg-slate-800 border-slate-600 text-white"
                    />
                  </div>
                  <Button
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black"
                    disabled={!form.email || sendInvite.isPending}
                    onClick={() => sendInvite.mutate({ invitedEmail: form.email, invitedName: form.name, invitedCompany: form.company })}
                  >
                    {sendInvite.isPending ? <Loader2 size={15} className="animate-spin mr-2" /> : <Send size={15} className="mr-2" />}
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Invites", value: invites.length, icon: <Mail size={16} />, color: "text-cyan-400" },
            { label: "Accepted", value: invites.filter((i: any) => i.status === "accepted").length, icon: <CheckCircle size={16} />, color: "text-emerald-400" },
            { label: "Pending", value: invites.filter((i: any) => i.status === "pending").length, icon: <Clock size={16} />, color: "text-amber-400" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#161B22] border-slate-700/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`${stat.color}`}>{stat.icon}</div>
                <div>
                  <div className="text-white font-semibold text-lg">{stat.value}</div>
                  <div className="text-slate-400 text-xs">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Invites table */}
      <Card className="bg-[#161B22] border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base">Customer Invitations</CardTitle>
            <CardDescription className="text-slate-400 text-sm">All customer portal invitations and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-cyan-400" size={24} />
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-12">
                <Building2 size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No customer invites yet</p>
                <p className="text-slate-500 text-xs mt-1">Send your first invite to get started</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Customer</th>
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Company</th>
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Status</th>
                      <th className="text-left text-slate-400 font-medium pb-3 pr-4">Sent</th>
                      <th className="text-left text-slate-400 font-medium pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {invites.map((invite: any) => (
                      <tr key={invite.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="text-white font-medium">{invite.invitedName || "—"}</div>
                          <div className="text-slate-400 text-xs">{invite.invitedEmail}</div>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{invite.invitedCompany || "—"}</td>
                        <td className="py-3 pr-4">{statusBadge(invite.status)}</td>
                        <td className="py-3 pr-4 text-slate-400 text-xs">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          {invite.status === "pending" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                                onClick={() => resendInvite.mutate({ inviteId: invite.id })}
                                disabled={resendInvite.isPending}
                                title="Resend invite email"
                              >
                                <Send size={13} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => revokeInvite.mutate({ inviteId: invite.id })}
                                disabled={revokeInvite.isPending}
                                title="Revoke invite"
                              >
                                <XCircle size={14} />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
      </Card>
    </div>
  );
}
