/**
 * AdminChatPage — Live Chat module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import MobileAdminMenu from "@/components/MobileAdminMenu";
import AdminChat from "./AdminChat";

export default function AdminChatPage() {
  return (
    
    
    <>
      <MobileAdminMenu /><AdminLayout><AdminLayout title="Live Chat" noPadding>
      <AdminChat />
    </AdminLayout>
  
    </AdminLayout>
    </>);
}
