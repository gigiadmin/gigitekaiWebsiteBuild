/**
 * AdminPanelPage — Helpdesk module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminPanel from "./AdminPanel";

export default function AdminPanelPage() {
  return (
    <AdminLayout title="Helpdesk" noPadding>
      <AdminPanel />
    </AdminLayout>
  );
}
