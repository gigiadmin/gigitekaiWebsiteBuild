/**
 * AdminAgentsPage — AI Agents module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminAgents from "./AdminAgents";

export default function AdminAgentsPage() {
  return (
    
    <AdminLayout><AdminLayout title="AI Agents">
      <AdminAgents />
    </AdminLayout>
  
    </AdminLayout>);
}
