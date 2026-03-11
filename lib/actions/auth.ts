"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import prisma from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/session";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.password) {
    return { error: "Invalid credentials." };
  }

  // Support both bcrypt hashes and plain-text (dev seed) passwords
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

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
