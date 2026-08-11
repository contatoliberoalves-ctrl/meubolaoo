"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type LastLesson = { id: string; materia: string; palestrante: string; image_url?: string };
type Student    = { id: string; name: string; points: number; watched: string[]; last_lesson?: LastLesson | null };
type Lesson     = { id: string; date: string; time: string; materia: string; palestrante: string; status: string; image_url?: string };
type Aviso      = { id: string; text: string; active: boolean };

function level(pts: number)     { return Math.floor(pts / 50) + 1; }
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
    <div style={{ display: "flex", gap: 6 }}>
      {[{ v: d, l: "dias" }, { v: h, l: "h" }, { v: m, l: "min" }, { v: s, l: "seg" }].map(({ v, l }) => (
        <div key={l} style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 26, color: "#000",
            background: "var(--green)", lineHeight: 1, padding: "8px 10px", minWidth: 46, borderRadius: 4,
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
    setStudent(me.role === "admin"
      ? { id: "admin", name: "Admin (preview)", points: 0, watched: [], last_lesson: null }
      : me);
    setLessons(aulas.aulas ?? []);
    setAvisos((av.avisos ?? []).filter((a: Aviso) => a.active));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--border-2)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Carregando…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  const total      = lessons.length;
  const watched    = student.watched.length;
  const pct        = total > 0 ? Math.round((watched / total) * 100) : 0;
  const lvl        = level(student.points);
  const xp         = xpInLevel(student.points);
  const firstName  = student.name.split(" ")[0];
  const liveLesson = lessons.find((l) => l.status === "ao_vivo");
  const nextLesson = lessons
    .filter((l) => l.status === "agendada")
    .map((l) => ({ ...l, t: new Date(`${l.date}T${l.time}:00`).getTime() }))
    .filter(({ t }) => t > Date.now())
    .sort((a, b) => a.t - b.t)[0];
  const recorded   = lessons.filter((l) => l.status === "gravada").reverse().slice(0, 6);

  // Progresso por matéria
  const subjectProgress = (() => {
    const map: Record<string, { total: number; watched: number }> = {};
    lessons.forEach((l) => {
      if (!map[l.materia]) map[l.materia] = { total: 0, watched: 0 };
      map[l.materia].total++;
      if (student.watched.includes(l.id)) map[l.materia].watched++;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v, pct: Math.round((v.watched / v.total) * 100) }));
  })();
  const upcoming   = lessons
    .filter((l) => l.status === "agendada")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Avisos ── */}
      {avisos.map((a) => (
        <div key={a.id} style={{
          background: "rgba(62,229,122,0.05)",
          border: "1px solid rgba(62,229,122,0.18)",
          borderLeft: "3px solid var(--green)",
          borderRadius: 6,
          padding: "12px 18px", display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 15 }}>📢</span>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{a.text}</p>
        </div>
      ))}

      {/* ── Ao vivo ── */}
      {liveLesson && (
        <Link href={`/aluno/aulas/${liveLesson.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            background: "var(--green)", color: "#000", padding: "14px 22px",
            borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            transition: "opacity 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 11, letterSpacing: "0.12em" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#000", animation: "pulse-dot 1.2s infinite" }} />
                AO VIVO
              </span>
              <span style={{ width: 1, height: 16, background: "rgba(0,0,0,0.2)" }} />
              <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14 }}>{liveLesson.materia}</span>
            </div>
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13 }}>Entrar →</span>
          </div>
        </Link>
      )}

      {/* ── Continue de onde parou ── */}
      {student.last_lesson && (
        <Link href={`/aluno/aulas/${student.last_lesson.id}`} style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 6, overflow: "hidden",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(62,229,122,0.3)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{
              width: 72, minHeight: 54, flexShrink: 0,
              background: student.last_lesson.image_url
                ? `url(${student.last_lesson.image_url}) center/cover no-repeat`
                : "linear-gradient(135deg, #13131C 0%, #1A1A26 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!student.last_lesson.image_url && <span style={{ fontSize: 18, opacity: 0.2 }}>🎓</span>}
            </div>
            <div style={{ padding: "12px 18px", flex: 1 }}>
              <p style={{ fontSize: 10, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                ▶ Continue de onde parou
              </p>
              <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text)", lineHeight: 1.3 }}>
                {student.last_lesson.materia}
              </p>
              <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>
                {student.last_lesson.palestrante}
              </p>
            </div>
            <div style={{ paddingRight: 18, color: "var(--text-dim)", fontSize: 16 }}>→</div>
          </div>
        </Link>
      )}

      {/* ── Hero ── */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "36px 40px",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow sutil atrás */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 50% 60% at 0% 50%, rgba(62,229,122,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Esquerda */}
        <div style={{ position: "relative" }}>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 6, letterSpacing: "0.04em" }}>
            Bem-vindo de volta
          </p>
          <h1 style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900,
            fontSize: 38, letterSpacing: "-0.03em",
            color: "var(--text)", marginBottom: 28, lineHeight: 1,
          }}>
            {firstName} 👋
          </h1>

          {/* Progresso geral */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                Progresso geral
              </span>
              <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 800 }}>
                {pct}%
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", height: 6, borderRadius: 3 }}>
              <div style={{ background: "var(--green)", height: 6, borderRadius: 3, width: `${pct}%`, transition: "width 1s ease" }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 7 }}>
              {watched} de {total} aulas assistidas
            </p>
          </div>

          {/* XP */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                Nível {lvl}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{xp} / 50 XP</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", height: 3, borderRadius: 2 }}>
              <div style={{ background: "rgba(62,229,122,0.5)", height: 3, borderRadius: 2, width: `${(xp / 50) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Direita — stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 130 }}>
          {[
            { v: total,          l: "aulas no total",  c: "var(--text-dim)" },
            { v: watched,        l: "assistidas",       c: "var(--green)" },
            { v: student.points, l: "pontos",           c: "var(--text-dim)" },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 34, color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3, letterSpacing: "0.03em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Progresso por matéria ── */}
      {subjectProgress.length > 0 && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "24px 28px",
        }}>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 16, letterSpacing: "-0.02em", marginBottom: 20 }}>
            Progresso por matéria
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {subjectProgress.map(({ name, total: t, watched: w, pct: p }) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{name}</span>
                  <span style={{ fontSize: 11, color: p === 100 ? "var(--green)" : "var(--text-dim)", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                    {w}/{t} {p === 100 ? "✓ Completo" : `${p}%`}
                  </span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.06)", height: 5, borderRadius: 3 }}>
                  <div style={{
                    background: p === 100 ? "var(--green)" : "rgba(62,229,122,0.5)",
                    height: 5, borderRadius: 3, width: `${p}%`,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Próxima aula ── */}
      {nextLesson && !liveLesson && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 32, alignItems: "center",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, padding: "22px 28px",
        }}>
          <div>
            <p className="label" style={{ marginBottom: 8 }}>Próxima aula</p>
            <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
              {nextLesson.materia}
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
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
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>
              Aulas disponíveis
            </h2>
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
                    background: "var(--surface)",
                    border: `1px solid ${viu ? "rgba(62,229,122,0.3)" : "var(--border)"}`,
                    borderRadius: 6, overflow: "hidden",
                    transition: "border-color 0.2s, box-shadow 0.2s, transform 0.15s",
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      aspectRatio: "16/9",
                      background: l.image_url
                        ? `url(${l.image_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, #13131C 0%, #1A2030 100%)",
                      position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {!l.image_url && <span style={{ fontSize: 36, opacity: 0.15 }}>🎓</span>}
                      {viu && (
                        <div style={{
                          position: "absolute", top: 10, left: 10,
                          background: "var(--green)", color: "#000",
                          fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 10,
                          padding: "3px 8px", borderRadius: 3, letterSpacing: "0.04em",
                        }}>✓ ASSISTIDA</div>
                      )}
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4, color: "var(--text)", lineHeight: 1.3 }}>
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
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Agenda
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((l) => (
              <div key={l.id} style={{
                display: "grid", gridTemplateColumns: "120px 1fr auto",
                alignItems: "stretch",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 6, overflow: "hidden",
                transition: "border-color 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-2)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                {/* Capa */}
                <div style={{
                  background: l.image_url
                    ? `url(${l.image_url}) center/cover no-repeat`
                    : "linear-gradient(135deg, #13131C 0%, #1A2030 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: 80, position: "relative", flexShrink: 0,
                }}>
                  {!l.image_url && <span style={{ fontSize: 24, opacity: 0.12 }}>🎓</span>}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "rgba(0,0,0,0.55)", padding: "4px 8px", textAlign: "center",
                  }}>
                    <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 15, color: "var(--green)" }}>
                      {l.date.split("-")[2]}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--text-dim)", marginLeft: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {MONTHS[parseInt(l.date.split("-")[1]) - 1]}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{l.materia}</div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{l.palestrante} · {l.time}</div>
                </div>

                {/* Badge */}
                <div style={{ display: "flex", alignItems: "center", padding: "0 18px" }}>
                  <div style={{
                    fontSize: 10, fontFamily: "Archivo, sans-serif", fontWeight: 700,
                    color: "var(--text-dim)", border: "1px solid var(--border-2)",
                    padding: "4px 10px", borderRadius: 3, letterSpacing: "0.06em", whiteSpace: "nowrap",
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
