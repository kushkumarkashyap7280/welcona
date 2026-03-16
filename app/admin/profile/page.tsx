import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import prisma from "@/lib/db";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";

export const metadata = { title: "Admin Profile" };

export default async function AdminProfilePage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") redirect("/login");

  const admin = await prisma.admin.findUnique({
    where: { id: session.sub },
    select: { fullName: true, email: true },
  });

  if (!admin) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your administrative profile settings.</p>
      </div>
      
      <div className="mt-8 max-w-2xl">
        <AdminProfileForm 
          initialData={{
            fullName: admin.fullName || "",
            email: admin.email,
          }}
        />
      </div>
    </div>
  );
}
