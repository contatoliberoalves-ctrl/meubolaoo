"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; status: string; image_url: string };
type Me = { watched: string[] };

export default function AulasPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [me, setMe] = useState<Me | null>(null);

  const load = useCallback(async () => {
    const [al, me] = await Promise.all([
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/me").then((r) => r.json()),
    ]);
    setLessons(al.aulas ?? []);
    setMe(me);
  }, []);

  useEffect(() => { load(); }, [load]);

  const days = [...new Set(lessons.map((l) => l.date))].sort();

  return (
    <div>
      <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 28 }}>Aulas</h2>
      {days.map((day) => {
        const dayLessons = lessons.filter((l) => l.date === day);
        return (
          <div key={day} style={{ marginBottom: 36 }}>
            <p className="label" style={{ marginBottom: 14 }}>{day}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {dayLessons.map((l) => {
                const watched = me?.watched.includes(l.id);
                return (
                  <Link key={l.id} href={`/aluno/aulas/${l.id}`} style={{ textDecoration: "none", color: "var(--text)" }}>
                    <div className="card" style={{ overflow: "hidden", borderColor: watched ? "var(--green)" : "var(--border)" }}>
                      <div style={{ aspectRatio: "16/9", background: l.image_url ? `url(${l.image_url}) center/cover no-repeat` : "var(--highlight)", position: "relative" }}>
                        <div style={{ position: "absolute", top: 8, right: 8 }}>
                          {l.status === "ao_vivo" ? <span className="badge-green pulse" style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />Ao vivo</span> : l.status === "gravada" ? <span className="badge-green">Gravada</span> : <span className="badge-dim">Agendada</span>}
                        </div>
                        {watched && <div style={{ position: "absolute", top: 8, left: 8, background: "var(--green)", color: "#000", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 11, padding: "2px 7px" }}>✓ Assistida</div>}
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{l.materia}</div>
                        <div style={{ color: "var(--green-dark)", fontSize: 13, marginBottom: 6 }}>{l.palestrante}</div>
                        <div style={{ color: "var(--text-dim)", fontSize: 12 }}>{l.date} · {l.time}</div>
                        <button className="btn-green" style={{ width: "100%", marginTop: 12, fontSize: 12, padding: "8px" }} onClick={(e) => { e.preventDefault(); window.location.href = `/aluno/aulas/${l.id}`; }}>Assistir</button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
      {lessons.length === 0 && <p style={{ color: "var(--text-dim)" }}>Nenhuma aula cadastrada ainda.</p>}
    </div>
  );
}