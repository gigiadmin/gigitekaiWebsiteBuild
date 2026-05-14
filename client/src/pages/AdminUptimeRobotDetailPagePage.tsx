/**
 * AdminUptimeRobotDetailPagePage — Uptime Robot Detail inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminUptimeRobotDetailPage from "./AdminUptimeRobotDetailPage";

export default function AdminUptimeRobotDetailPagePage() {
  return (
    <AdminLayout title="Monitor Details">
      <AdminUptimeRobotDetailPage />
    </AdminLayout>
  );
}
