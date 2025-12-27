import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Global auth guard for all routes.
 * Stops navigation if session cookie is missing.
 */
export function GET(req: NextRequest) {
  return handleAuth(req);
}
export function POST(req: NextRequest) {
  return handleAuth(req);
}

function handleAuth(req: NextRequest) {
  const PUBLIC_PATHS = ["/", "/login", "/register", "/favicon.ico"];
  const pathname = req.nextUrl.pathname;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const session = req.cookies.get("rb_session")?.value;

  if (!session) {
    // Redirect to home if no session
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}
