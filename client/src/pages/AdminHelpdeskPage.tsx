/**
 * AdminHelpdeskPage — Helpdesk module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminPanel from "./AdminPanel";
import AriaWidget from "@/components/AriaWidget";

export default function AdminHelpdeskPage() {
  return (
    <AdminLayout title="Support Services" noPadding>
      <AdminPanel />
      <AriaWidget
        pageContext="Support Services / Tickets"
        starterQuestion="Give me a quick ticket status summary — open, on-hold, critical, and any SLA breaches."
      />
    </AdminLayout>
  );
}
