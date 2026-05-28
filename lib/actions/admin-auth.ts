"use server";

import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/session";

export async function adminLoginAction(
  email: string,
  password?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      return { error: "Email and password are required." };
    }

    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      return { error: "Invalid credentials." };
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      return { error: "Invalid credentials." };
    }

    // Credentials are valid, sign token directly (no OTP needed)
    const token = await signToken({
      sub: admin.id,
      email: admin.email,
      role: "admin",
    });

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error("Admin login error:", error);
    return { error: "An unexpected error occurred." };
  }
}
