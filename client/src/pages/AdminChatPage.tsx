/**
 * AdminChatPage — Live Chat module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminChat from "./AdminChat";

export default function AdminChatPage() {
  return (
    <AdminLayout title="Live Chat" noPadding>
      <AdminChat />
    </AdminLayout>
  );
}
