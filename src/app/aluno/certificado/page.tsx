"use client";

import { useEffect, useRef, useState } from "react";

type Student = { name: string; points: number; watched: string[] };
type Lesson  = { id: string; status: string };

export default function CertificadoPage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [total, setTotal]     = useState(0);
  const [eligible, setElig]   = useState(false);
  const certRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/workshop/me").then((r) => r.json()),
      fetch("/api/workshop/aulas").then((r) => r.json()),
    ]).then(([me, al]) => {
      const s: Student = me.role === "admin"
        ? { name: "Admin (preview)", points: 0, watched: [] }
        : me;
      const aulas: Lesson[] = al.aulas ?? [];
      const gravadas = aulas.filter((a) => a.status === "gravada").length;
      setStudent(s);
      setTotal(aulas.length);
      const pct = aulas.length > 0 ? s.watched.length / aulas.length : 0;
      setElig(pct >= 0.8);
    });
  }, []);

  function handlePrint() {
    window.print();
  }

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <p style={{ color: "var(--text-dim)" }}>Carregando…</p>
    </div>
  );

  const pct     = total > 0 ? Math.round((student.watched.length / total) * 100) : 0;
  const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #111 0%, #0d1a0f 100%)",
        border: "1px solid rgba(57,255,106,0.15)",
        padding: "32px 36px", marginBottom: 36,
      }}>
        <p style={{ color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Conquista
        </p>
        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 30, marginBottom: 8, letterSpacing: "-0.02em" }}>
          Certificado de conclusão
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Disponível ao assistir pelo menos 80% das aulas.
        </p>
      </div>

      {!eligible ? (
        /* Progresso */
        <div style={{
          background: "var(--sidebar)", border: "1px solid var(--border)",
          padding: "40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎓</div>
          <h3 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, marginBottom: 12 }}>
            Quase lá, {student.name.split(" ")[0]}!
          </h3>
          <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 28 }}>
            Você assistiu <strong style={{ color: "#fff" }}>{student.watched.length} de {total}</strong> aulas.
            Faltam <strong style={{ color: "var(--green)" }}>{Math.ceil(total * 0.8) - student.watched.length}</strong> aula(s) para liberar o certificado.
          </p>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: "var(--text-dim)" }}>Progresso</span>
              <span style={{ color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 900 }}>{pct}% / 80%</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", height: 10, borderRadius: 5 }}>
              <div style={{ background: "var(--green)", height: 10, borderRadius: 5, width: `${pct}%`, transition: "width 0.8s ease" }} />
            </div>
            {/* Marcador 80% */}
            <div style={{ position: "relative", marginTop: 4, maxWidth: 400 }}>
              <div style={{ position: "absolute", left: "80%", transform: "translateX(-50%)", fontSize: 10, color: "var(--text-dim)" }}>
                ▲ 80%
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Certificado */
        <div>
          <div style={{ marginBottom: 20, display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={handlePrint}
              style={{
                background: "var(--green)", color: "#000",
                fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13,
                border: "none", padding: "10px 24px", cursor: "pointer", letterSpacing: "0.04em",
              }}
            >
              🖨️ Imprimir / Salvar PDF
            </button>
          </div>

          {/* O certificado em si */}
          <div ref={certRef} id="certificado" style={{
            background: "#0a0a0a",
            border: "2px solid rgba(57,255,106,0.4)",
            padding: "60px 72px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Bordas decorativas nos cantos */}
            {[
              { top: 16, left: 16, borderTop: "2px solid var(--green)", borderLeft: "2px solid var(--green)" },
              { top: 16, right: 16, borderTop: "2px solid var(--green)", borderRight: "2px solid var(--green)" },
              { bottom: 16, left: 16, borderBottom: "2px solid var(--green)", borderLeft: "2px solid var(--green)" },
              { bottom: 16, right: 16, borderBottom: "2px solid var(--green)", borderRight: "2px solid var(--green)" },
            ].map((style, i) => (
              <div key={i} style={{ position: "absolute", width: 32, height: 32, ...style }} />
            ))}

            {/* Logo / header */}
            <div style={{
              fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 13,
              color: "var(--green)", letterSpacing: "0.2em", textTransform: "uppercase",
              marginBottom: 40,
            }}>
              Workshop · Primeiros Passos do Jovem Advogado
            </div>

            {/* Ícone */}
            <div style={{ fontSize: 64, marginBottom: 24 }}>🏛️</div>

            {/* Título */}
            <h1 style={{
              fontFamily: "Archivo, sans-serif", fontWeight: 900,
              fontSize: 36, letterSpacing: "-0.02em",
              color: "#fff", marginBottom: 8, lineHeight: 1,
            }}>
              Certificado de Conclusão
            </h1>
            <div style={{ width: 80, height: 2, background: "var(--green)", margin: "20px auto 32px" }} />

            {/* Texto */}
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 12, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Certificamos que
            </p>
            <h2 style={{
              fontFamily: "Archivo, sans-serif", fontWeight: 900,
              fontSize: 42, color: "var(--green)", marginBottom: 12,
              letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              {student.name}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 32, lineHeight: 1.7, maxWidth: 520, margin: "0 auto 32px" }}>
              concluiu com êxito o programa <strong style={{ color: "#fff" }}>Workshop: Primeiros Passos do Jovem Advogado</strong>,
              tendo assistido <strong style={{ color: "var(--green)" }}>{student.watched.length} aulas</strong> e acumulado{" "}
              <strong style={{ color: "var(--green)" }}>{student.points} pontos</strong>.
            </p>

            {/* Data */}
            <div style={{ width: 80, height: 1, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, letterSpacing: "0.06em" }}>
              {dateStr}
            </p>

            {/* Assinatura placeholder */}
            <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 80 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 120, height: 1, background: "rgba(255,255,255,0.25)", marginBottom: 8 }} />
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Coordenação
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          body { background: #000 !important; }
          #certificado {
            border: 2px solid #39ff6a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
