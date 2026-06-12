import { prisma } from "@/lib/prisma";
import { computePoints, SCORING } from "@/lib/data";
import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

// Recompute points for every prediction on a match that now has a result.
export async function recomputeMatchPoints(
  tx: Tx,
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const preds = await tx.prediction.findMany({ where: { match_id: matchId } });
  for (const p of preds) {
    const pts = computePoints(homeScore, awayScore, p.home, p.away);
    await tx.prediction.update({ where: { id: p.id }, data: { points: pts } });
  }
  const affectedUsers = Array.from(new Set(preds.map((p) => p.user_id)));
  return affectedUsers;
}

// Award a badge if not already unlocked.
async function award(tx: Tx, userId: string, badgeId: string) {
  await tx.userBadge.upsert({
    where: { user_id_badge_id: { user_id: userId, badge_id: badgeId } },
    update: {},
    create: { user_id: userId, badge_id: badgeId },
  });
}

// Recompute badge unlocks for a user. Implements badges 0-3 + streak (2).
export async function recalcUserBadges(tx: Tx, userId: string) {
  const preds = await tx.prediction.findMany({
    where: { user_id: userId },
    include: { match: { select: { kickoff_at: true } } },
    orderBy: { match: { kickoff_at: "asc" } },
  });

  // 0. Primeiro Palpite — has at least one prediction.
  if (preds.length >= 1) await award(tx, userId, "primeiro-palpite");

  const exact = preds.filter((p) => p.points === SCORING.EXATO);
  // 1. Na Mosca — at least one exact score.
  if (exact.length >= 1) await award(tx, userId, "na-mosca");
  // 3. Vidente — 5 exact scores.
  if (exact.length >= 5) await award(tx, userId, "vidente");

  // 2. Pé Quente — 3 consecutive (by kickoff order) hits (points >= RESULTADO).
  let run = 0;
  let best = 0;
  for (const p of preds) {
    if (p.points != null && p.points >= SCORING.RESULTADO) {
      run++;
      best = Math.max(best, run);
    } else if (p.points != null) {
      run = 0;
    }
  }
  if (best >= 3) await award(tx, userId, "pe-quente");
}
