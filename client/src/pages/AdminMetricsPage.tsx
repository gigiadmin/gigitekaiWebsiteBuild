/**
 * AdminMetricsPage — Metrics module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminMetrics from "./AdminMetrics";

export default function AdminMetricsPage() {
  return (
    <AdminLayout title="Metrics" noPadding>
      <AdminMetrics />
    </AdminLayout>
  );
}
