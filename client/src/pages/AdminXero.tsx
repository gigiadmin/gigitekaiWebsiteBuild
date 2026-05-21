/**
 * AdminXero.tsx
 * Xero Financial Integration Dashboard — GigitekAI Admin Portal
 * Shows: connection status, financial summary, invoices, contacts
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Link2,
  Unlink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const match = dateStr.match(/\/Date\((\d+)/);
  if (match) {
    return new Date(parseInt(match[1])).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    AUTHORISED: { label: "Authorised", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    PAID: { label: "Paid", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    DRAFT: { label: "Draft", className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
    VOIDED: { label: "Voided", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    DELETED: { label: "Deleted", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-500/20 text-gray-400 border-gray-500/30" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${s.className}`}>
      {s.label}
    </span>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminXero() {
  const utils = trpc.useUtils();
  const [invoicePage, setInvoicePage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"invoices" | "contacts">("invoices");

  // Queries
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } =
    trpc.xero.getStatus.useQuery(undefined, { retry: false });

  const { data: summary, isLoading: summaryLoading } =
    trpc.xero.getFinancialSummary.useQuery(undefined, {
      enabled: status?.connected === true,
      retry: false,
    });

  const { data: invoicesData, isLoading: invoicesLoading } =
    trpc.xero.getInvoices.useQuery(
      { status: "ALL", page: invoicePage },
      { enabled: status?.connected === true && activeTab === "invoices", retry: false }
    );

  const { data: contactsData, isLoading: contactsLoading } =
    trpc.xero.getContacts.useQuery(
      { page: contactPage },
      { enabled: status?.connected === true && activeTab === "contacts", retry: false }
    );

  const handleConnect = () => {
    window.location.href = "/api/xero/connect";
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Xero? This will remove stored tokens.")) return;
    try {
      await fetch("/api/xero/disconnect", { method: "DELETE" });
      await refetchStatus();
      utils.xero.getFinancialSummary.invalidate();
      toast.success("Xero disconnected — tokens removed successfully.");
    } catch {
      toast.error("Failed to disconnect Xero.");
    }
  };

  const isConnected = status?.connected === true;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-cyan-400">⚡</span> Xero Integration
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Connect your Xero accounting to view invoices, contacts, and financial data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStatus()}
              className="border-white/20 text-gray-300 hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                <Unlink className="w-4 h-4 mr-1.5" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
              >
                <Link2 className="w-4 h-4 mr-1.5" />
                Connect Xero
              </Button>
            )}
          </div>
        </div>

        {/* Connection Status Card */}
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-4">
            {statusLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium text-white">
                {statusLoading
                  ? "Checking connection…"
                  : isConnected
                  ? `Connected to ${status.tenantName ?? "Xero Organisation"}`
                  : "Not Connected"}
              </p>
              {isConnected && status?.tenantId && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Tenant ID: {status.tenantId}
                  {status.expiresAt && (
                    <> · Token expires: {new Date(status.expiresAt).toLocaleString()}</>
                  )}
                </p>
              )}
              {!isConnected && !statusLoading && (
                <p className="text-sm text-gray-400 mt-0.5">
                  Click "Connect Xero" to authorise GigitekAI to access your Xero accounting data.
                </p>
              )}
            </div>
            {isConnected && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                Active
              </Badge>
            )}
          </div>
        </div>

        {/* Not connected placeholder */}
        {!isConnected && !statusLoading && (
          <div className="bg-[#0f1629] border border-white/10 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Connect Your Xero Account</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Link your Xero organisation to view real-time invoices, contacts, outstanding balances,
              and financial summaries directly in your GigitekAI admin portal.
            </p>
            <Button
              onClick={handleConnect}
              className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Connect Xero Now
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              You'll be redirected to Xero to authorise access. No data is stored without your consent.
            </p>
          </div>
        )}

        {/* Connected: Financial Summary + Tabs */}
        {isConnected && (
          <>
            {/* Financial Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Invoiced"
                value={summaryLoading ? "…" : formatCurrency(summary?.totalInvoiced ?? 0)}
                icon={TrendingUp}
                color="bg-cyan-500"
                subtitle="All time"
              />
              <MetricCard
                title="Total Paid"
                value={summaryLoading ? "…" : formatCurrency(summary?.totalPaid ?? 0)}
                icon={CheckCircle2}
                color="bg-green-600"
                subtitle="Collected"
              />
              <MetricCard
                title="Outstanding"
                value={summaryLoading ? "…" : formatCurrency(summary?.outstanding ?? 0)}
                icon={AlertCircle}
                color="bg-amber-600"
                subtitle="Awaiting payment"
              />
              <MetricCard
                title="Overdue Invoices"
                value={summaryLoading ? "…" : String(summary?.overdueCount ?? 0)}
                icon={FileText}
                color="bg-red-600"
                subtitle="Authorised, unpaid"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-[#0f1629] border border-white/10 rounded-lg p-1 w-fit">
              {(["invoices", "contacts"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? "bg-cyan-500 text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab === "invoices" ? (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Invoices
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Contacts
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Invoices</h3>
                  <span className="text-xs text-gray-500">Page {invoicePage}</span>
                </div>
                {invoicesLoading ? (
                  <div className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading invoices…
                  </div>
                ) : invoicesData?.error ? (
                  <div className="p-8 text-center text-red-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    {invoicesData.error}
                  </div>
                ) : !invoicesData?.invoices?.length ? (
                  <div className="p-8 text-center text-gray-500">No invoices found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                          <th className="text-left px-5 py-3">Invoice #</th>
                          <th className="text-left px-5 py-3">Contact</th>
                          <th className="text-left px-5 py-3">Date</th>
                          <th className="text-left px-5 py-3">Due Date</th>
                          <th className="text-right px-5 py-3">Total</th>
                          <th className="text-right px-5 py-3">Amount Due</th>
                          <th className="text-left px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoicesData.invoices as Array<Record<string, unknown>>).map((inv, i) => (
                          <tr
                            key={(inv.InvoiceID as string) ?? i}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-cyan-400 font-mono text-xs">
                              {(inv.InvoiceNumber as string) || "—"}
                            </td>
                            <td className="px-5 py-3 text-white">
                              {(inv.Contact as Record<string, unknown>)?.Name as string || "—"}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {formatDate(inv.Date as string)}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {formatDate(inv.DueDate as string)}
                            </td>
                            <td className="px-5 py-3 text-right text-white font-medium">
                              {formatCurrency((inv.Total as number) ?? 0)}
                            </td>
                            <td className="px-5 py-3 text-right text-amber-400 font-medium">
                              {formatCurrency((inv.AmountDue as number) ?? 0)}
                            </td>
                            <td className="px-5 py-3">
                              <InvoiceStatusBadge status={inv.Status as string} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Pagination */}
                <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={invoicePage <= 1}
                    onClick={() => setInvoicePage((p) => p - 1)}
                    className="border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-500">Page {invoicePage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(invoicesData?.invoices?.length ?? 0) < 100}
                    onClick={() => setInvoicePage((p) => p + 1)}
                    className="border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === "contacts" && (
              <div className="bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Contacts</h3>
                  <span className="text-xs text-gray-500">Page {contactPage}</span>
                </div>
                {contactsLoading ? (
                  <div className="p-8 text-center text-gray-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading contacts…
                  </div>
                ) : contactsData?.error ? (
                  <div className="p-8 text-center text-red-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    {contactsData.error}
                  </div>
                ) : !contactsData?.contacts?.length ? (
                  <div className="p-8 text-center text-gray-500">No contacts found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wide">
                          <th className="text-left px-5 py-3">Name</th>
                          <th className="text-left px-5 py-3">Email</th>
                          <th className="text-left px-5 py-3">Phone</th>
                          <th className="text-left px-5 py-3">Status</th>
                          <th className="text-right px-5 py-3">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(contactsData.contacts as Array<Record<string, unknown>>).map((c, i) => (
                          <tr
                            key={(c.ContactID as string) ?? i}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-5 py-3 text-white font-medium">
                              {(c.Name as string) || "—"}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {(c.EmailAddress as string) || "—"}
                            </td>
                            <td className="px-5 py-3 text-gray-400">
                              {(c.Phones as Array<Record<string, string>>)?.[0]?.PhoneNumber || "—"}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                  c.ContactStatus === "ACTIVE"
                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                }`}
                              >
                                {(c.ContactStatus as string) || "Unknown"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right text-white font-medium">
                              {formatCurrency((c.Balances as Record<string, Record<string, number>>)?.AccountsReceivable?.Outstanding ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Pagination */}
                <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={contactPage <= 1}
                    onClick={() => setContactPage((p) => p - 1)}
                    className="border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-500">Page {contactPage}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(contactsData?.contacts?.length ?? 0) < 100}
                    onClick={() => setContactPage((p) => p + 1)}
                    className="border-white/20 text-gray-300 hover:bg-white/10 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Xero portal link */}
            <div className="mt-4 text-center">
              <a
                href="https://go.xero.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              >
                Open Xero Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
