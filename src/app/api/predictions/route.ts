import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPredictable } from "@/lib/data";

export const dynamic = "force-dynamic";

// Upsert a prediction for the current user. Re-validates the lock server-side.
export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const matchId: string | undefined = body?.match_id;
  const home = Number(body?.home);
  const away = Number(body?.away);

  if (!matchId || !Number.isInteger(home) || !Number.isInteger(away)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  if (home < 0 || home > 9 || away < 0 || away > 9) {
    return NextResponse.json({ error: "score out of range" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "match not found" }, { status: 404 });
  if (!match.home_team_id || !match.away_team_id) {
    return NextResponse.json({ error: "match not ready" }, { status: 400 });
  }
  if (!isPredictable(match)) {
    return NextResponse.json({ error: "match locked" }, { status: 403 });
  }

  const pred = await prisma.prediction.upsert({
    where: { user_id_match_id: { user_id: user.id, match_id: matchId } },
    update: { home, away },
    create: { user_id: user.id, match_id: matchId, home, away },
  });

  // First-prediction badge.
  await prisma.userBadge.upsert({
    where: {
      user_id_badge_id: { user_id: user.id, badge_id: "primeiro-palpite" },
    },
    update: {},
    create: { user_id: user.id, badge_id: "primeiro-palpite" },
  });

  return NextResponse.json({ prediction: pred });
}
