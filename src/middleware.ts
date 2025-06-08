import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;
  
  // Protect dashboard routes - must be authenticated
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin")) {
      if (token?.role !== "ADMIN") {
        // Redirect non-admin users to their owner dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }
  
  // Redirect authenticated users away from login page
  if (pathname === "/login" && token) {
    if (token.role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"]
};
