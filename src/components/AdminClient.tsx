"use client";

import { useCallback, useEffect, useState } from "react";
import { GROUP_CODES, PRIZE_SLOTS, PRIZE_CATALOG, STAGE_LABELS } from "@/lib/data";
import type { MatchDTO } from "@/components/MatchCard";

function AdminMatchRow({ m, onChanged }: { m: MatchDTO; onChanged: () => void }) {
  const [home, setHome] = useState(m.home_score?.toString() ?? "");
  const [away, setAway] = useState(m.away_score?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function saveResult() {
    setBusy(true);
    await fetch("/api/admin/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: m.id,
        home_score: home === "" ? null : Number(home),
        away_score: away === "" ? null : Number(away),
      }),
    });
    setBusy(false);
    onChanged();
  }
  async function toggleLock() {
    setBusy(true);
    await fetch("/api/admin/lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ match_id: m.id }),
    });
    setBusy(false);
    onChanged();
  }

  return (
    <div className="card flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 text-sm">
        {m.home_team?.flag} {m.home_team?.name ?? "TBD"} ×{" "}
        {m.away_team?.name ?? "TBD"} {m.away_team?.flag}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="score-input"
          value={home}
          onChange={(e) => setHome(e.target.value.replace(/[^0-9]/g, "").slice(-1))}
        />
        <span>×</span>
        <input
          className="score-input"
          value={away}
          onChange={(e) => setAway(e.target.value.replace(/[^0-9]/g, "").slice(-1))}
        />
        <button className="btn btn-go px-3 py-1 text-sm" disabled={busy} onClick={saveResult}>
          Salvar
        </button>
        <button className="chip" disabled={busy} onClick={toggleLock}>
          {m.locked ? "🔓 destravar" : "🔒 travar"}
        </button>
      </div>
    </div>
  );
}

export default function AdminClient({
  groups,
  prizes,
}: {
  groups: string[];
  prizes: Record<string, string>;
}) {
  const [group, setGroup] = useState("A");
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [prizeState, setPrizeState] = useState(prizes);

  const load = useCallback(async () => {
    const res = await fetch(`/api/matches?group=${group}`);
    const j = await res.json();
    setMatches(j.matches ?? []);
  }, [group]);

  useEffect(() => {
    load();
  }, [load]);

  async function savePrize(slot: string, label: string) {
    setPrizeState((s) => ({ ...s, [slot]: label }));
    await fetch("/api/admin/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot, prize_label: label }),
    });
  }

  return (
    <div>
      <h2 className="title text-2xl">Resultados por grupo</h2>
      <div className="no-scrollbar my-3 flex gap-2 overflow-x-auto pb-1">
        {groups.map((g) => (
          <button
            key={g}
            className={`chip ${group === g ? "chip-active" : ""}`}
            onClick={() => setGroup(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {matches.map((m) => (
          <AdminMatchRow key={m.id} m={m} onChanged={load} />
        ))}
      </div>

      <h2 className="title mt-10 text-2xl">Prêmios</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {PRIZE_SLOTS.map((s) => (
          <div key={s.slot} className="card p-3">
            <label className="text-sm font-bold">
              {s.icon} {s.title}
            </label>
            <select
              className="mt-2 w-full rounded-lg px-3 py-2 text-ink"
              value={prizeState[s.slot] ?? ""}
              onChange={(e) => savePrize(s.slot, e.target.value)}
            >
              {PRIZE_CATALOG.map((p) => (
                <option key={p.id} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <h2 className="title mt-10 text-2xl">Mata-mata</h2>
      <p className="mt-2 text-sm text-white/60">
        Use a API <code>/api/admin/knockout</code> para atribuir seleções às
        chaves ({Object.values(STAGE_LABELS).join(", ")}) conforme a fase de
        grupos for definida.
      </p>
    </div>
  );
}
