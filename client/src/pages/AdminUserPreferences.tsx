import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

export default function AdminUserPreferences() {
  const { user, logout } = useAuth();
  
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-900">
          <CardContent className="pt-6 text-center">
            <div className="text-cyan-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-gray-400 mb-6">You must be an admin to manage user preferences.</p>
            <Button 
              onClick={() => logout()}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out & Try Another Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch all user preferences
  const { data: allPreferences, isLoading } = trpc.emailDigest.getAllUserPreferences.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-cyan-500" />
              <h1 className="text-3xl font-bold text-white">User Email Preferences</h1>
            </div>
            <Button 
              onClick={() => logout()}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <p className="text-gray-400">
            Manage email digest preferences for all users
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="border-slate-700 bg-slate-900">
            <CardContent className="pt-6 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
              <span className="text-gray-400">Loading user preferences...</span>
            </CardContent>
          </Card>
        )}

        {/* Preferences Table */}
        {!isLoading && allPreferences && allPreferences.length > 0 && (
          <div className="space-y-4">
            <Card className="border-slate-700 bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-cyan-500" />
                  Active Users ({allPreferences.length})
                </CardTitle>
                <CardDescription>
                  Overview of all user email digest settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Enabled</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Frequency</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Send Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Leads</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Tickets</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Approvals</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-300">Last Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allPreferences.map((pref) => (
                        <tr key={pref.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white">{pref.userName || "Unknown"}</td>
                          <td className="py-3 px-4 text-gray-400">{pref.userEmail}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block w-3 h-3 rounded-full ${pref.enabled ? "bg-green-500" : "bg-gray-500"}`}></span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            <span className="px-2 py-1 bg-slate-800 rounded text-xs font-medium text-cyan-400">
                              {pref.frequency}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">{pref.sendTime}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block w-3 h-3 rounded-full ${pref.includeLeads ? "bg-blue-500" : "bg-gray-600"}`}></span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block w-3 h-3 rounded-full ${pref.includeTickets ? "bg-blue-500" : "bg-gray-600"}`}></span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block w-3 h-3 rounded-full ${pref.includeApprovals ? "bg-blue-500" : "bg-gray-600"}`}></span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-xs">
                            {pref.lastSentAt ? new Date(pref.lastSentAt).toLocaleDateString() : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!allPreferences || allPreferences.length === 0) && (
          <Card className="border-slate-700 bg-slate-900">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No User Preferences</h3>
              <p className="text-gray-400">No users have configured email digest preferences yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
