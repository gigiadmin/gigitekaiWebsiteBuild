/**
 * AdminMetricsPage — Metrics module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminMetrics from "./AdminMetrics";

export default function AdminMetricsPage() {
  return (
    
    <AdminLayout><AdminLayout title="Metrics" noPadding>
      <AdminMetrics />
    </AdminLayout>
  
    </AdminLayout>);
}
