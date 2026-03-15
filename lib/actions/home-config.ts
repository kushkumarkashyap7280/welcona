"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { HomePageConfig } from "@/lib/home-config";

export async function saveHomeConfigAction(
  config: Partial<HomePageConfig>
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await getSessionUser();
    if (!session || session.role !== "admin") {
      return { success: false, message: "Unauthorized" };
    }

    await prisma.siteConfig.upsert({
      where: { key: "home_page" },
      create: {
        key: "home_page",
        value: config as object,
      },
      update: {
        value: config as object,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("saveHomeConfigAction error:", error);
    return { success: false, message: "Failed to save configuration" };
  }
}
