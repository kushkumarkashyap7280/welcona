"use server";

import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import redis from "@/lib/redis";
import { sendCentralizedOtp, verifyCentralizedOtp } from "@/lib/otp";
import { signToken, COOKIE_NAME } from "@/lib/session";

export async function adminLoginStartAction(
  email: string,
  password?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      return { error: "Email and password are required." };
    }

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

    // Credentials are valid, send OTP
    return await sendCentralizedOtp(cleanEmail, "ADMIN_LOGIN");
  } catch (error) {
    console.error("Admin login start error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function adminLoginVerifyAction(
  email: string,
  code: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const vr = await verifyCentralizedOtp(cleanEmail, code, "ADMIN_LOGIN");
    if (!vr.success) return vr;

    // OTP is valid. Set admin session.
    const admin = await prisma.admin.findUnique({
      where: { email: cleanEmail },
    });

    if (!admin) {
      return { error: "Admin not found." };
    }

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
    console.error("Admin login verify error:", error);
    return { error: "An unexpected error occurred." };
  }
}
