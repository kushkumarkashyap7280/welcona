"use server";

import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import redis from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";
import { signToken, COOKIE_NAME } from "@/lib/session";

const OTP_TTL = 300; // 5 minutes
const MAX_OTP_ATTEMPTS = 5;
const RATE_LIMIT_TTL = 3600; // 1 hour

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function adminLoginStartAction(
  email: string,
  password?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail || !password) {
      return { error: "Email and password are required." };
    }

    // Rate limiting check
    const countKey = `admin_otp_count:${cleanEmail}`;
    const currentCount = (await redis.get<number>(countKey)) ?? 0;

    if (currentCount >= MAX_OTP_ATTEMPTS) {
      return {
        error: "Too many attempts. Please try again later.",
      };
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
    const otp = generateOtp();
    const otpKey = `admin_otp:${cleanEmail}`;

    await redis.set(otpKey, otp, { ex: OTP_TTL });

    // Increment rate limit
    if (currentCount === 0) {
      await redis.set(countKey, 1, { ex: RATE_LIMIT_TTL });
    } else {
      await redis.incr(countKey);
    }

    // Using the same email sender for simplicity, customizing subject could be better but let's reuse
    const emailResult = await sendOtpEmail(cleanEmail, otp);
    if (!emailResult.success) {
      return { error: emailResult.error || "Failed to send verification email." };
    }

    return { success: true };
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
    const otpKey = `admin_otp:${cleanEmail}`;

    const storedOtp = await redis.get(otpKey);

    const normalizeOtp = (value: unknown): string => {
      if (typeof value === "string") return value;
      if (typeof value === "number") return String(value);
      if (value && typeof value === "object" && "otp" in value) {
        const nestedOtp = (value as { otp?: unknown }).otp;
        if (typeof nestedOtp === "string") return nestedOtp;
        if (typeof nestedOtp === "number") return String(nestedOtp);
      }
      return "";
    };

    const storedOtpValue = normalizeOtp(storedOtp);

    if (!storedOtpValue) {
      return { error: "Verification code expired. Please request a new one." };
    }

    const cleanStored = storedOtpValue.replace(/\D/g, "");
    const cleanProvided = String(code ?? "").replace(/\D/g, "");

    if (cleanStored !== cleanProvided) {
      return { error: "Invalid verification code." };
    }

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

    // Cleanup OTP
    await redis.del(otpKey);

    return { success: true };
  } catch (error) {
    console.error("Admin login verify error:", error);
    return { error: "An unexpected error occurred." };
  }
}
