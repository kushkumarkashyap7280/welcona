"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import redis from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";
import {
  signToken,
  COOKIE_NAME,
  SIGNUP_VERIFY_COOKIE_NAME,
  signSignupVerificationToken,
  verifySignupVerificationToken,
} from "@/lib/session";

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
    select: {password: true, googleId: true },
  });
  if (existingUser) {
     if(!existingUser.password && existingUser.googleId) {
      return {
        error: "An account with this email exists via Google. Please login with Google.",
      };
     }
    return {
      error: "An account with this email already exists. Please login instead using email and password ",
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

  // Robustly clean both strings just in case
  const cleanStored = storedOtpValue.replace(/\D/g, "");
  const cleanProvided = String(code ?? "").replace(/\D/g, "");

  if (cleanStored !== cleanProvided) {
    return { error: "Invalid verification code." };
  }

  // Mark email as verified in Redis (15 min window to complete signup)
  await redis.set(`verified:${cleanEmail}`, "true", { ex: 900 });

  // Issue short-lived browser proof for profile completion
  const verifyToken = await signSignupVerificationToken({
    email: cleanEmail,
    purpose: "signup_email_verified",
  });

  const cookieStore = await cookies();
  cookieStore.set(SIGNUP_VERIFY_COOKIE_NAME, verifyToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15,
    path: "/",
  });

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

  const cookieStore = await cookies();
  const signupVerifyToken = cookieStore.get(SIGNUP_VERIFY_COOKIE_NAME)?.value;
  if (!signupVerifyToken) {
    return {
      error:
        "Verification expired. Please verify your email again before continuing.",
    };
  }

  const verifiedPayload = await verifySignupVerificationToken(signupVerifyToken);
  if (!verifiedPayload || verifiedPayload.email !== cleanEmail) {
    return {
      error:
        "Verification mismatch. Please verify your email again and retry.",
    };
  }

  // Verify email was verified via OTP
  const verifiedState = await redis.get(`verified:${cleanEmail}`);
  const isVerified =
    verifiedState === "true" ||
    verifiedState === true ||
    verifiedState === 1 ||
    verifiedState === "1";

  if (!isVerified) {
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

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  cookieStore.delete(SIGNUP_VERIFY_COOKIE_NAME);

  redirect("/dashboard");
}
