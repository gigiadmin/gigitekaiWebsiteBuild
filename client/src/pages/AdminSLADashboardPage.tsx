/**
 * AdminSLADashboardPage — SLA Dashboard inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminSLADashboard from "./AdminSLADashboard";

export default function AdminSLADashboardPage() {
  return (
    <AdminLayout title="SLA Dashboard">
      <AdminSLADashboard />
    </AdminLayout>
  );
}
