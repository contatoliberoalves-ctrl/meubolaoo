import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Toggle the locked flag for a match.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const matchId: string | undefined = body?.match_id;
  if (!matchId) return NextResponse.json({ error: "missing match_id" }, { status: 400 });

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { locked: !match.locked },
  });
  return NextResponse.json({ locked: updated.locked });
}
