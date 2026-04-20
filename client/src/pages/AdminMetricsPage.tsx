/**
 * AdminMetricsPage — Metrics module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import MobileAdminMenu from "@/components/MobileAdminMenu";
import AdminMetrics from "./AdminMetrics";

export default function AdminMetricsPage() {
  return (
    
    
    <>
      <MobileAdminMenu /><AdminLayout><AdminLayout title="Metrics" noPadding>
      <AdminMetrics />
    </AdminLayout>
  
    </AdminLayout>
    </>);
}
