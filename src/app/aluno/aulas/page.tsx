"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; status: string; image_url: string };
type Me = { watched: string[] };

export default function AulasPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [me, setMe]           = useState<Me | null>(null);
  const [query, setQuery]     = useState("");

  const load = useCallback(async () => {
    const [al, me] = await Promise.all([
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/me").then((r) => r.json()),
    ]);
    setLessons(al.aulas ?? []);
    setMe(me.role === "admin" ? { watched: [] } : me);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = lessons.filter((l) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      l.materia.toLowerCase().includes(q) ||
      l.palestrante.toLowerCase().includes(q)
    );
  });

  const days = [...new Set(filtered.map((l) => l.date))].sort();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 28, margin: 0 }}>Aulas</h2>
        {/* Busca */}
        <div style={{ position: "relative", minWidth: 260 }}>
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            color: "var(--text-dim)", fontSize: 14, pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar por matéria ou palestrante…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "var(--sidebar)", border: "1px solid var(--border)",
              color: "var(--text)", fontSize: 13, padding: "9px 14px 9px 36px",
              outline: "none", width: "100%", fontFamily: "Inter, sans-serif",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer",
                fontSize: 16, lineHeight: 1, padding: "0 4px",
              }}
            >×</button>
          )}
        </div>
      </div>

      {query && (
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 20 }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""} para "{query}"
        </p>
      )}

      {days.map((day) => {
        const dayLessons = filtered.filter((l) => l.date === day);
        return (
          <div key={day} style={{ marginBottom: 36 }}>
            <p className="label" style={{ marginBottom: 14 }}>{day}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {dayLessons.map((l) => {
                const watched = me?.watched.includes(l.id);
                return (
                  <Link key={l.id} href={`/aluno/aulas/${l.id}`} style={{ textDecoration: "none", color: "var(--text)" }}>
                    <div className="card" style={{ overflow: "hidden", borderColor: watched ? "var(--green)" : "var(--border)" }}>
                      <div style={{ aspectRatio: "16/9", background: l.image_url ? `url(${l.image_url}) center/cover no-repeat` : "var(--highlight)", position: "relative" }}>
                        <div style={{ position: "absolute", top: 8, right: 8 }}>
                          {l.status === "ao_vivo" ? (
                            <span className="badge-green pulse" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />Ao vivo
                            </span>
                          ) : l.status === "gravada" ? (
                            <span className="badge-green">Gravada</span>
                          ) : (
                            <span className="badge-dim">Agendada</span>
                          )}
                        </div>
                        {watched && (
                          <div style={{
                            position: "absolute", top: 8, left: 8,
                            background: "var(--green)", color: "#000",
                            fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 11, padding: "2px 7px",
                          }}>✓ Assistida</div>
                        )}
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{l.materia}</div>
                        <div style={{ color: "var(--green-dark)", fontSize: 13, marginBottom: 6 }}>{l.palestrante}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{l.date} · {l.time}</div>
                        <button
                          className="btn-green"
                          style={{ width: "100%", marginTop: 12, fontSize: 12, padding: "8px" }}
                          onClick={(e) => { e.preventDefault(); window.location.href = `/aluno/aulas/${l.id}`; }}
                        >
                          Assistir
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && lessons.length > 0 && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Nenhuma aula encontrada para "{query}"</p>
          <button onClick={() => setQuery("")} style={{ marginTop: 12, background: "none", border: "1px solid var(--border)", color: "var(--green)", padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>
            Limpar busca
          </button>
        </div>
      )}

      {lessons.length === 0 && (
        <p style={{ color: "var(--text-dim)" }}>Nenhuma aula cadastrada ainda.</p>
      )}
    </div>
  );
}
