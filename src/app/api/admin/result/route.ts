import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recomputeMatchPoints, recalcUserBadges } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Admin sets a match result; recompute points for all predictions atomically.
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const matchId: string | undefined = body?.match_id;
  const homeScore = body?.home_score;
  const awayScore = body?.away_score;

  if (!matchId) return NextResponse.json({ error: "missing match_id" }, { status: 400 });

  // Allow clearing the result by sending null.
  const clearing = homeScore == null && awayScore == null;
  if (!clearing && (!Number.isInteger(homeScore) || !Number.isInteger(awayScore))) {
    return NextResponse.json({ error: "invalid score" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        home_score: clearing ? null : homeScore,
        away_score: clearing ? null : awayScore,
        locked: clearing ? false : true,
      },
    });

    let affected: string[] = [];
    if (clearing) {
      await tx.prediction.updateMany({
        where: { match_id: matchId },
        data: { points: null },
      });
      const preds = await tx.prediction.findMany({
        where: { match_id: matchId },
        select: { user_id: true },
      });
      affected = Array.from(new Set(preds.map((p) => p.user_id)));
    } else {
      affected = await recomputeMatchPoints(tx, matchId, homeScore, awayScore);
    }

    for (const uid of affected) {
      await recalcUserBadges(tx, uid);
    }
  });

  return NextResponse.json({ ok: true });
}
