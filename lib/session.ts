import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "welcona-dev-secret-change-in-production"
);

export const COOKIE_NAME = "welcona_token";
export const SIGNUP_VERIFY_COOKIE_NAME = "welcona_signup_verify";

export type SessionPayload = {
  sub: string; // userId
  email: string;
  role: "customer" | "admin";
};

export type SignupVerificationPayload = {
  email: string;
  purpose: "signup_email_verified";
};

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function signSignupVerificationToken(
  payload: SignupVerificationPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(SECRET);
}

export async function verifySignupVerificationToken(
  token: string
): Promise<SignupVerificationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const parsed = payload as unknown as SignupVerificationPayload;
    if (parsed?.purpose !== "signup_email_verified" || !parsed?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
