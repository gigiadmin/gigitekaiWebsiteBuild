/**
 * AdminGuidePage — Admin Guide inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminGuide from "./AdminGuide";

export default function AdminGuidePage() {
  return (
    
    <AdminLayout title="Admin Guide" noPadding>
      <AdminGuide />
    </AdminLayout>
  );
}
