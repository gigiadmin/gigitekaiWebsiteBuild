/**
 * AdminBlogPage — Blog Management module inside unified AdminLayout
 */
import AdminLayout from "@/components/AdminLayout";
import MobileAdminMenu from "@/components/MobileAdminMenu";
import AdminBlog from "./AdminBlog";

export default function AdminBlogPage() {
  return (
    
    
    <>
      <MobileAdminMenu /><AdminLayout><AdminLayout title="Blog">
      <AdminBlog />
    </AdminLayout>
  
    </AdminLayout>
    </>);
}
