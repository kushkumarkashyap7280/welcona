import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "welcona-dev-secret-change-in-production"
);

const COOKIE_NAME = "welcona_token";

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;

  let session: { sub: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as { sub: string; email: string; role: string };
    } catch {
      session = null;
    }
  }

  const isAuthenticated = Boolean(session);

  // Protect admin routes (allow /admin/login to be publicly accessible)
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (pathname === "/admin/login") {
      if (isAuthenticated && session?.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const response = NextResponse.next();
    response.headers.set("x-user-id", session.sub);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - public folder assets
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/).*)",
  ],
};
