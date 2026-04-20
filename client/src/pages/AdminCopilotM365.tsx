import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, Mail, Calendar, FileText, BarChart3, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminCopilotM365() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  // Org stats
  const { data: orgStatsData, isLoading: loadingOrgStats } = trpc.copilotM365.getOrgStats.useQuery();

  // List users
  const { data: usersData, isLoading: loadingUsers } = trpc.copilotM365.listUsers.useQuery();

  // User-specific queries (only run when email is selected)
  const { data: calendarData, isLoading: loadingCalendar } = trpc.copilotM365.getUserCalendar.useQuery(
    { userEmail: selectedUserEmail },
    { enabled: !!selectedUserEmail }
  );

  const { data: emailsData, isLoading: loadingEmails } = trpc.copilotM365.getUserEmails.useQuery(
    { userEmail: selectedUserEmail },
    { enabled: !!selectedUserEmail }
  );

  const { data: filesData, isLoading: loadingFiles } = trpc.copilotM365.getUserFiles.useQuery(
    { userEmail: selectedUserEmail },
    { enabled: !!selectedUserEmail }
  );

  const { data: activityData, isLoading: loadingActivity } = trpc.copilotM365.analyzeUserActivity.useQuery(
    { userEmail: selectedUserEmail },
    { enabled: !!selectedUserEmail }
  );

  const stats = orgStatsData?.stats;
  const users = usersData?.users || [];

  const filteredUsers = users.filter((user) =>
    user.userPrincipalName.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Copilot M365 Intelligence</h1>
          <p className="text-slate-400">Analyze Microsoft 365 usage, user activity, and organizational insights</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="text-slate-300">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-slate-300">
              Users
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-slate-300">
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-slate-300">
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loadingOrgStats ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-500">{stats.totalUsers}</div>
                    <p className="text-xs text-slate-500 mt-1">Licensed users</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-500">{stats.activeUsers}</div>
                    <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Teams Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-500">{stats.teamsUsage}</div>
                    <p className="text-xs text-slate-500 mt-1">Active users</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">Exchange Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-500">{stats.exchangeUsage}</div>
                    <p className="text-xs text-slate-500 mt-1">Active mailboxes</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-300">SharePoint Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-500">{stats.sharepointUsage}</div>
                    <p className="text-xs text-slate-500 mt-1">Active users</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertCircle className="h-5 w-5" />
                    <p>Unable to fetch organization stats</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">M365 Users</CardTitle>
                <CardDescription>Select a user to view their activity and insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <Button
                        key={user.id}
                        onClick={() => setSelectedUserEmail(user.userPrincipalName)}
                        variant={selectedUserEmail === user.userPrincipalName ? "default" : "outline"}
                        className={`justify-start text-left h-auto py-2 px-3 ${
                          selectedUserEmail === user.userPrincipalName
                            ? "bg-cyan-600 hover:bg-cyan-700"
                            : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        }`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        <div>
                          <div className="font-medium">{user.displayName}</div>
                          <div className="text-xs opacity-75">{user.userPrincipalName}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {!selectedUserEmail ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-slate-400">Select a user from the Users tab to view their activity</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Calendar */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Calendar Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCalendar ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                      </div>
                    ) : calendarData?.events ? (
                      <div className="space-y-2">
                        {calendarData.events.slice(0, 5).map((event) => (
                          <div key={event.id} className="p-3 bg-slate-700 rounded border border-slate-600">
                            <p className="font-medium text-white">{event.subject}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(event.start.dateTime).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {event.attendees.length} attendees
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No calendar events found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Emails */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="h-5 w-5 text-purple-500" />
                      Recent Emails
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingEmails ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                      </div>
                    ) : emailsData?.emails ? (
                      <div className="space-y-2">
                        {emailsData.emails.slice(0, 5).map((email) => (
                          <div key={email.id} className="p-3 bg-slate-700 rounded border border-slate-600">
                            <p className="font-medium text-white">{email.subject}</p>
                            <p className="text-sm text-slate-400">{email.from.emailAddress.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{email.bodyPreview}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No emails found</p>
                    )}
                  </CardContent>
                </Card>

                {/* Files */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-orange-500" />
                      Recent Files
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingFiles ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                      </div>
                    ) : filesData?.files ? (
                      <div className="space-y-2">
                        {filesData.files.slice(0, 5).map((file) => (
                          <div key={file.id} className="p-3 bg-slate-700 rounded border border-slate-600">
                            <p className="font-medium text-white">{file.name}</p>
                            <p className="text-sm text-slate-400">
                              {(file.size / 1024 / 1024).toFixed(2)}MB • Modified{" "}
                              {new Date(file.lastModifiedDateTime).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400">No files found</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {!selectedUserEmail ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-slate-400">Select a user from the Users tab to view their insights</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-cyan-500" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingActivity ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
                    </div>
                  ) : activityData?.analysis ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-white mb-2">Summary</h3>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{activityData.analysis.summary}</p>
                      </div>

                      <div>
                        <h3 className="font-semibold text-white mb-2">Key Insights</h3>
                        <ul className="space-y-2">
                          {activityData.analysis.insights.map((insight, i) => (
                            <li key={i} className="flex gap-2 text-slate-300 text-sm">
                              <span className="text-cyan-500 font-bold">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-white mb-2">Recommendations</h3>
                        <ul className="space-y-2">
                          {activityData.analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-2 text-slate-300 text-sm">
                              <span className="text-green-500 font-bold">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400">Unable to generate insights</p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  
    </AdminLayout>);
}
