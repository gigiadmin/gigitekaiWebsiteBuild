/**
 * AdminAgentsPage — AI Agents module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import MobileAdminMenu from "@/components/MobileAdminMenu";
import AdminAgents from "./AdminAgents";

export default function AdminAgentsPage() {
  return (
    
    
    <>
      <MobileAdminMenu /><AdminLayout><AdminLayout title="AI Agents">
      <AdminAgents />
    </AdminLayout>
  
    </AdminLayout>
    </>);
}
