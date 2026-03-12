import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { AdminClient } from "./components/AdminClient";

export default async function AdminsPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    redirect("/");
  }

  const currentUser = await prisma.admin.findUnique({
    where: { id: session.sub },
    select: { role: true, id: true }
  });

  if (!currentUser) {
    redirect("/");
  }

  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";

  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true
    }
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <AdminClient 
        data={admins} 
        isSuperAdmin={isSuperAdmin} 
        currentUserId={currentUser.id} 
      />
    </div>
  );
}
