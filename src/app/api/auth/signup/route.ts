import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Sign up via Supabase Auth, then create the profile row.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { name, emblem, email, password } = body ?? {};
  if (!name || !email || !password) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL("/app", req.url).toString() },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const userId = data.user?.id;
  if (userId) {
    await prisma.profile.upsert({
      where: { id: userId },
      update: { name, emblem: emblem || "⚽" },
      create: { id: userId, name, emblem: emblem || "⚽", role: "player" },
    });
  }

  return NextResponse.json({
    ok: true,
    needsConfirmation: !data.session,
  });
}
