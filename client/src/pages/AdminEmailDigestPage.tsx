/**
 * AdminEmailDigestPage — Email Digest Settings inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import EmailDigestSettings from "./EmailDigestSettings";

export default function AdminEmailDigestPage() {
  return (
    <AdminLayout title="Email Digest">
      <EmailDigestSettings />
    </AdminLayout>
  );
}
