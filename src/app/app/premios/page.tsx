import { prisma } from "@/lib/prisma";
import { PRIZE_SLOTS, PRIZE_CATALOG } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PremiosPage() {
  const cfg = await prisma.prizeConfig.findMany();
  const map: Record<string, string> = {};
  cfg.forEach((c) => (map[c.slot] = c.prize_label));

  return (
    <div>
      <h2 className="title text-2xl">Conquistas premiadas</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PRIZE_SLOTS.map((s) => (
          <div key={s.slot} className="card flex items-center gap-3 p-4">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="font-bold">{s.title}</div>
              <div className="text-sm text-gold">
                {map[s.slot] ?? "a definir"}
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="title mt-10 text-2xl">Catálogo de prêmios</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRIZE_CATALOG.map((p) => (
          <div key={p.id} className="card flex items-center gap-3 p-4">
            <span className="text-2xl">{p.icon}</span>
            <span className="font-semibold">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
