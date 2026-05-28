import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function AdminDashboardRedirectPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }

  // Redirect to the first of our three core tabs: Product Management
  redirect("/admin/products");
}
