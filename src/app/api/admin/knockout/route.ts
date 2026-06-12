import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Assign teams (and optionally kickoff) to a knockout match.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const matchId: string | undefined = body?.match_id;
  if (!matchId) return NextResponse.json({ error: "missing match_id" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if ("home_team_id" in body) data.home_team_id = body.home_team_id || null;
  if ("away_team_id" in body) data.away_team_id = body.away_team_id || null;
  if (body.kickoff_at) data.kickoff_at = new Date(body.kickoff_at);

  const updated = await prisma.match.update({ where: { id: matchId }, data });
  return NextResponse.json({ match: updated });
}
