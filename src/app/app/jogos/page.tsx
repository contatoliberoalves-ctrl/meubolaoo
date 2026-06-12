"use client";

import { useCallback, useEffect, useState } from "react";
import MatchCard, { type MatchDTO } from "@/components/MatchCard";
import { GROUP_CODES, STAGE_LABELS } from "@/lib/data";
import { createClient } from "@/lib/supabase/client";

const MDS = [
  { v: "", label: "Todas" },
  { v: "1", label: "Rodada 1" },
  { v: "2", label: "Rodada 2" },
  { v: "3", label: "Rodada 3" },
];

export default function JogosPage() {
  const [group, setGroup] = useState("A");
  const [md, setMd] = useState("");
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [knockout, setKnockout] = useState<Record<string, MatchDTO[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ group });
    if (md) qs.set("md", md);
    const res = await fetch(`/api/matches?${qs}`);
    const j = await res.json();
    setMatches(j.matches ?? []);
    setLoading(false);
  }, [group, md]);

  useEffect(() => {
    load();
  }, [load]);

  // load knockout once
  useEffect(() => {
    (async () => {
      const out: Record<string, MatchDTO[]> = {};
      for (const stage of ["r16", "qf", "sf", "final"]) {
        const res = await fetch(`/api/matches?stage=${stage}`);
        const j = await res.json();
        out[stage] = j.matches ?? [];
      }
      setKnockout(out);
    })();
  }, []);

  // realtime: refetch on prediction/match changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("jogos")
      .on("postgres_changes", { event: "*", schema: "public", table: "bolao_matches" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "bolao_predictions" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <div>
      <div className="card mb-4 p-3 text-sm text-white/70">
        🔒 Os palpites de cada jogo fecham automaticamente 5 minutos antes do
        apito inicial. Placar exato vale 5 pts, acertar o resultado vale 2.
      </div>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        {GROUP_CODES.map((g) => (
          <button
            key={g}
            className={`chip ${group === g ? "chip-active" : ""}`}
            onClick={() => setGroup(g)}
          >
            Grupo {g}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {MDS.map((m) => (
          <button
            key={m.v}
            className={`chip ${md === m.v ? "chip-active" : ""}`}
            onClick={() => setMd(m.v)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/60">Carregando…</p>
      ) : (
        <div className="grid gap-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {matches.length === 0 && (
            <p className="text-white/60">Nenhum jogo encontrado.</p>
          )}
        </div>
      )}

      {/* Mata-mata */}
      <h2 className="title mt-10 text-2xl">Mata-mata</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {(["r16", "qf", "sf", "final"] as const).map((stage) => (
          <div key={stage} className="card p-4">
            <div className="mb-2 font-bold">{STAGE_LABELS[stage]}</div>
            <div className="grid gap-2">
              {(knockout[stage] ?? []).map((m) => (
                <div
                  key={m.id}
                  className="pill flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>
                    {m.home_team?.name ?? "a definir"} ×{" "}
                    {m.away_team?.name ?? "a definir"}
                  </span>
                  <span>🔒</span>
                </div>
              ))}
              {(knockout[stage] ?? []).length === 0 && (
                <span className="text-sm text-white/50">a definir</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
