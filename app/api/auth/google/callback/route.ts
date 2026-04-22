import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/session";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  token_type: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
};

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || "/dashboard";
  const redirectUri = `${req.nextUrl.origin}/api/auth/google/callback`;

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=google_auth_failed", req.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL("/login?error=google_auth_failed", req.url)
      );
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Fetch user info
    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoRes.ok) {
      console.error("Google userinfo failed:", await userInfoRes.text());
      return NextResponse.redirect(
        new URL("/login?error=google_auth_failed", req.url)
      );
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    // Upsert user — find by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.sub },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Update existing user with Google info if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.sub,
            avatarUrl: user.avatarUrl || googleUser.picture,
            fullName: user.fullName || googleUser.name,
            verified: true,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.sub,
          fullName: googleUser.name,
          avatarUrl: googleUser.picture,
          verified: true,
        },
      });
    }

    // Sign JWT and set cookie
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: "customer",
    });

    const response = NextResponse.redirect(new URL(state, req.url));
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(
      new URL("/login?error=google_auth_failed", req.url)
    );
  }
}
