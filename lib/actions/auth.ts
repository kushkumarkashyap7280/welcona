"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAME } from "@/lib/session";

// ─── Logout (Clears admin session) ──────────────────────────────────────────
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/");
}

// ─── Customer Auth Stubs (Decommissioned under 35k) ──────────────────────────

export async function sendOtpAction(_email: string): Promise<{ error?: string; success?: boolean }> {
  return { error: "User accounts are deactivated under this version." };
}

export async function verifyOtpAction(
  _email: string,
  _otp: string
): Promise<{ error?: string; token?: string }> {
  return { error: "User accounts are deactivated under this version." };
}

export async function completeSignupAction(
  _token: string,
  _fullName: string,
  _mobile: string
): Promise<{ error?: string; success?: boolean }> {
  return { error: "User accounts are deactivated under this version." };
}

export async function loginAction(
  _prevState: any,
  _formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  return { error: "User accounts are deactivated under this version." };
}
