/**
 * AdminScorecardDashboardPage — Scorecard Dashboard inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminScorecardDashboard from "./AdminScorecardDashboard";

export default function AdminScorecardDashboardPage() {
  return (
    <AdminLayout title="Scorecard Dashboard">
      <AdminScorecardDashboard />
    </AdminLayout>
  );
}
