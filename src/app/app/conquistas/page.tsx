import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { computeRanking } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export default async function ConquistasPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const badges = await prisma.badge.findMany({ orderBy: { sort_order: "asc" } });
  const unlocked = user
    ? await prisma.userBadge.findMany({ where: { user_id: user.id } })
    : [];
  const unlockedSet = new Set(unlocked.map((u) => u.badge_id));

  // current streak value for this user
  let streak = 0;
  if (user) {
    const rows = await computeRanking("streak");
    streak = rows.find((r) => r.user_id === user.id)?.value ?? 0;
  }

  return (
    <div>
      <div className="card mb-6 flex items-center gap-4 p-5">
        <span className="text-4xl">🔥</span>
        <div>
          <div className="text-sm text-white/60">Sua melhor sequência</div>
          <div className="text-3xl font-black text-gold">{streak} acertos</div>
        </div>
      </div>

      <h2 className="title text-2xl">Medalhas</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {badges.map((b) => {
          const on = unlockedSet.has(b.id);
          return (
            <div
              key={b.id}
              className="card flex flex-col items-center p-4 text-center"
              style={{ opacity: on ? 1 : 0.45 }}
            >
              <span className="text-4xl">{on ? b.icon : "🔒"}</span>
              <div className="mt-2 text-sm font-bold">{b.title}</div>
              <div className="text-xs text-white/60">{b.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
