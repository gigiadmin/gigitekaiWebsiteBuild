/**
 * AdminNotificationsPage — Notifications module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminNotifications from "./AdminNotifications";

export default function AdminNotificationsPage() {
  return (
    <AdminLayout title="Notifications" noPadding>
      <AdminNotifications />
    </AdminLayout>
  );
}
