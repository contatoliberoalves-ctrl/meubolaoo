"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Row = { user_id: string; name: string; emblem: string; value: number };
type Scope = "overall" | "weekly" | "streak";

const SCOPES: { v: Scope; label: string }[] = [
  { v: "overall", label: "Geral" },
  { v: "weekly", label: "Vencedores da semana" },
  { v: "streak", label: "Melhor sequência" },
];

export default function RankingClient({
  meId,
  prizes,
}: {
  meId: string | null;
  prizes: Record<string, string>;
}) {
  const [scope, setScope] = useState<Scope>("overall");
  const [rows, setRows] = useState<Row[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/ranking?scope=${scope}`);
    const j = await res.json();
    setRows(j.rows ?? []);
  }, [scope]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel("ranking")
      .on("postgres_changes", { event: "*", schema: "public", table: "predictions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const unit = scope === "streak" ? "🔥" : "pts";

  const prizeBanner =
    scope === "weekly"
      ? prizes.weekly
      : scope === "streak"
      ? prizes.streak
      : null;

  return (
    <div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {SCOPES.map((s) => (
          <button
            key={s.v}
            className={`chip whitespace-nowrap ${scope === s.v ? "chip-active" : ""}`}
            onClick={() => setScope(s.v)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {prizeBanner && (
        <div className="card mb-5 p-3 text-sm">
          🎁 Prêmio do líder:{" "}
          <strong className="text-gold">{prizeBanner}</strong>
        </div>
      )}

      {/* Podium */}
      <div className="mb-6 grid grid-cols-3 items-end gap-3">
        {[1, 0, 2].map((idx) => {
          const r = top3[idx];
          if (!r) return <div key={idx} />;
          const place = idx + 1;
          const elevated = idx === 0;
          return (
            <div
              key={r.user_id}
              className="card flex flex-col items-center p-3 text-center"
              style={{
                marginTop: elevated ? 0 : 24,
                borderColor: elevated ? "var(--gold)" : undefined,
                background: elevated ? "rgba(245,200,90,.12)" : undefined,
              }}
            >
              <div className="text-2xl">{place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉"}</div>
              <div className="text-3xl">{r.emblem}</div>
              <div className="mt-1 truncate text-sm font-bold">{r.name}</div>
              <div className="text-sky">
                {r.value} {unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="grid gap-2">
        {rest.map((r, i) => (
          <div
            key={r.user_id}
            className="card flex items-center justify-between px-4 py-2"
            style={
              r.user_id === meId
                ? { borderColor: "var(--accent)", background: "rgba(37,99,235,.14)" }
                : undefined
            }
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-white/50">{i + 4}</span>
              <span className="text-xl">{r.emblem}</span>
              <span className="font-semibold">{r.name}</span>
            </div>
            <span className="font-bold text-sky">
              {r.value} {unit}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-white/60">Ninguém pontuou ainda. Seja o primeiro!</p>
        )}
      </div>
    </div>
  );
}
