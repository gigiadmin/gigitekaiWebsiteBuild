/**
 * AdminPanelPage — Support Services module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminPanel from "./AdminPanel";

export default function AdminPanelPage() {
  return (
    <AdminLayout title="Support Services" noPadding>
      <AdminPanel />
    </AdminLayout>
  );
}
