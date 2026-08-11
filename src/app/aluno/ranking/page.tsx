"use client";

import { useEffect, useState } from "react";

type Entry = { id: string; name: string; points: number };

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RankingPage() {
  const [ranking, setRanking] = useState<Entry[]>([]);
  const [myId, setMyId]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/workshop/ranking").then((r) => r.json()),
      fetch("/api/workshop/me").then((r) => r.json()),
    ]).then(([r, me]) => {
      setRanking(r.ranking ?? []);
      setMyId(me.id ?? null);
    });
  }, []);

  const maxPts = ranking[0]?.points ?? 1;

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
        border: "1px solid rgba(57,255,106,0.15)",
        padding: "32px 36px", marginBottom: 36,
      }}>
        <p style={{ color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Placar
        </p>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 30, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Ranking da turma
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Pontos acumulados por aulas assistidas e participação.
        </p>
      </div>

      {/* Pódio top 3 */}
      {ranking.length >= 3 && (
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 16, marginBottom: 48 }}>
          {/* 2º */}
          <PodiumBlock entry={ranking[1]} pos={2} myId={myId} height={90} />
          {/* 1º */}
          <PodiumBlock entry={ranking[0]} pos={1} myId={myId} height={120} />
          {/* 3º */}
          <PodiumBlock entry={ranking[2]} pos={3} myId={myId} height={70} />
        </div>
      )}

      {/* Lista completa */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ranking.map((entry, i) => {
          const isMe = entry.id === myId;
          const pct  = maxPts > 0 ? (entry.points / maxPts) * 100 : 0;
          return (
            <div key={entry.id} style={{
              display: "grid", gridTemplateColumns: "48px 1fr auto",
              alignItems: "center", gap: 16,
              background: isMe ? "rgba(57,255,106,0.07)" : "var(--sidebar)",
              border: `1px solid ${isMe ? "rgba(57,255,106,0.4)" : "var(--border)"}`,
              padding: "14px 20px",
              transition: "border-color 0.2s",
            }}>
              {/* Posição */}
              <div style={{
                fontFamily: "Archivo, sans-serif", fontWeight: 900,
                fontSize: i < 3 ? 22 : 16,
                color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text-dim)",
                textAlign: "center",
              }}>
                {i < 3 ? MEDALS[i] : `#${i + 1}`}
              </div>

              {/* Nome + barra */}
              <div>
                <div style={{
                  fontFamily: "Archivo, sans-serif", fontWeight: isMe ? 800 : 600,
                  fontSize: 14, marginBottom: 6,
                  color: isMe ? "var(--green)" : "#fff",
                }}>
                  {entry.name} {isMe && <span style={{ fontSize: 11, opacity: 0.7 }}>(você)</span>}
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", height: 4, borderRadius: 2 }}>
                  <div style={{
                    background: i === 0 ? "#FFD700" : isMe ? "var(--green)" : "rgba(57,255,106,0.4)",
                    height: 4, borderRadius: 2,
                    width: `${pct}%`, transition: "width 0.6s ease",
                  }} />
                </div>
              </div>

              {/* Pontos */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 20,
                  color: isMe ? "var(--green)" : "#fff",
                }}>{entry.points}</div>
                <div style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em" }}>pts</div>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: 60, fontSize: 14 }}>
          Nenhum aluno com pontos ainda.
        </p>
      )}
    </div>
  );
}

function PodiumBlock({ entry, pos, myId, height }: { entry: Entry; pos: number; myId: string | null; height: number }) {
  const isMe = entry.id === myId;
  const colors: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 120 }}>
      <div style={{ fontSize: 32 }}>{MEDALS[pos - 1]}</div>
      <div style={{
        fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 13,
        color: isMe ? "var(--green)" : "#fff",
        textAlign: "center", maxWidth: 100, lineHeight: 1.3,
      }}>
        {entry.name.split(" ")[0]}
      </div>
      <div style={{
        fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18,
        color: colors[pos],
      }}>{entry.points} pts</div>
      {/* Degrau */}
      <div style={{
        width: 100, height,
        background: `linear-gradient(180deg, ${colors[pos]}22 0%, ${colors[pos]}11 100%)`,
        border: `1px solid ${colors[pos]}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 28, color: colors[pos], opacity: 0.5 }}>
          {pos}
        </span>
      </div>
    </div>
  );
}
