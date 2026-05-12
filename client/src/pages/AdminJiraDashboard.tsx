import { useState, useEffect } from "react";
import { AdminLayoutWithSidebar } from "@/components/AdminLayoutWithSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  AlertCircle,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls?: {
    "48x48"?: string;
  };
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    priority?: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
  };
}

export default function AdminJiraDashboard() {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/jira/projects");
        if (!response.ok) throw new Error("Failed to fetch projects");
        const data = await response.json();
        setProjects(data);
        if (data.length > 0) {
          setSelectedProject(data[0].key);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch issues when project changes
  useEffect(() => {
    if (!selectedProject) return;

    const fetchIssues = async () => {
      try {
        setLoading(true);
        const jql = `project = "${selectedProject}"${
          searchQuery ? ` AND text ~ "${searchQuery}"` : ""
        }`;
        const response = await fetch(
          `/api/jira/issues?jql=${encodeURIComponent(jql)}`
        );
        if (!response.ok) throw new Error("Failed to fetch issues");
        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [selectedProject, searchQuery]);

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("done") || statusLower.includes("closed"))
      return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (statusLower.includes("progress"))
      return <Clock className="w-4 h-4 text-blue-400" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "text-gray-400";
    const p = priority.toLowerCase();
    if (p.includes("highest") || p.includes("critical"))
      return "text-red-400";
    if (p.includes("high")) return "text-orange-400";
    if (p.includes("medium")) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <AdminLayoutWithSidebar currentPage="jira">
      <div className="p-6 space-y-6 bg-[#0A0E1A] min-h-screen">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <span className="text-[#00D4FF]">⚙️</span> Jira Dashboard
          </h1>
          <p className="text-gray-400">
            View and manage your Jira projects and issues
          </p>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-500/30 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold">Error</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </Card>
        )}

        {/* Projects Section */}
        <Card className="bg-[#0F1419] border-gray-800/40">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
            {loading && projects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projects.map((project) => (
                  <button
                    key={project.key}
                    onClick={() => setSelectedProject(project.key)}
                    className={`p-3 rounded-lg text-left transition-all ${
                      selectedProject === project.key
                        ? "bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF]"
                        : "bg-gray-900/30 border border-gray-800/40 text-gray-300 hover:bg-gray-900/50 hover:border-gray-700/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">{project.name}</p>
                    <p className="text-xs opacity-75">{project.key}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Issues Section */}
        {selectedProject && (
          <Card className="bg-[#0F1419] border-gray-800/40">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                  Issues in {selectedProject}
                </h2>
                <a
                  href={`https://gigitekai.atlassian.net/browse/${selectedProject}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00D4FF] hover:text-[#00D4FF]/80 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900/30 border-gray-800/40 text-white placeholder-gray-500"
                />
              </div>

              {/* Issues List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No issues found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {issues.map((issue) => (
                    <a
                      key={issue.id}
                      href={`https://gigitekai.atlassian.net/browse/${issue.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-gray-900/30 border border-gray-800/40 hover:bg-gray-900/50 hover:border-[#00D4FF]/30 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(issue.fields.status.name)}
                            <p className="font-mono text-sm text-[#00D4FF] group-hover:underline">
                              {issue.key}
                            </p>
                            {issue.fields.priority && (
                              <span
                                className={`text-xs font-semibold ${getPriorityColor(
                                  issue.fields.priority.name
                                )}`}
                              >
                                {issue.fields.priority.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-300 truncate">
                            {issue.fields.summary}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {issue.fields.status.name}
                            {issue.fields.assignee && (
                              <>
                                {" "}
                                • Assigned to{" "}
                                {issue.fields.assignee.displayName}
                              </>
                            )}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#00D4FF] transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </AdminLayoutWithSidebar>
  );
}
