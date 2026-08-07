"use client";

import { useEffect, useState } from "react";

type Material = { id: string; materia: string; title: string; url: string; image_url: string };

// Cores de fundo geradas por matéria quando não há capa
const COVER_COLORS = [
  "linear-gradient(135deg, #0d1a0f 0%, #1a2d10 100%)",
  "linear-gradient(135deg, #0d0f1a 0%, #101a2d 100%)",
  "linear-gradient(135deg, #1a0d0d 0%, #2d1010 100%)",
  "linear-gradient(135deg, #1a1a0d 0%, #2d2d10 100%)",
  "linear-gradient(135deg, #0d1a1a 0%, #102d2d 100%)",
];

function coverBg(index: number) { return COVER_COLORS[index % COVER_COLORS.length]; }

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);

  useEffect(() => {
    fetch("/api/workshop/materiais").then((r) => r.json()).then((j) => setMateriais(j.materiais ?? []));
  }, []);

  const subjects = [...new Set(materiais.map((m) => m.materia))];

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
        border: "1px solid rgba(57,255,106,0.15)",
        padding: "32px 36px", marginBottom: 36,
      }}>
        <p style={{ color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Biblioteca
        </p>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 30, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Materiais de apoio
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          PDFs exclusivos para complementar sua jornada no workshop.
        </p>
      </div>

      {subjects.length === 0 && (
        <p style={{ color: "var(--text-dim)", textAlign: "center", marginTop: 60, fontSize: 14 }}>
          Nenhum material disponível ainda.
        </p>
      )}

      {subjects.map((subject, si) => {
        const items = materiais.filter((m) => m.materia === subject);
        return (
          <div key={subject} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 16, margin: 0 }}>
                {subject}
              </h3>
              <span style={{ color: "var(--text-dim)", fontSize: 12 }}>
                {items.length} arquivo{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {items.map((m, mi) => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--sidebar)", border: "1px solid var(--border)",
                    overflow: "hidden", transition: "border-color 0.2s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--green)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    {/* Capa 16:9 */}
                    <div style={{
                      aspectRatio: "16/9", position: "relative",
                      background: m.image_url
                        ? `url(${m.image_url}) center/cover no-repeat`
                        : coverBg(si + mi),
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {!m.image_url && (
                        <div style={{ textAlign: "center" }}>
                          <div style={{
                            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13,
                            color: "var(--green)", letterSpacing: "0.12em",
                            border: "1px solid rgba(57,255,106,0.3)",
                            padding: "6px 14px", marginBottom: 10,
                          }}>PDF</div>
                          <div style={{ fontSize: 11, color: "var(--text-dim)", maxWidth: 140, lineHeight: 1.4, textAlign: "center" }}>
                            {m.materia}
                          </div>
                        </div>
                      )}
                      {/* Overlay no hover com ícone de download */}
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.45)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.2s",
                      }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                      >
                        <div style={{
                          background: "var(--green)", color: "#000",
                          fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13,
                          padding: "10px 20px", letterSpacing: "0.04em",
                        }}>
                          ↓ Baixar
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: "14px 16px" }}>
                      <p style={{
                        fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 14,
                        color: "#fff", marginBottom: 6, lineHeight: 1.3,
                      }}>
                        {m.title}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{m.materia}</span>
                        <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                          Abrir ↗
                        </span>
                      </div>
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
