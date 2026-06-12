"use client";

import { useState } from "react";
import { pointsKind } from "@/lib/data";

export type MatchDTO = {
  id: string;
  kickoff_at: string;
  home_score: number | null;
  away_score: number | null;
  locked: boolean;
  predictable: boolean;
  home_team: { name: string; flag: string } | null;
  away_team: { name: string; flag: string } | null;
  prediction: { home: number; away: number; points: number | null } | null;
};

function PointPill({ points }: { points: number | null }) {
  const kind = pointsKind(points);
  if (kind === "exato")
    return <span className="pill bg-gold/20 px-3 py-1 text-sm font-bold text-gold">+5 exato</span>;
  if (kind === "resultado")
    return <span className="pill px-3 py-1 text-sm font-bold text-sky">+2 resultado</span>;
  return <span className="pill px-3 py-1 text-sm font-semibold text-white/70">0 errou</span>;
}

export default function MatchCard({ match }: { match: MatchDTO }) {
  const [home, setHome] = useState<string>(
    match.prediction ? String(match.prediction.home) : ""
  );
  const [away, setAway] = useState<string>(
    match.prediction ? String(match.prediction.away) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hasResult = match.home_score != null && match.away_score != null;
  const disabled = !match.predictable;
  const isSaved =
    saved ||
    (!!match.prediction &&
      home === String(match.prediction.home) &&
      away === String(match.prediction.away));

  function digit(v: string) {
    const d = v.replace(/[^0-9]/g, "").slice(-1);
    return d;
  }

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true);
    setErr(null);
    setSaved(false);
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_id: match.id,
        home: Number(home),
        away: Number(away),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Erro ao salvar");
    }
  }

  const kickoff = new Date(match.kickoff_at);

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-white/60">
        <span>
          {kickoff.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            timeZone: "America/Sao_Paulo",
          })}{" "}
          ·{" "}
          {kickoff.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
          })}{" "}
          (horário de Brasília)
        </span>
        {(match.locked || hasResult) && (
          <span className="pill px-2 py-0.5 text-[11px]">
            {hasResult ? "✅ encerrado" : "🔒 fechado"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 items-center gap-2">
          <span className="text-2xl">{match.home_team?.flag ?? "🏳️"}</span>
          <span className="font-semibold">{match.home_team?.name ?? "A definir"}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            className="score-input"
            inputMode="numeric"
            value={hasResult ? String(match.home_score) : home}
            disabled={disabled || hasResult}
            onChange={(e) => setHome(digit(e.target.value))}
          />
          <span className="font-bold text-white/50">×</span>
          <input
            className="score-input"
            inputMode="numeric"
            value={hasResult ? String(match.away_score) : away}
            disabled={disabled || hasResult}
            onChange={(e) => setAway(digit(e.target.value))}
          />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <span className="text-right font-semibold">
            {match.away_team?.name ?? "A definir"}
          </span>
          <span className="text-2xl">{match.away_team?.flag ?? "🏳️"}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm">
          {hasResult ? (
            match.prediction ? (
              <PointPill points={match.prediction.points} />
            ) : (
              <span className="text-white/50">Você não palpitou</span>
            )
          ) : disabled ? (
            <span className="text-xs text-white/50">
              🔒 Palpites fecham 5 min antes do início
            </span>
          ) : (
            <span className="text-xs text-white/50">
              {match.prediction ? "Palpite salvo" : "Crave o placar"}
            </span>
          )}
        </div>

        {!hasResult && !disabled && (
          <button
            className={`btn px-4 py-1.5 text-sm font-bold ${
              isSaved ? "border-0 bg-green-500 text-white" : "btn-go"
            }`}
            style={isSaved ? { backgroundColor: "#22c55e" } : undefined}
            onClick={save}
            disabled={saving || home === "" || away === ""}
          >
            {saving ? "..." : saved ? "✅ Palpite salvo!" : isSaved ? "✅ Salvo" : "Salvar"}
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
    </div>
  );
}
