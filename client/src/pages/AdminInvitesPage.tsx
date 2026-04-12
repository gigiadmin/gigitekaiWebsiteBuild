/**
 * AdminInvitesPage — Customer Invites inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminCustomers from "./AdminCustomers";

export default function AdminInvitesPage() {
  return (
    <AdminLayout title="Invites">
      <AdminCustomers />
    </AdminLayout>
  );
}
