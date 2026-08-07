"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Student = { id: string; name: string; points: number; watched: string[] };
type Lesson  = { id: string; date: string; time: string; materia: string; palestrante: string; status: string; image_url?: string };
type Aviso   = { id: string; text: string; active: boolean };

function level(pts: number)   { return Math.floor(pts / 50) + 1; }
function xpInLevel(pts: number) { return pts % 50; }

const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${parseInt(day)} ${MONTHS[parseInt(m) - 1]}`;
}

function Countdown({ lesson }: { lesson: Lesson }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const target = new Date(`${lesson.date}T${lesson.time}:00`).getTime();
    const upd = () => setDiff(Math.max(0, target - Date.now()));
    upd(); const id = setInterval(upd, 1000); return () => clearInterval(id);
  }, [lesson]);
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
      {[{ v: d, l: "dias" }, { v: h, l: "h" }, { v: m, l: "min" }, { v: s, l: "seg" }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 28, color: "#000",
            background: "var(--green)", lineHeight: 1, padding: "8px 12px", minWidth: 50,
          }}>{pad(v)}</div>
          <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.08em", marginTop: 4, textTransform: "uppercase" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function AlunoHome() {
  const [student, setStudent] = useState<Student | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [avisos, setAvisos]   = useState<Aviso[]>([]);

  const load = useCallback(async () => {
    const [me, aulas, av] = await Promise.all([
      fetch("/api/workshop/me").then((r) => r.json()),
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/avisos").then((r) => r.json()),
    ]);
    setStudent(me.role === "admin" ? { id: "admin", name: "Admin (preview)", points: 0, watched: [] } : me);
    setLessons(aulas.aulas ?? []);
    setAvisos((av.avisos ?? []).filter((a: Aviso) => a.active));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
      <p style={{ color: "var(--text-dim)" }}>Carregando…</p>
    </div>
  );

  const total        = lessons.length;
  const watched      = student.watched.length;
  const pct          = total > 0 ? Math.round((watched / total) * 100) : 0;
  const lvl          = level(student.points);
  const xp           = xpInLevel(student.points);
  const firstName    = student.name.split(" ")[0];
  const liveLesson   = lessons.find((l) => l.status === "ao_vivo");
  const nextLesson   = lessons
    .filter((l) => l.status === "agendada")
    .map((l) => ({ ...l, t: new Date(`${l.date}T${l.time}:00`).getTime() }))
    .filter(({ t }) => t > Date.now())
    .sort((a, b) => a.t - b.t)[0];
  const recorded     = lessons.filter((l) => l.status === "gravada").reverse();
  const upcoming     = lessons
    .filter((l) => l.status === "agendada")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ── Avisos ── */}
      {avisos.map((a) => (
        <div key={a.id} style={{
          background: "rgba(57,255,106,0.07)", borderLeft: "3px solid var(--green)",
          padding: "13px 18px", display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span>📢</span>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>{a.text}</p>
        </div>
      ))}

      {/* ── Ao vivo ── */}
      {liveLesson && (
        <Link href={`/aluno/aulas/${liveLesson.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--green)", color: "#000", padding: "18px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 12, letterSpacing: "0.1em",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#000", animation: "pulse 1.2s infinite" }} />
                AO VIVO
              </span>
              <span style={{ width: 1, height: 18, background: "rgba(0,0,0,0.2)" }} />
              <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 15 }}>{liveLesson.materia}</span>
            </div>
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13 }}>Entrar →</span>
          </div>
        </Link>
      )}

      {/* ── Hero banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
        border: "1px solid rgba(57,255,106,0.15)",
        padding: "36px 40px",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center",
      }}>
        {/* Esquerda */}
        <div>
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 6, letterSpacing: "0.04em" }}>
            Bem-vindo de volta
          </p>
          <h1 style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 36,
            letterSpacing: "-0.03em", color: "#fff", marginBottom: 24, lineHeight: 1,
          }}>
            {firstName} 👋
          </h1>

          {/* Barra de progresso geral */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                Progresso geral
              </span>
              <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 900 }}>
                {pct}%
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", height: 8 }}>
              <div style={{ background: "var(--green)", height: 8, width: `${pct}%`, transition: "width 0.8s ease" }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
              {watched} de {total} aulas assistidas
            </p>
          </div>

          {/* XP */}
          <div style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                Nível {lvl}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{xp} / 50 XP</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", height: 4 }}>
              <div style={{ background: "rgba(57,255,106,0.6)", height: 4, width: `${(xp / 50) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Direita: stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 140 }}>
          {[
            { v: total,   l: "aulas no total" },
            { v: watched, l: "assistidas" },
            { v: student.points, l: "pontos" },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 32, color: "var(--green)", lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, letterSpacing: "0.04em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Próxima aula ── */}
      {nextLesson && !liveLesson && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          background: "var(--sidebar)", border: "1px solid var(--border)", padding: "24px 28px",
        }}>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>Próxima aula</p>
            <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
              {nextLesson.materia}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
              {fmtDate(nextLesson.date)} · {nextLesson.time} · {nextLesson.palestrante}
            </p>
          </div>
          <Countdown lesson={nextLesson} />
        </div>
      )}

      {/* ── Aulas gravadas ── */}
      {recorded.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18 }}>Aulas disponíveis</h2>
            <Link href="/aluno/aulas" style={{ fontSize: 12, color: "var(--green)", textDecoration: "none", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
              Ver todas →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {recorded.map((l) => {
              const viu = student.watched.includes(l.id);
              return (
                <Link key={l.id} href={`/aluno/aulas/${l.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--sidebar)", border: `1px solid ${viu ? "rgba(57,255,106,0.4)" : "var(--border)"}`,
                    overflow: "hidden", transition: "border-color 0.2s, transform 0.15s",
                  }}>
                    {/* Thumbnail 16:9 */}
                    <div style={{
                      aspectRatio: "16/9",
                      background: l.image_url
                        ? `url(${l.image_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
                      position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {!l.image_url && (
                        <span style={{ fontSize: 40, opacity: 0.3 }}>🎓</span>
                      )}
                      {viu && (
                        <div style={{
                          position: "absolute", top: 10, left: 10,
                          background: "var(--green)", color: "#000",
                          fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 10,
                          padding: "3px 8px", letterSpacing: "0.04em",
                        }}>✓ ASSISTIDA</div>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4, color: "#fff", lineHeight: 1.3 }}>
                        {l.materia}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-dim)" }}>{l.palestrante}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Agenda ── */}
      {upcoming.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 16 }}>Agenda</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcoming.map((l) => (
              <div key={l.id} style={{
                display: "grid", gridTemplateColumns: "140px 1fr auto",
                gap: 0, alignItems: "stretch",
                border: "1px solid var(--border)", overflow: "hidden",
                background: "var(--sidebar)",
              }}>
                {/* Capa */}
                <div style={{
                  background: l.image_url
                    ? `url(${l.image_url}) center/cover no-repeat`
                    : "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: 80, position: "relative", flexShrink: 0,
                }}>
                  {!l.image_url && <span style={{ fontSize: 28, opacity: 0.25 }}>🎓</span>}
                  {/* Data sobreposta na capa */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.65)", padding: "4px 8px", textAlign: "center",
                  }}>
                    <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 15, color: "var(--green)" }}>
                      {l.date.split("-")[2]}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-dim)", marginLeft: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {MONTHS[parseInt(l.date.split("-")[1]) - 1]}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{l.materia}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{l.palestrante} · {l.time}</div>
                </div>

                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 18px" }}>
                  <div style={{
                    fontSize: 10, fontFamily: "Archivo, sans-serif", fontWeight: 700,
                    color: "var(--text-dim)", border: "1px solid var(--border)",
                    padding: "4px 10px", letterSpacing: "0.06em", whiteSpace: "nowrap",
                  }}>
                    AGENDADA
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
