/**
 * AdminAccountsPage — Account Management module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminAccountManagement from "./AdminAccountManagement";

export default function AdminAccountsPage() {
  return (
    
    <AdminLayout><AdminLayout title="Accounts" noPadding>
      <AdminAccountManagement />
    </AdminLayout>
  
    </AdminLayout>);
}
