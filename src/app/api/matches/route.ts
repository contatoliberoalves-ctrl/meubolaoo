import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPredictable } from "@/lib/data";

export const dynamic = "force-dynamic";

// List matches with team/group info + current user's prediction + result.
export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const group = searchParams.get("group");
  const md = searchParams.get("md");
  const stage = searchParams.get("stage");

  const where: Record<string, unknown> = {};
  if (group) where.group_code = group;
  if (md) where.matchday = Number(md);
  if (stage) where.stage = stage;
  else if (group || md) where.stage = "group";

  const matches = await prisma.match.findMany({
    where,
    include: {
      home_team: true,
      away_team: true,
      predictions: user ? { where: { user_id: user.id } } : false,
    },
    orderBy: [{ matchday: "asc" }, { kickoff_at: "asc" }],
  });

  const data = matches.map((m) => ({
    id: m.id,
    group_code: m.group_code,
    stage: m.stage,
    matchday: m.matchday,
    kickoff_at: m.kickoff_at,
    home_score: m.home_score,
    away_score: m.away_score,
    locked: m.locked,
    predictable: isPredictable(m) && !!m.home_team_id && !!m.away_team_id,
    home_team: m.home_team,
    away_team: m.away_team,
    prediction:
      user && "predictions" in m && Array.isArray(m.predictions)
        ? m.predictions[0] ?? null
        : null,
  }));

  return NextResponse.json({ matches: data });
}
