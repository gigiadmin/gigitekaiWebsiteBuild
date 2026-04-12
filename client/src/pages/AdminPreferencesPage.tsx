/**
 * AdminPreferencesPage — User Preferences module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminUserPreferences from "./AdminUserPreferences";

export default function AdminPreferencesPage() {
  return (
    <AdminLayout title="Preferences">
      <AdminUserPreferences />
    </AdminLayout>
  );
}
