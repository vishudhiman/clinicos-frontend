import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isStaff = req.auth.user.role === "DOCTOR" || req.auth.user.role === "ADMIN";
  const staffOnlyPaths = ["/doctors", "/dashboard", "/appointments"];

  if (staffOnlyPaths.some((p) => pathname.startsWith(p)) && !isStaff) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (pathname === "/" && isStaff) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/register|_next/static|_next/image|favicon.ico).*)"],
};
