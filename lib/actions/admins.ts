"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

async function requireSuperAdmin() {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  
  const adminUser = await prisma.admin.findUnique({
    where: { id: session.sub },
    select: { role: true }
  });

  if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Super Admin only");
  }
  
  return session;
}

export async function createAdminAction(data: { email: string; fullName: string; role: "ADMIN" | "SUPER_ADMIN"; password?: string }) {
  await requireSuperAdmin();
  try {
    const defaultPassword = data.password || "welcona2026!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    
    const admin = await prisma.admin.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        password: hashedPassword,
      },
    });
    revalidatePath("/admin/admins");
    return { admin: { id: admin.id, email: admin.email } };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "Email must be unique." };
    return { error: "Failed to create admin." };
  }
}

export async function deleteAdminAction(id: string) {
  const session = await requireSuperAdmin();
  if (session.sub === id) {
    return { error: "You cannot delete your own account." };
  }
  
  try {
    await prisma.admin.delete({ where: { id } });
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete admin." };
  }
}
