import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.WORKSHOP_JWT_SECRET ?? "workshop-dev-secret-change-in-production"
);

async function getSession(req: NextRequest) {
  const cookie = req.cookies.get("workshop_session");
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie.value, secret);
    return payload as { role: string };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/aluno")) {
    const session = await getSession(request);
    if (!session) return NextResponse.redirect(new URL("/login", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const session = await getSession(request);
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/aluno/:path*", "/admin/:path*"],
};