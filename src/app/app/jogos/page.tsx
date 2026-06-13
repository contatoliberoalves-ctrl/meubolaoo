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

function dayKey(iso: string) {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dayLabel(key: string) {
  const d = new Date(`${key}T12:00:00Z`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" });
}

function pickDefaultDay(keys: string[]) {
  const today = dayKey(new Date().toISOString());
  return keys.find((k) => k >= today) ?? keys[0] ?? null;
}

export default function JogosPage() {
  const [view, setView] = useState<"dia" | "grupo">("dia");
  const [group, setGroup] = useState("A");
  const [md, setMd] = useState("");
  const [day, setDay] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchDTO[]>([]);
  const [allGroupMatches, setAllGroupMatches] = useState<MatchDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [knockout, setKnockout] = useState<Record<string, MatchDTO[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    if (view === "dia") {
      const res = await fetch(`/api/matches?stage=group`);
      const j = await res.json();
      const all: MatchDTO[] = j.matches ?? [];
      setAllGroupMatches(all);
      setDay((prev) => prev ?? pickDefaultDay(Array.from(new Set(all.map((m) => dayKey(m.kickoff_at)))).sort()));
    } else {
      const qs = new URLSearchParams({ group });
      if (md) qs.set("md", md);
      const res = await fetch(`/api/matches?${qs}`);
      const j = await res.json();
      setMatches(j.matches ?? []);
    }
    setLoading(false);
  }, [view, group, md]);

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

  const days = Array.from(new Set(allGroupMatches.map((m) => dayKey(m.kickoff_at)))).sort();
  const matchesForDay = allGroupMatches
    .filter((m) => day && dayKey(m.kickoff_at) === day)
    .sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());

  return (
    <div>
      <div className="card mb-4 p-3 text-sm text-white/70">
        🔒 Os palpites de cada jogo fecham automaticamente 5 minutos antes do
        apito inicial. Placar exato vale 5 pts, acertar o resultado vale 2.
      </div>

      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        <button
          className={`chip ${view === "dia" ? "chip-active" : ""}`}
          onClick={() => setView("dia")}
        >
          📅 Por dia
        </button>
        <button
          className={`chip ${view === "grupo" ? "chip-active" : ""}`}
          onClick={() => setView("grupo")}
        >
          🏆 Por grupo
        </button>
      </div>

      {view === "dia" ? (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d}
              className={`chip whitespace-nowrap ${day === d ? "chip-active" : ""}`}
              onClick={() => setDay(d)}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      ) : (
        <>
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
        </>
      )}

      {loading ? (
        <p className="text-white/60">Carregando…</p>
      ) : (
        <div className="grid gap-3">
          {(view === "dia" ? matchesForDay : matches).map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
          {(view === "dia" ? matchesForDay : matches).length === 0 && (
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
