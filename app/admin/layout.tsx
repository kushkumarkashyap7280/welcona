import { getSessionUser } from "@/lib/session";
import { AdminSidebar } from "@/app/admin/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionUser();

  // If there's no authenticated session (e.g. visiting /admin/login),
  // render the login layout cleanly without the sidebar.
  if (!session || session.role !== "admin") {
    return <>{children}</>;
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}
