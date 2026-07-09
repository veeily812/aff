import { NextResponse, type NextRequest } from "next/server";
import { unsealData } from "iron-session";
import { sessionOptions, type AdminSessionData } from "@/lib/session";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const cookie = request.cookies.get(sessionOptions.cookieName)?.value;

  if (!cookie) {
    return isApiRoute ? unauthorized() : redirectToLogin(request);
  }

  try {
    const session = await unsealData<AdminSessionData>(cookie, {
      password: sessionOptions.password,
    });

    if (!session.isAdmin) {
      return isApiRoute ? unauthorized() : redirectToLogin(request);
    }

    return NextResponse.next();
  } catch {
    return isApiRoute ? unauthorized() : redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
