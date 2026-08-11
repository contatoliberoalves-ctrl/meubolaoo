"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FEATURES = [
  { icon: "▶", label: "Aulas ao vivo e gravadas" },
  { icon: "📄", label: "Materiais exclusivos em PDF" },
  { icon: "🏆", label: "Progresso gamificado com pontos" },
  { icon: "🎓", label: "Certificado de conclusão" },
];

export default function LoginPage() {
  const [tab, setTab]         = useState<"aluno" | "admin">("aluno");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/workshop/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role: tab }),
    });
    const j = await res.json();
    setLoading(false);
    if (!res.ok) { setError(j.error ?? "Erro ao entrar"); return; }
    router.push(tab === "admin" ? "/admin" : "/aluno");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg)" }}>

      {/* ── Painel esquerdo ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "60px 64px", borderRight: "1px solid var(--border)",
        position: "relative", overflow: "hidden", minWidth: 0,
      }}>
        {/* Glow de fundo */}
        <div style={{
          position: "absolute", top: "20%", left: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(62,229,122,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
          <div style={{
            width: 32, height: 32, background: "var(--green)", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 17, color: "#000" }}>W</span>
          </div>
          <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Workshop
          </span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 48, position: "relative" }}>
          <p style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 700,
            fontSize: 11, letterSpacing: "0.14em", color: "var(--green)",
            textTransform: "uppercase", marginBottom: 16,
          }}>
            Primeiros Passos do Jovem Advogado
          </p>
          <h1 style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900,
            fontSize: "clamp(30px, 3.5vw, 50px)", lineHeight: 1.08,
            letterSpacing: "-0.03em", color: "var(--text)", maxWidth: 480,
          }}>
            Sua carreira jurídica começa aqui.
          </h1>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {FEATURES.map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(62,229,122,0.08)",
                border: "1px solid rgba(62,229,122,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, flexShrink: 0,
              }}>
                {icon}
              </div>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Datas badge */}
        <div style={{ display: "flex", gap: 8, marginTop: 44, flexWrap: "wrap" }}>
          {["17 AGO", "18 AGO", "20 AGO"].map((d) => (
            <span key={d} style={{
              fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11,
              letterSpacing: "0.08em", color: "var(--green)",
              border: "1px solid rgba(62,229,122,0.25)", borderRadius: 4,
              padding: "5px 12px",
            }}>{d}</span>
          ))}
        </div>
      </div>

      {/* ── Painel direito — form ── */}
      <div style={{
        width: 440, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "48px 40px",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>

          {/* Tab switcher */}
          <div style={{
            display: "flex", gap: 4, marginBottom: 32,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: 4,
          }}>
            {(["aluno", "admin"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                style={{
                  flex: 1, padding: "9px 0",
                  background: tab === t ? "var(--surface-2)" : "transparent",
                  border: tab === t ? "1px solid var(--border-2)" : "1px solid transparent",
                  color: tab === t ? "var(--text)" : "var(--text-dim)",
                  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 12,
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  cursor: "pointer", borderRadius: 6,
                  transition: "all 0.15s",
                }}
              >
                {t === "aluno" ? "Aluno" : "Admin"}
              </button>
            ))}
          </div>

          <h2 style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22,
            letterSpacing: "-0.02em", marginBottom: 6,
          }}>
            {tab === "aluno" ? "Entrar na plataforma" : "Acesso administrativo"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 28 }}>
            {tab === "aluno" ? "Use o e-mail e a senha enviados pelo Workshop." : "Acesso restrito ao administrador."}
          </p>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label" style={{ marginBottom: 8 }}>E-mail</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" style={{ marginBottom: 8 }}>Senha</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 5, fontSize: 13,
                background: "rgba(255,100,100,0.07)",
                border: "1px solid rgba(255,100,100,0.2)",
                color: "#ff7070",
              }}>
                ✕ {error}
              </div>
            )}

            <button className="btn-green" type="submit" disabled={loading} style={{ marginTop: 4, width: "100%" }}>
              {loading ? "Entrando…" : "Entrar →"}
            </button>
          </form>
        </div>
      </div>

      {/* Mobile: colapsa o painel esquerdo */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="flex: 1"][style*="borderRight"] { display: none !important; }
          div[style*="width: 440px"] {
            width: 100% !important;
            padding: 40px 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
