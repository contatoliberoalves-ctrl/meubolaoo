import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SLOTS = ["champion", "runner_up", "weekly", "streak"];

// Update a prize slot -> label mapping.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const slot: string | undefined = body?.slot;
  const label: string | undefined = body?.prize_label;
  if (!slot || !SLOTS.includes(slot) || !label) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const updated = await prisma.prizeConfig.upsert({
    where: { slot },
    update: { prize_label: label },
    create: { slot, prize_label: label },
  });
  return NextResponse.json({ config: updated });
}
