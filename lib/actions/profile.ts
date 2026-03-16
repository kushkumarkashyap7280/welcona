"use server";

import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function updateUserProfileAction(data: { fullName: string; mobile: string }) {
  const session = await getSessionUser();
  if (!session || session.role !== "customer") {
    return { error: "Unauthorized" };
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.sub },
      data: {
        fullName: data.fullName,
        mobile: data.mobile,
      },
    });

    return { success: true, user: { fullName: updatedUser.fullName, mobile: updatedUser.mobile } };
  } catch (err) {
    return { error: "Failed to update profile." };
  }
}

export async function updateAdminProfileAction(data: { fullName: string }) {
  const session = await getSessionUser();
  if (!session || session.role !== "admin") {
    return { error: "Unauthorized" };
  }

  try {
    const updatedAdmin = await prisma.admin.update({
      where: { id: session.sub },
      data: {
        fullName: data.fullName,
      },
    });

    return { success: true, admin: { fullName: updatedAdmin.fullName } };
  } catch (err) {
    return { error: "Failed to update profile." };
  }
}
