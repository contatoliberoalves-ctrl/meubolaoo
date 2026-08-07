"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; points: number; watched: string[] };
type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; status: string };
type Aviso = { id: string; text: string; active: boolean; created_at: string };

function level(pts: number) { return Math.floor(pts / 50) + 1; }
function xpInLevel(pts: number) { return pts % 50; }

function Countdown({ lessons }: { lessons: Lesson[] }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(id); }, []);
  const now = Date.now();
  const next = lessons.filter((l) => l.status === "agendada").map((l) => ({ l, t: new Date(`${l.date}T${l.time}:00`).getTime() })).filter(({ t }) => t > now).sort((a, b) => a.t - b.t)[0];
  if (!next) return <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Todas as aulas já foram realizadas.</div>;
  const diff = Math.max(0, next.t - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return (
    <div>
      <p className="label" style={{ marginBottom: 10 }}>Próxima aula</p>
      <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{next.l.materia}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ v: days, l: "dias" }, { v: hours, l: "h" }, { v: mins, l: "min" }, { v: secs, l: "seg" }].map(({ v, l }) => (
          <div key={l} style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "10px 14px", textAlign: "center", minWidth: 52 }}>
            <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, color: "var(--green)" }}>{String(v).padStart(2, "0")}</div>
            <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlunoHome() {
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const load = useCallback(async () => {
    const [me, aulas, av] = await Promise.all([
      fetch("/api/workshop/me").then((r) => r.json()),
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/avisos").then((r) => r.json()),
    ]);
    // Admin preview: provide default student shape
    setStudent(me.role === "admin"
      ? { id: "admin", name: "Admin (preview)", points: 0, watched: [] }
      : me);
    setLessons(aulas.aulas ?? []);
    setAvisos((av.avisos ?? []).filter((a: Aviso) => a.active));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!student) return <p style={{ color: "var(--text-dim)" }}>Carregando…</p>;

  const totalLessons = lessons.length;
  const watchedCount = student.watched.length;
  const pct = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;
  const lvl = level(student.points);
  const xp = xpInLevel(student.points);
  const circumference = 2 * Math.PI * 54;
  const days = [...new Set(lessons.map((l) => l.date))].sort();
  const upcomingLessons = lessons.filter((l) => l.status === "agendada").sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {avisos.map((a) => (
        <div key={a.id} className="accent-left" style={{ background: "var(--highlight)", padding: "14px 18px" }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{a.text}</p>
        </div>
      ))}

      <div className="card glow-bg" style={{ padding: "28px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, color: "#000" }}>{student.name.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 18 }}>{student.name}</div>
              <div style={{ color: "var(--text-dim)", fontSize: 13 }}>Nível {lvl}</div>
            </div>
          </div>
          <p className="label">XP</p>
          <div style={{ background: "var(--border)", height: 6, marginBottom: 4 }}>
            <div style={{ background: "var(--green)", height: 6, width: `${(xp / 50) * 100}%` }} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-dim)" }}>{xp} / 50 XP · {student.points} pontos totais</p>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 32 }}>
          <Countdown lessons={lessons} />
        </div>
      </div>

      <div className="card" style={{ padding: "24px 28px" }}>
        <p className="label" style={{ marginBottom: 16 }}>Progresso geral</p>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width={120} height={120} style={{ flexShrink: 0 }}>
            <circle cx={60} cy={60} r={54} fill="none" stroke="var(--border)" strokeWidth={8} />
            <circle cx={60} cy={60} r={54} fill="none" stroke="var(--green)" strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - pct / 100)} strokeLinecap="butt" transform="rotate(-90 60 60)" />
            <text x={60} y={65} textAnchor="middle" fill="#fff" fontFamily="Archivo, sans-serif" fontWeight="900" fontSize={22}>{pct}%</text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 16 }}>
              {lessons.map((l) => (
                <div key={l.id} style={{ width: 16, height: 16, background: student.watched.includes(l.id) ? "var(--green)" : "var(--border)" }} title={l.materia} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {days.map((d, i) => {
                const dayLessons = lessons.filter((l) => l.date === d);
                const allWatched = dayLessons.every((l) => student.watched.includes(l.id));
                return (
                  <div key={d} style={{ width: 36, height: 36, border: `2px solid ${allWatched ? "var(--green)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 13, color: allWatched ? "var(--green)" : "var(--text-dim)" }} title={`Dia ${i + 1} · ${d}`}>
                    {allWatched ? "✓" : i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {upcomingLessons.length > 0 && (
        <div className="card" style={{ padding: "24px 28px" }}>
          <p className="label" style={{ marginBottom: 14 }}>Próximas aulas</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {upcomingLessons.map((l) => (
              <Link key={l.id} href={`/aluno/aulas/${l.id}`} className="accent-left" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "var(--text)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.materia}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{l.date} · {l.time} · {l.palestrante}</div>
                </div>
                <span style={{ color: "var(--green)", fontSize: 18 }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}