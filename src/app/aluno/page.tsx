"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; points: number; watched: string[] };
type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; status: string; image_url?: string };
type Aviso = { id: string; text: string; active: boolean };

function level(pts: number) { return Math.floor(pts / 50) + 1; }
function xpInLevel(pts: number) { return pts % 50; }

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${parseInt(day)} ${months[parseInt(m) - 1]}`;
}

function Countdown({ lesson }: { lesson: Lesson }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = new Date(`${lesson.date}T${lesson.time}:00`).getTime();
    const update = () => setDiff(Math.max(0, target - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lesson]);

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[{ v: days, l: "DIAS" }, { v: hours, l: "HORAS" }, { v: mins, l: "MIN" }, { v: secs, l: "SEG" }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 32,
            color: "var(--green)", lineHeight: 1, minWidth: 56,
            background: "rgba(57,255,106,0.06)", border: "1px solid rgba(57,255,106,0.2)",
            padding: "10px 12px",
          }}>
            {String(v).padStart(2, "0")}
          </div>
          <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em", marginTop: 4 }}>{l}</div>
        </div>
      ))}
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
    setStudent(me.role === "admin"
      ? { id: "admin", name: "Admin (preview)", points: 0, watched: [] }
      : me);
    setLessons(aulas.aulas ?? []);
    setAvisos((av.avisos ?? []).filter((a: Aviso) => a.active));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Carregando…</p>
    </div>
  );

  const totalLessons = lessons.length;
  const watchedCount = student.watched.length;
  const pct = totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0;
  const lvl = level(student.points);
  const xp  = xpInLevel(student.points);

  const nextLesson = lessons
    .filter((l) => l.status === "agendada")
    .map((l) => ({ ...l, t: new Date(`${l.date}T${l.time}:00`).getTime() }))
    .filter(({ t }) => t > Date.now())
    .sort((a, b) => a.t - b.t)[0];

  const liveLesson = lessons.find((l) => l.status === "ao_vivo");

  const recentLessons = lessons
    .filter((l) => l.status === "gravada")
    .slice(-6)
    .reverse();

  const upcomingLessons = lessons
    .filter((l) => l.status === "agendada")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 4);

  const firstName = student.name.split(" ")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Avisos ─────────────────────────────────────── */}
      {avisos.map((a) => (
        <div key={a.id} style={{
          background: "rgba(57,255,106,0.06)", border: "1px solid rgba(57,255,106,0.25)",
          borderLeft: "4px solid var(--green)", padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 16 }}>📢</span>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>{a.text}</p>
        </div>
      ))}

      {/* ── Aula ao vivo ────────────────────────────────── */}
      {liveLesson && (
        <Link href={`/aluno/aulas/${liveLesson.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            background: "rgba(57,255,106,0.1)", border: "2px solid var(--green)",
            padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
            cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 22 }}>🔴</span>
              <div>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 16, color: "var(--green)" }}>
                  AO VIVO AGORA
                </div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 2 }}>{liveLesson.materia}</div>
              </div>
            </div>
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, color: "var(--green)", fontSize: 14 }}>
              Entrar →
            </span>
          </div>
        </Link>
      )}

      {/* ── Hero: boas-vindas + progresso ──────────────── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
      }}>
        {/* Boas-vindas */}
        <div className="card" style={{ padding: "28px 28px" }}>
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6 }}>Bem-vindo de volta,</p>
          <h1 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 26, marginBottom: 20, letterSpacing: "-0.02em" }}>
            {firstName} 👋
          </h1>

          {/* XP */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "Archivo, sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Nível {lvl}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{xp} / 50 XP</span>
            </div>
            <div style={{ background: "var(--border)", height: 6, borderRadius: 0 }}>
              <div style={{ background: "var(--green)", height: 6, width: `${(xp / 50) * 100}%`, transition: "width 0.6s ease" }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>{student.points} pontos totais</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Aulas assistidas", value: watchedCount },
              { label: "Total de aulas", value: totalLessons },
            ].map((s) => (
              <div key={s.label} style={{ background: "var(--highlight)", padding: "12px 14px" }}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, color: "var(--green)" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progresso + próxima aula */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Progresso geral */}
          <div className="card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <p className="label">Progresso geral</p>
              <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 20, color: "var(--green)" }}>{pct}%</span>
            </div>
            <div style={{ background: "var(--border)", height: 10, marginBottom: 14 }}>
              <div style={{ background: "var(--green)", height: 10, width: `${pct}%`, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {lessons.map((l) => (
                <div
                  key={l.id}
                  title={l.materia}
                  style={{
                    width: 14, height: 14,
                    background: student.watched.includes(l.id) ? "var(--green)" : "var(--border)",
                    transition: "background 0.2s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Countdown */}
          {nextLesson && (
            <div className="card" style={{ padding: "22px 24px", flex: 1 }}>
              <p className="label" style={{ marginBottom: 8 }}>Próxima aula</p>
              <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 14, color: "var(--text-muted)" }}>
                {nextLesson.materia}
                <span style={{ fontWeight: 400, color: "var(--text-dim)", fontSize: 12, marginLeft: 8 }}>
                  {formatDate(nextLesson.date)} · {nextLesson.time}
                </span>
              </p>
              <Countdown lesson={nextLesson} />
            </div>
          )}
        </div>
      </div>

      {/* ── Aulas recentes (gravadas) ────────────────────── */}
      {recentLessons.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p className="label">Aulas disponíveis</p>
            <Link href="/aluno/aulas" style={{ fontSize: 12, color: "var(--green)", textDecoration: "none", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {recentLessons.map((l) => (
              <Link key={l.id} href={`/aluno/aulas/${l.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ overflow: "hidden", transition: "border-color 0.15s" }}>
                  {/* Thumbnail */}
                  <div style={{
                    aspectRatio: "16/9", background: "var(--highlight)",
                    backgroundImage: l.image_url ? `url(${l.image_url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 36,
                  }}>
                    {!l.image_url && "🎓"}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 12, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700, marginBottom: 4 }}>
                      {student.watched.includes(l.id) ? "✓ Assistida" : "Gravada"}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", lineHeight: 1.3 }}>{l.materia}</div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>{l.palestrante}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Próximas aulas agendadas ─────────────────────── */}
      {upcomingLessons.length > 0 && (
        <div>
          <p className="label" style={{ marginBottom: 14 }}>Agenda</p>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {upcomingLessons.map((l, i) => (
              <div
                key={l.id}
                style={{
                  display: "flex", alignItems: "center", gap: 18,
                  padding: "16px 20px",
                  borderBottom: i < upcomingLessons.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ textAlign: "center", minWidth: 40, flexShrink: 0 }}>
                  <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, color: "var(--green)", lineHeight: 1 }}>
                    {l.date.split("-")[2]}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"][parseInt(l.date.split("-")[1]) - 1]}
                  </div>
                </div>
                <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.materia}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{l.palestrante} · {l.time}</div>
                </div>
                <div style={{
                  fontSize: 11, fontFamily: "Archivo, sans-serif", fontWeight: 700,
                  color: "var(--text-dim)", border: "1px solid var(--border)", padding: "3px 8px",
                }}>
                  AGENDADA
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
