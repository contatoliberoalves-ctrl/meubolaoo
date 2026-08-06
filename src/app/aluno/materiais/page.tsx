"use client";

import { useEffect, useState } from "react";

type Material = { id: string; materia: string; title: string; url: string };

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);

  useEffect(() => {
    fetch("/api/workshop/materiais").then((r) => r.json()).then((j) => setMateriais(j.materiais ?? []));
  }, []);

  const subjects = [...new Set(materiais.map((m) => m.materia))];

  return (
    <div>
      <div className="card glow-bg" style={{ padding: "28px 32px", marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 8 }}>Biblioteca</p>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 26, marginBottom: 8 }}>Materiais de apoio</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>PDFs exclusivos para complementar sua jornada no workshop.</p>
      </div>
      {subjects.length === 0 && <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: 40 }}>Nenhum material disponível ainda.</p>}
      {subjects.map((subject) => {
        const items = materiais.filter((m) => m.materia === subject);
        return (
          <div key={subject} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <p className="label" style={{ marginBottom: 0 }}>{subject}</p>
              <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{items.length} arquivo{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {items.map((m) => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div className="card accent-left" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--green)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}>
                    <div style={{ width: 40, height: 40, background: "rgba(57,255,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 11, color: "var(--green)", flexShrink: 0 }}>PDF</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                      <div style={{ fontSize: 12, color: "var(--green-dark)" }}>Abrir arquivo ↗</div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}