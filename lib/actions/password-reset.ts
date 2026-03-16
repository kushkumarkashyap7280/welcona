"use server";

import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { sendCentralizedOtp, verifyCentralizedOtp } from "@/lib/otp";

// ─── User Password Reset ──────────────────────────────────────────────────

export async function userForgotPasswordAction(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail) {
    return { error: "Email is required." };
  }

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    // Return success to avoid email enumeration
    return { success: true };
  }

  return sendCentralizedOtp(cleanEmail, "USER_PASSWORD_RESET");
}

export async function userVerifyResetOtpAction(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();
  return verifyCentralizedOtp(cleanEmail, code, "USER_PASSWORD_RESET", false);
}

export async function userResetPasswordAction(email: string, code: string, newPassword: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Verify OTP again and consume it
  const verifyRes = await verifyCentralizedOtp(cleanEmail, code, "USER_PASSWORD_RESET", true);
  if (!verifyRes.success) {
    return { error: verifyRes.error || "Invalid or expired reset code." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email: cleanEmail },
    data: { password: hashedPassword },
  });

  return { success: true };
}

// ─── Admin Password Reset ──────────────────────────────────────────────────

export async function adminForgotPasswordAction(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail) {
    return { error: "Email is required." };
  }

  const admin = await prisma.admin.findUnique({
    where: { email: cleanEmail },
  });

  if (!admin) {
    // Return success to avoid email enumeration
    return { success: true };
  }

  return sendCentralizedOtp(cleanEmail, "ADMIN_PASSWORD_RESET");
}

export async function adminVerifyResetOtpAction(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();
  return verifyCentralizedOtp(cleanEmail, code, "ADMIN_PASSWORD_RESET", false);
}

export async function adminResetPasswordAction(email: string, code: string, newPassword: string) {
  const cleanEmail = email.trim().toLowerCase();
  
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  // Verify OTP again and consume it
  const verifyRes = await verifyCentralizedOtp(cleanEmail, code, "ADMIN_PASSWORD_RESET", true);
  if (!verifyRes.success) {
    return { error: verifyRes.error || "Invalid or expired reset code." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.admin.update({
    where: { email: cleanEmail },
    data: { password: hashedPassword },
  });

  return { success: true };
}
