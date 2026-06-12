import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type AuthedUser = { id: string; role: "player" | "admin" };

// Resolve the current user from the Supabase session and look up role.
export async function requireUser(): Promise<AuthedUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  return { id: user.id, role: (profile?.role as "player" | "admin") ?? "player" };
}

export async function requireAdmin(): Promise<AuthedUser | null> {
  const u = await requireUser();
  if (!u || u.role !== "admin") return null;
  return u;
}
