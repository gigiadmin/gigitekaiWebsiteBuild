/**
 * AdminSatisfactionDashboardPage — Satisfaction Dashboard inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminSatisfactionDashboard from "./AdminSatisfactionDashboard";

export default function AdminSatisfactionDashboardPage() {
  return (
    <AdminLayout title="Satisfaction Dashboard">
      <AdminSatisfactionDashboard />
    </AdminLayout>
  );
}
