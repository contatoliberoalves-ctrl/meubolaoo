import { prisma } from "@/lib/prisma";
import { SCORING } from "@/lib/data";

export type RankRow = {
  user_id: string;
  name: string;
  emblem: string;
  value: number;
};

export type Scope = "overall" | "weekly" | "streak";

export async function computeRanking(scope: Scope): Promise<RankRow[]> {
  const profiles = await prisma.profile.findMany({
    select: { id: true, name: true, emblem: true },
  });
  const pmap = new Map(profiles.map((p) => [p.id, p]));

  if (scope === "overall" || scope === "weekly") {
    const where =
      scope === "weekly"
        ? {
            points: { not: null },
            match: {
              kickoff_at: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                lte: new Date(),
              },
            },
          }
        : { points: { not: null } };

    const preds = await prisma.prediction.findMany({
      where,
      select: { user_id: true, points: true },
    });
    const totals = new Map<string, number>();
    for (const p of preds) {
      totals.set(p.user_id, (totals.get(p.user_id) ?? 0) + (p.points ?? 0));
    }
    return finalize(totals, pmap);
  }

  // streak: longest current run of consecutive (by kickoff order) matches
  // where points >= RESULTADO.
  const preds = await prisma.prediction.findMany({
    where: { points: { not: null } },
    include: { match: { select: { kickoff_at: true } } },
    orderBy: [{ user_id: "asc" }, { match: { kickoff_at: "asc" } }],
  });
  const byUser = new Map<string, number[]>();
  for (const p of preds) {
    const arr = byUser.get(p.user_id) ?? [];
    arr.push(p.points ?? 0);
    byUser.set(p.user_id, arr);
  }
  const streaks = new Map<string, number>();
  for (const [uid, pts] of byUser) {
    let run = 0;
    let best = 0;
    for (const v of pts) {
      if (v >= SCORING.RESULTADO) {
        run++;
        best = Math.max(best, run);
      } else run = 0;
    }
    streaks.set(uid, best);
  }
  return finalize(streaks, pmap);
}

function finalize(
  totals: Map<string, number>,
  pmap: Map<string, { id: string; name: string; emblem: string }>
): RankRow[] {
  const rows: RankRow[] = [];
  for (const p of pmap.values()) {
    rows.push({
      user_id: p.id,
      name: p.name,
      emblem: p.emblem,
      value: totals.get(p.id) ?? 0,
    });
  }
  rows.sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  return rows;
}
