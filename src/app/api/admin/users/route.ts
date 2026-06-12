import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List all registered users with their profile + prediction count (admin only).
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const users = await prisma.$queryRaw<
    {
      id: string;
      name: string | null;
      emblem: string | null;
      role: string;
      email: string;
      created_at: Date;
      predictions_count: bigint;
    }[]
  >`
    select
      p.id,
      p.name,
      p.emblem,
      p.role,
      u.email,
      u.created_at,
      (select count(*) from public.bolao_predictions pr where pr.user_id = p.id) as predictions_count
    from public.bolao_profiles p
    join auth.users u on u.id = p.id
    order by u.created_at desc
  `;

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      predictions_count: Number(u.predictions_count),
    })),
  });
}
