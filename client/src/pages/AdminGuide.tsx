/*
  AdminGuide — Comprehensive guide for using the GigitekAI Admin Portal
  Design: Matches GigitekAI brand — deep navy-black + electric cyan accents
  Features: Tickets, Calls, Email, Forms, Metrics, and more
*/

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Shield,
  Ticket,
  Phone,
  Mail,
  FileText,
  BarChart3,
  Users,
  Settings,
  CheckCircle2,
  Info,
  AlertCircle,
} from "lucide-react";

const sections = [
  {
    id: "dashboard",
    icon: BarChart3,
    title: "Dashboard",
    description: "Your command center for all support operations",
    content: [
      "View real-time metrics including total tickets, calls handled, and email volume",
      "Monitor team performance and response times at a glance",
      "See today's summary and upcoming tasks",
      "Quick access to all major features from one place",
    ],
  },
  {
    id: "tickets",
    icon: Ticket,
    title: "Ticket Management",
    description: "Create, track, and resolve support tickets",
    content: [
      "Create new tickets manually or they auto-create from emails and web forms",
      "Assign tickets to team members or keep them unassigned",
      "Update ticket status (New, In Progress, Resolved, Closed)",
      "Add replies and notes to keep track of conversation history",
      "Link tickets to customers and track resolution time",
      "Search and filter tickets by status, customer, or date",
    ],
  },
  {
    id: "calls",
    icon: Phone,
    title: "Call Management",
    description: "Track and review all incoming and outgoing calls",
    content: [
      "View call history with caller information and duration",
      "Listen to call recordings for quality assurance and training",
      "See call transcripts for quick reference",
      "Track missed calls and follow-up actions",
      "Link calls to tickets for complete customer context",
      "Monitor team call metrics and performance",
    ],
  },
  {
    id: "email",
    icon: Mail,
    title: "Email Management",
    description: "Send, receive, and manage support emails from one place",
    content: [
      "View all emails sent to and from support@gigitekai.com",
      "Compose and send emails directly from the portal",
      "Use email templates for quick responses to common questions",
      "Sync inbox automatically every 2 minutes to stay current",
      "Delete emails from both the portal and Outlook mailbox",
      "Link emails to tickets for better organization",
      "Organize emails by recipient groups for bulk messaging",
    ],
  },
  {
    id: "forms",
    icon: FileText,
    title: "Form Submissions",
    description: "Track all web intake forms and discovery requests",
    content: [
      "View all Web Discovery intake form submissions",
      "See complete contact information and business details",
      "Track submission status (New, Contacted, Converted)",
      "Quick action buttons to call or email requesters",
      "Search and filter submissions by company or date",
      "Never miss a lead with automatic notifications",
    ],
  },
  {
    id: "metrics",
    icon: BarChart3,
    title: "Metrics & Analytics",
    description: "Monitor performance and track key statistics",
    content: [
      "View ticket resolution times and team productivity",
      "Track email response rates and call handling metrics",
      "See customer satisfaction trends",
      "Monitor service level agreements (SLA) compliance",
      "Generate reports for management and clients",
      "Identify bottlenecks and improvement opportunities",
    ],
  },
  {
    id: "users",
    icon: Users,
    title: "User & Account Management",
    description: "Create and manage admin, agent, and viewer accounts",
    content: [
      "Create new team member accounts with custom credentials",
      "Promote existing users to Admin, Agent, or Viewer roles",
      "Reset passwords for team members",
      "Manage permissions and access levels",
      "Revoke access when staff members leave",
      "Track who's accessing what in your system",
    ],
  },
  {
    id: "settings",
    icon: Settings,
    title: "System Settings",
    description: "Configure portal behavior and integrations",
    content: [
      "Manage email templates for common responses",
      "Configure notification preferences",
      "Set up Teams channel integration for alerts",
      "Manage recipient groups for bulk messaging",
      "View system health and webhook status",
      "Access admin documentation and guides",
    ],
  },
];

function FeatureCard({ icon: Icon, title, description, content }: any) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6 space-y-4 hover:border-slate-600/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
      </div>
      <ul className="space-y-2 pl-0">
        {content.map((item: string, i: number) => (
          <li key={i} className="flex gap-3 text-sm text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminGuide() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-white">
      {/* Top nav bar */}
      <header className="border-b border-slate-800 bg-[#0A0E1A]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/admin")}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Portal
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Admin Guide</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs uppercase tracking-widest px-3 py-1">
            Admin Documentation
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            GigitekAI Admin Portal <span className="text-cyan-400">Guide</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage tickets, calls, emails, and team members from one unified dashboard.
            No technical knowledge required.
          </p>
        </section>

        {/* Quick Start */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Info className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Getting Started</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-cyan-900/15 border border-cyan-700/30 rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-cyan-400">First Time Login</h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li>1. Go to <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-mono">gigitekai.com/admin</code></li>
                <li>2. Log in with your Manus account or custom credentials</li>
                <li>3. You'll see the Admin Dashboard with all your support data</li>
                <li>4. Use the sidebar menu to navigate between features</li>
              </ol>
            </div>

            <div className="bg-amber-900/15 border border-amber-700/30 rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-amber-400">Pro Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Use the search function to quickly find tickets or emails</li>
                <li>• Set up email templates to save time on common responses</li>
                <li>• Enable Teams notifications to get real-time alerts</li>
                <li>• Check Metrics regularly to track team performance</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Main Features</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {sections.map((section) => (
              <FeatureCard
                key={section.id}
                icon={section.icon}
                title={section.title}
                description={section.description}
                content={section.content}
              />
            ))}
          </div>
        </section>

        {/* Common Tasks */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Common Tasks</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                task: "Create a New Ticket",
                steps: [
                  "Go to Helpdesk → Tickets",
                  "Click 'New Ticket'",
                  "Fill in customer info and issue details",
                  "Assign to a team member or leave unassigned",
                  "Click 'Create'",
                ],
              },
              {
                task: "Send a Support Email",
                steps: [
                  "Go to Email Management",
                  "Click 'Compose'",
                  "Enter recipient email address",
                  "Choose a template or write custom message",
                  "Click 'Send'",
                ],
              },
              {
                task: "Resolve a Ticket",
                steps: [
                  "Find the ticket in Helpdesk",
                  "Add any final notes or replies",
                  "Change status to 'Resolved'",
                  "Click 'Save'",
                  "Follow up with customer if needed",
                ],
              },
              {
                task: "Add a Team Member",
                steps: [
                  "Go to Settings → Users",
                  "Click 'Create Account'",
                  "Enter name, email, and password",
                  "Select role (Admin/Agent/Viewer)",
                  "Click 'Create'",
                ],
              },
            ].map((item, i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-white text-sm">{item.task}</h3>
                <ol className="space-y-1.5 text-xs text-gray-300">
                  {item.steps.map((step, j) => (
                    <li key={j} className="flex gap-2">
                      <span className="text-cyan-400 font-semibold flex-shrink-0">{j + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* Support & Help */}
        <section className="space-y-6">
          <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-700/30 rounded-xl p-8 space-y-4">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white">Need Help?</h3>
                <p className="text-gray-300 leading-relaxed">
                  If you have questions about using the admin portal, reach out to support@gigitekai.com or call +1 727-382-6909.
                  Our team is available 24/7 to help you get the most out of your GigitekAI system.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("mailto:support@gigitekai.com")}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Email Support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("tel:+17273826909")}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Call Support
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
