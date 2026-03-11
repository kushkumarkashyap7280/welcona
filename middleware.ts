import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "welcona-dev-secret-change-in-production"
);

const COOKIE_NAME = "welcona_token";

// Routes only accessible when NOT logged in
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

// Routes that require a logged-in customer session
const PROTECTED_CUSTOMER_ROUTES = [
  "/dashboard",
  "/cart",
  "/orders",
  "/details",
  "/notifications",
];

// Routes that require admin role
const ADMIN_ROUTES = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;

  let session: { sub: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET);
      session = payload as unknown as typeof session;
    } catch {
      session = null;
    }
  }

  const isAuthenticated = Boolean(session);

  // Redirect logged-in users away from login/signup
  if (AUTH_ONLY_ROUTES.some((r) => pathname === r)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect customer routes
  if (PROTECTED_CUSTOMER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Attach user id as a header so server components can read it without re-verifying
    const response = NextResponse.next();
    response.headers.set("x-user-id", session!.sub);
    response.headers.set("x-user-email", session!.email);
    return response;
  }

  // Protect admin routes
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthenticated || session?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const response = NextResponse.next();
    response.headers.set("x-user-id", session!.sub);
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
