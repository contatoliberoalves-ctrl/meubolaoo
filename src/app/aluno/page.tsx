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
const MONTHS_FULL = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function Countdown({ lesson }: { lesson: Lesson }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    // Força parse como horário LOCAL (sem timezone offset do ISO 8601)
    const [year, month, day] = lesson.date.split("-").map(Number);
    const [hour, min] = lesson.time.split(":").map(Number);
    const target = new Date(year, month - 1, day, hour, min, 0).getTime();
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
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, color: "#000",
            background: "var(--green)", lineHeight: 1, padding: "7px 9px", minWidth: 40, borderRadius: 4,
          }}>{pad(v)}</div>
          <div style={{ fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.08em", marginTop: 3, textTransform: "uppercase" }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

// Cores de acento por índice para o progresso
const ACCENT_COLORS = [
  { bar: "#3EE57A", bg: "rgba(62,229,122,0.08)", border: "rgba(62,229,122,0.2)" },
  { bar: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  { bar: "#F472B6", bg: "rgba(244,114,182,0.08)", border: "rgba(244,114,182,0.2)" },
  { bar: "#FBBF24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  },
  { bar: "#A78BFA", bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.2)" },
  { bar: "#34D399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"  },
];

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
        <div style={{ width: 28, height: 28, border: "2px solid var(--border-2)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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

  // Comparação por string local evita bugs de fuso horário com Date parsing
  const nowStr = (() => {
    const n = new Date();
    const pad = (x: number) => String(x).padStart(2, "0");
    return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
  })();
  const nextLesson = lessons
    .filter((l) => l.status === "agendada")
    .filter((l) => `${l.date}T${l.time}` > nowStr)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
  const recorded   = lessons.filter((l) => l.status === "gravada").reverse().slice(0, 6);
  const upcoming   = lessons
    .filter((l) => l.status === "agendada")
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 6);

  // Progresso por matéria
  const subjectProgress = (() => {
    const map: Record<string, { total: number; watched: number }> = {};
    lessons.forEach((l) => {
      if (!map[l.materia]) map[l.materia] = { total: 0, watched: 0 };
      map[l.materia].total++;
      if (student.watched.includes(l.id)) map[l.materia].watched++;
    });
    return Object.entries(map).map(([name, v]) => ({
      name, ...v, pct: Math.round((v.watched / v.total) * 100),
    }));
  })();

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

      {/* ══════════════════════════════════════════
          ── AGENDA com capas grandes ──
          ══════════════════════════════════════════ */}
      {upcoming.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>
              Próximas aulas
            </h2>
            <Link href="/aluno/aulas" style={{ fontSize: 12, color: "var(--green)", textDecoration: "none", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
              Ver todas →
            </Link>
          </div>

          {/* Primeira aula em destaque se houver nextLesson */}
          {nextLesson && !liveLesson && (
            <div style={{
              position: "relative", borderRadius: 8, overflow: "hidden",
              border: "1px solid var(--border)", marginBottom: 12,
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(62,229,122,0.35)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Capa grande */}
              <div style={{
                height: 200,
                background: nextLesson.image_url
                  ? `url(${nextLesson.image_url}) center/cover no-repeat`
                  : "linear-gradient(135deg, #0E0E1A 0%, #131325 50%, #0E1A13 100%)",
                position: "relative",
              }}>
                {!nextLesson.image_url && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 48, opacity: 0.08 }}>🎓</span>
                  </div>
                )}
                {/* Overlay gradiente */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(12,12,18,0.92) 0%, rgba(12,12,18,0.3) 60%, transparent 100%)",
                }} />
                {/* Badge PRÓXIMA */}
                <div style={{
                  position: "absolute", top: 14, left: 14,
                  background: "rgba(62,229,122,0.15)", border: "1px solid rgba(62,229,122,0.3)",
                  borderRadius: 4, padding: "4px 10px",
                  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 10,
                  color: "var(--green)", letterSpacing: "0.10em", textTransform: "uppercase",
                }}>
                  Próxima
                </div>
                {/* Info sobre a imagem */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px" }}>
                  <p style={{
                    fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18,
                    color: "#fff", lineHeight: 1.25, marginBottom: 6,
                    textShadow: "0 1px 8px rgba(0,0,0,0.6)",
                  }}>
                    {nextLesson.materia}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {nextLesson.palestrante} · {parseInt(nextLesson.date.split("-")[2])} de {MONTHS_FULL[parseInt(nextLesson.date.split("-")[1]) - 1]} · {nextLesson.time}
                    </p>
                    <Countdown lesson={nextLesson} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Restante da agenda — grid de cards com capa */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {upcoming
              .filter((l) => l.id !== nextLesson?.id)
              .map((l) => {
                const day   = l.date.split("-")[2];
                const month = MONTHS[parseInt(l.date.split("-")[1]) - 1];
                return (
                  <div key={l.id} style={{
                    borderRadius: 6, overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    transition: "border-color 0.2s, transform 0.15s, box-shadow 0.15s",
                    cursor: "default",
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.35)";
                      e.currentTarget.style.borderColor = "var(--border-2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}
                  >
                    {/* Capa 16:9 */}
                    <div style={{
                      aspectRatio: "16/9", position: "relative",
                      background: l.image_url
                        ? `url(${l.image_url}) center/cover no-repeat`
                        : "linear-gradient(135deg, #0E0E1A 0%, #1A1325 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {!l.image_url && <span style={{ fontSize: 28, opacity: 0.1 }}>🎓</span>}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(12,12,18,0.7) 0%, transparent 60%)",
                      }} />
                      {/* Data sobre a imagem */}
                      <div style={{
                        position: "absolute", bottom: 8, left: 10,
                        display: "flex", alignItems: "baseline", gap: 4,
                      }}>
                        <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 20, color: "var(--green)", lineHeight: 1 }}>
                          {day}
                        </span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {month}
                        </span>
                      </div>
                      {/* Horário */}
                      <div style={{
                        position: "absolute", bottom: 8, right: 10,
                        fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "Archivo, sans-serif", fontWeight: 700,
                      }}>
                        {l.time}
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text)", lineHeight: 1.3, marginBottom: 3 }}>
                        {l.materia}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-dim)" }}>{l.palestrante}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ── HERO / STATS ──
          ══════════════════════════════════════════ */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "32px 36px",
        display: "grid", gridTemplateColumns: "1fr auto", gap: 36, alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(ellipse 50% 60% at 0% 50%, rgba(62,229,122,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative" }}>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginBottom: 4, letterSpacing: "0.04em" }}>
            Bem-vindo de volta
          </p>
          <h1 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 34, letterSpacing: "-0.03em", color: "var(--text)", marginBottom: 24, lineHeight: 1 }}>
            {firstName} 👋
          </h1>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>Progresso geral</span>
              <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 800 }}>{pct}%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", height: 6, borderRadius: 3 }}>
              <div style={{ background: "var(--green)", height: 6, borderRadius: 3, width: `${pct}%`, transition: "width 1s ease" }} />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6 }}>{watched} de {total} aulas assistidas</p>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>Nível {lvl}</span>
              <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{xp} / 50 XP</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.06)", height: 3, borderRadius: 2 }}>
              <div style={{ background: "rgba(62,229,122,0.5)", height: 3, borderRadius: 2, width: `${(xp / 50) * 100}%` }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 120 }}>
          {[
            { v: total,          l: "aulas no total",  c: "var(--text-muted)" },
            { v: watched,        l: "assistidas",       c: "var(--green)" },
            { v: student.points, l: "pontos",           c: "var(--text-muted)" },
          ].map(({ v, l, c }) => (
            <div key={l} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 30, color: c, lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ── PROGRESSO POR MATÉRIA — cards visuais ──
          ══════════════════════════════════════════ */}
      {subjectProgress.length > 0 && (
        <div>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em", marginBottom: 16 }}>
            Progresso por matéria
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {subjectProgress.map(({ name, total: t, watched: w, pct: p }, i) => {
              const accent = p === 100
                ? { bar: "#3EE57A", bg: "rgba(62,229,122,0.08)", border: "rgba(62,229,122,0.25)" }
                : ACCENT_COLORS[i % ACCENT_COLORS.length];
              return (
                <div key={name} style={{
                  background: accent.bg,
                  border: `1px solid ${accent.border}`,
                  borderRadius: 8, padding: "18px 20px",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Topo: nome + badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, gap: 10 }}>
                    <p style={{
                      fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13,
                      color: "var(--text)", lineHeight: 1.35, flex: 1,
                    }}>
                      {name}
                    </p>
                    {p === 100 ? (
                      <span style={{
                        background: "rgba(62,229,122,0.15)", color: "var(--green)",
                        fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 10,
                        padding: "3px 8px", borderRadius: 3, letterSpacing: "0.06em",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>✓ OK</span>
                    ) : (
                      <span style={{
                        color: accent.bar, fontFamily: "Archivo, sans-serif",
                        fontWeight: 900, fontSize: 18, lineHeight: 1, flexShrink: 0,
                      }}>{p}%</span>
                    )}
                  </div>

                  {/* Barra de progresso */}
                  <div style={{ background: "rgba(255,255,255,0.07)", height: 6, borderRadius: 3, marginBottom: 10 }}>
                    <div style={{
                      background: accent.bar, height: 6, borderRadius: 3,
                      width: `${p}%`, transition: "width 1.2s ease",
                    }} />
                  </div>

                  {/* Aulas */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {w} de {t} aula{t !== 1 ? "s" : ""}
                    </span>
                    {/* Mini dots */}
                    <div style={{ display: "flex", gap: 3 }}>
                      {Array.from({ length: t }).map((_, di) => (
                        <div key={di} style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: di < w ? accent.bar : "rgba(255,255,255,0.1)",
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

    </div>
  );
}
