/**
 * AdminHelpdeskPage — Helpdesk module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import MobileAdminMenu from "@/components/MobileAdminMenu";
import AdminPanel from "./AdminPanel";

export default function AdminHelpdeskPage() {
  return (
    
    
    <>
      <MobileAdminMenu /><AdminLayout><AdminLayout title="Helpdesk" noPadding>
      <AdminPanel />
    </AdminLayout>
  
    </AdminLayout>
    </>);
}
