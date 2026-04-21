import AdminLayout from "@/components/AdminLayout";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Users, Shield, ShieldOff, Search, UserCheck, UserX, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading, refetch } = trpc.users.getAll.useQuery();

  const approveMutation = trpc.users.approve.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = trpc.users.revoke.useMutation({
    onSuccess: () => {
      toast.success("User access revoked");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = users?.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      
    <AdminLayout>u.email?.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q)
    
    </AdminLayout>);
  }) ?? [];

  const totalUsers = users?.length ?? 0;
  const approvedUsers = users?.filter((u) => u.approved).length ?? 0;
  const pendingUsers = totalUsers - approvedUsers;

  return (
    <AdminLayoutWithSidebar currentPage="users">
      <div className="p-6 bg-[#0A0E1A] min-h-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00D4FF]/10 rounded-xl flex items-center justify-center border border-[#00D4FF]/20">
              <Users className="w-5 h-5 text-[#00D4FF]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Space_Grotesk']">Users</h1>
              <p className="text-gray-500 text-sm">Manage portal access &amp; permissions</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-lg text-[#00D4FF] text-sm hover:bg-[#00D4FF]/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: totalUsers, color: "text-[#00D4FF]" },
            { icon: UserCheck, label: "Approved", value: approvedUsers, color: "text-green-400" },
            { icon: UserX, label: "Pending", value: pendingUsers, color: "text-yellow-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0F1419] border border-gray-800/40 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-gray-400 text-sm">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold font-['Space_Grotesk'] ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0F1419] border border-gray-800/40 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/50"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0F1419] border border-gray-800/40 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800/40 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00D4FF]" />
            <h3 className="text-white font-medium text-sm">All Users</h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 text-[#00D4FF] animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading users...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/40">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white text-sm font-medium">{user.name || "—"}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20"
                            : "bg-gray-800/50 text-gray-400 border border-gray-700/40"
                        }`}>
                          {user.role === "admin" ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          user.approved
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {user.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-500 text-xs">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!user.approved ? (
                            <button
                              onClick={() => approveMutation.mutate({ userId: user.id })}
                              disabled={approveMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded text-green-400 text-xs hover:bg-green-500/20 transition-all disabled:opacity-50"
                            >
                              <UserCheck className="w-3 h-3" />
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => revokeMutation.mutate({ userId: user.id })}
                              disabled={revokeMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              <ShieldOff className="w-3 h-3" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayoutWithSidebar>
  );
}
