"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import redis from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";
import { signToken, COOKIE_NAME } from "@/lib/session";

// ─── Login (email + password) ───────────────────────────────────────────────

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return { error: "Invalid credentials." };
  }

  const isHashed = user.password.startsWith("$2");
  const valid = isHashed
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!valid) {
    return { error: "Invalid credentials." };
  }

  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: "customer",
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/dashboard");
}

// ─── Logout ─────────────────────────────────────────────────────────────────

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

// ─── OTP: Send ──────────────────────────────────────────────────────────────

const OTP_TTL = 300; // 5 minutes
const RATE_LIMIT_TTL = 3600; // 1 hour
const MAX_OTP_ATTEMPTS = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtpAction(
  email: string
): Promise<{ success?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  // Check rate limit
  const countKey = `otp_count:${cleanEmail}`;
  const currentCount = (await redis.get<number>(countKey)) ?? 0;

  if (currentCount >= MAX_OTP_ATTEMPTS) {
    return {
      error: "Too many attempts. Please try again after 1 hour.",
    };
  }

  // Check if user already exists with a password (suggest login instead)
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { password: true, googleId: true },
  });
  if (existingUser?.password) {
    return {
      error: "An account with this email already exists. Please login instead.",
    };
  }

  // Generate and store OTP
  const otp = generateOtp();
  const otpKey = `otp:${cleanEmail}`;

  await redis.set(otpKey, otp, { ex: OTP_TTL });

  // Increment rate limit counter
  if (currentCount === 0) {
    await redis.set(countKey, 1, { ex: RATE_LIMIT_TTL });
  } else {
    await redis.incr(countKey);
  }

  // Send email
  const result = await sendOtpEmail(cleanEmail, otp);
  if (!result.success) {
    return { error: result.error || "Failed to send verification email." };
  }

  return { success: true };
}

// ─── OTP: Verify ────────────────────────────────────────────────────────────

export async function verifyOtpAction(
  email: string,
  code: string
): Promise<{ success?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const otpKey = `otp:${cleanEmail}`;

  const storedOtp = await redis.get<string>(otpKey);

  if (!storedOtp) {
    return { error: "Verification code expired. Please request a new one." };
  }

  // Robustly clean both strings just in case
  const cleanStored = storedOtp.replace(/\D/g, "");
  const cleanProvided = code.replace(/\D/g, "");

  if (cleanStored !== cleanProvided) {
    return { error: "Invalid verification code." };
  }

  // Mark email as verified in Redis (15 min window to complete signup)
  await redis.set(`verified:${cleanEmail}`, "true", { ex: 900 });

  // Clean up OTP key
  await redis.del(otpKey);

  return { success: true };
}

// ─── Complete Signup (after OTP verification) ───────────────────────────────

export async function completeSignupAction(data: {
  email: string;
  fullName: string;
  password: string;
}): Promise<{ error?: string }> {
  const cleanEmail = data.email.trim().toLowerCase();

  // Verify email was verified via OTP
  const isVerified = await redis.get<string>(`verified:${cleanEmail}`);
  if (isVerified !== "true") {
    return { error: "Email not verified. Please verify your email first." };
  }

  // Validate inputs
  if (!data.fullName.trim()) {
    return { error: "Full name is required." };
  }
  if (data.password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      fullName: data.fullName.trim(),
      password: hashedPassword,
      verified: true,
    },
  });

  // Clean up Redis
  await redis.del(`verified:${cleanEmail}`);

  // Sign JWT and set cookie
  const token = await signToken({
    sub: user.id,
    email: user.email,
    role: "customer",
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/dashboard");
}
