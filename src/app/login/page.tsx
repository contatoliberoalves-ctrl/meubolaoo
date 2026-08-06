"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [tab, setTab] = useState<"aluno" | "admin">("aluno");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div
        className="glow-bg"
        style={{
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "60px 48px", borderRight: "1px solid var(--border)", minWidth: 0,
        }}
      >
        <p className="label" style={{ marginBottom: 20 }}>Workshop · Direito</p>
        <h1
          style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900,
            fontSize: "clamp(28px, 4vw, 52px)", lineHeight: 1.05,
            letterSpacing: "-0.02em", color: "#fff", maxWidth: 520, marginBottom: 32,
          }}
        >
          Primeiros Passos do Jovem Advogado
        </h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["17 AGO", "18 AGO", "20 AGO"].map((d) => (
            <span key={d} className="badge-green" style={{ fontSize: 13, padding: "6px 14px" }}>{d}</span>
          ))}
        </div>
        <p style={{ marginTop: 24, color: "var(--text-muted)", fontSize: 14, maxWidth: 380 }}>
          Aulas ao vivo no YouTube · Materiais exclusivos · Progresso gamificado
        </p>
      </div>

      <div style={{ width: "420px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <p className="label" style={{ marginBottom: 20 }}>Entrar na plataforma</p>
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
            {(["aluno", "admin"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: "10px 0", background: "none", border: "none",
                  borderBottom: tab === t ? "2px solid var(--green)" : "2px solid transparent",
                  color: tab === t ? "var(--green)" : "var(--text-dim)",
                  fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13,
                  textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer", marginBottom: "-1px",
                }}
              >
                {t === "aluno" ? "Aluno" : "Administrador"}
              </button>
            ))}
          </div>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="accent-left" style={{ background: "var(--highlight)", padding: "10px 14px", color: "#ff6b6b", fontSize: 13 }}>
                {error}
              </div>
            )}
            <button className="btn-green" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
