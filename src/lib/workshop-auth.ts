import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "workshop_session";
const secret = new TextEncoder().encode(
  process.env.WORKSHOP_JWT_SECRET ?? "workshop-dev-secret-change-in-production"
);

export type WSession =
  | { role: "admin"; id: "admin" }
  | { role: "student"; id: string; name: string };

export async function createSession(payload: WSession) {
  const token = await new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function getSession(): Promise<WSession | null> {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  try {
    const { payload } = await jwtVerify(c.value, secret);
    return payload as unknown as WSession;
  } catch {
    return null;
  }
}

export function sessionCookieOpts(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookie() {
  return { name: COOKIE, value: "", maxAge: 0, path: "/" };
}
