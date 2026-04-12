/**
 * AdminBlogPage — Blog Management module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import AdminBlog from "./AdminBlog";

export default function AdminBlogPage() {
  return (
    <AdminLayout title="Blog">
      <AdminBlog />
    </AdminLayout>
  );
}
