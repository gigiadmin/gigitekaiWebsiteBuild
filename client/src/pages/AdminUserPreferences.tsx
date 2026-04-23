import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Mail, Bell } from "lucide-react";
import { PushNotificationSettings } from "@/components/PushNotificationSettings";
// AdminLayout is provided by AdminPreferencesPage wrapper

export default function AdminUserPreferences() {
  // Fetch all user preferences
  const { data: allPreferences, isLoading } = trpc.emailDigest.getAllUserPreferences.useQuery();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-6 h-6 text-cyan-500" />
          <h1 className="text-xl font-bold text-white">User Preferences</h1>
        </div>
        <p className="text-slate-400 text-sm">Manage your notification and email preferences</p>
      </div>

      {/* Push Notifications Settings */}
      <Card className="border-slate-700 bg-[#161B22]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5 text-cyan-500" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <PushNotificationSettings />
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-slate-700 bg-[#161B22]">
          <CardContent className="pt-6 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="text-gray-400">Loading user preferences...</span>
          </CardContent>
        </Card>
      )}

      {/* Preferences Table */}
      {!isLoading && allPreferences && allPreferences.length > 0 && (
        <Card className="border-slate-700 bg-[#161B22]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-cyan-500" />
              Active Users ({allPreferences.length})
            </CardTitle>
            <CardDescription>Overview of all user email digest settings</CardDescription>
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
      )}

      {/* Empty State */}
      {!isLoading && (!allPreferences || allPreferences.length === 0) && (
        <Card className="border-slate-700 bg-[#161B22]">
          <CardContent className="pt-6 text-center">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No User Preferences</h3>
            <p className="text-gray-400">No users have configured email digest preferences yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
