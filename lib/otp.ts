import redis from "@/lib/redis";
import { sendOtpEmail } from "@/lib/email";

export type OtpType = "USER_SIGNUP" | "ADMIN_LOGIN" | "USER_PASSWORD_RESET" | "ADMIN_PASSWORD_RESET";

interface OtpConfig {
  ttl: number;
  maxAttempts: number;
  rateLimitTtl: number;
  prefix: string;
  subject: string;
}

export const OTP_SETTINGS: Record<OtpType, OtpConfig> = {
  USER_SIGNUP: {
    ttl: 300,
    maxAttempts: 3,
    rateLimitTtl: 3600,
    prefix: "otp", // Keeping original prefix
    subject: "Your Welcona Verification Code",
  },
  ADMIN_LOGIN: {
    ttl: 300,
    maxAttempts: 5,
    rateLimitTtl: 3600,
    prefix: "admin_otp", // Keeping original prefix
    subject: "Welcona Admin Login Code",
  },
  USER_PASSWORD_RESET: {
    ttl: 600, // 10 mins
    maxAttempts: 3,
    rateLimitTtl: 3600,
    prefix: "user_pwd_reset",
    subject: "Welcona Password Reset",
  },
  ADMIN_PASSWORD_RESET: {
    ttl: 600, // 10 mins
    maxAttempts: 5,
    rateLimitTtl: 3600,
    prefix: "admin_pwd_reset",
    subject: "Welcona Admin Password Reset",
  },
};

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalizes OTP value fetched from Redis.
 */
function normalizeOtp(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "otp" in value) {
    const nestedOtp = (value as { otp?: unknown }).otp;
    if (typeof nestedOtp === "string") return nestedOtp;
    if (typeof nestedOtp === "number") return String(nestedOtp);
  }
  return "";
}

export async function sendCentralizedOtp(
  email: string,
  type: OtpType
): Promise<{ success?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { error: "Please enter a valid email address." };
  }

  const config = OTP_SETTINGS[type];
  const countKey = `${config.prefix}_count:${cleanEmail}`;
  const currentCount = (await redis.get<number>(countKey)) ?? 0;

  if (currentCount >= config.maxAttempts) {
    return { error: "Too many attempts. Please try again later." };
  }

  const otp = generateOtp();
  const otpKey = `${config.prefix}:${cleanEmail}`;

  await redis.set(otpKey, otp, { ex: config.ttl });

  if (currentCount === 0) {
    await redis.set(countKey, 1, { ex: config.rateLimitTtl });
  } else {
    await redis.incr(countKey);
  }

  const result = await sendOtpEmail(cleanEmail, otp, config.subject);
  if (!result.success) {
    return { error: result.error || "Failed to send verification email." };
  }

  return { success: true };
}

export async function verifyCentralizedOtp(
  email: string,
  code: string,
  type: OtpType,
  deleteOnVerify = true
): Promise<{ success?: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const config = OTP_SETTINGS[type];
  const otpKey = `${config.prefix}:${cleanEmail}`;

  const storedOtp = await redis.get(otpKey);
  const storedOtpValue = normalizeOtp(storedOtp);

  if (!storedOtpValue) {
    return { error: "Verification code expired. Please request a new one." };
  }

  const cleanStored = storedOtpValue.replace(/\D/g, "");
  const cleanProvided = String(code ?? "").replace(/\D/g, "");

  if (cleanStored !== cleanProvided) {
    return { error: "Invalid verification code." };
  }

  if (deleteOnVerify) {
    await redis.del(otpKey);
  }

  return { success: true };
}
