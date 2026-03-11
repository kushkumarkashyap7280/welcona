import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://welcona.vercel.app/api/auth/google/callback"
    : "http://localhost:3000/api/auth/google/callback";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("from") || "/dashboard";

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
