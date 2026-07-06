/**
 * AdminHelpdeskPage — Helpdesk module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminPanel from "./AdminPanel";

export default function AdminHelpdeskPage() {
  return (
    <AdminLayout title="Support Services" noPadding>
      <AdminPanel />
    </AdminLayout>
  );
}
