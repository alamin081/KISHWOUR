import { type NextRequest, NextResponse } from "next/server";

/**
 * Optimistic check only: send visitors without a session cookie to the login page.
 * Real authorization happens on the server in every admin page and server action
 * (src/lib/auth/session.ts).
 */
export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");
  if (!hasSession) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything under /admin except the login page.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
