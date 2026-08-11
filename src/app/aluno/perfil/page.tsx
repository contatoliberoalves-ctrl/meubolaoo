"use client";

import { useEffect, useState } from "react";

type Me = { id: string; name: string; email: string; points: number; watched: string[] };

function initials(name: string) {
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function level(pts: number)     { return Math.floor(pts / 50) + 1; }
function xpInLevel(pts: number) { return pts % 50; }

export default function PerfilPage() {
  const [me, setMe]           = useState<Me | null>(null);
  const [name, setName]       = useState("");
  const [curPwd, setCurPwd]   = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [cfmPwd, setCfmPwd]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/workshop/me").then((r) => r.json()).then((j) => {
      setMe(j);
      setName(j.name ?? "");
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPwd && newPwd !== cfmPwd) {
      setMsg({ text: "As senhas não coincidem.", ok: false }); return;
    }

    setSaving(true);
    const body: Record<string, string> = {};
    if (name.trim() && name.trim() !== me?.name) body.name = name.trim();
    if (newPwd) { body.current_password = curPwd; body.new_password = newPwd; }

    if (Object.keys(body).length === 0) {
      setSaving(false);
      setMsg({ text: "Nenhuma alteração detectada.", ok: false });
      return;
    }

    const res = await fetch("/api/workshop/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    setSaving(false);

    if (!res.ok) { setMsg({ text: j.error ?? "Erro ao salvar.", ok: false }); return; }

    setMe((prev) => prev ? { ...prev, name: j.name ?? prev.name } : prev);
    setCurPwd(""); setNewPwd(""); setCfmPwd("");
    setMsg({ text: "Perfil atualizado com sucesso!", ok: true });
  }

  if (!me) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <div style={{ width: 28, height: 28, border: "2px solid var(--border-2)", borderTopColor: "var(--green)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  const lvl = level(me.points);
  const xp  = xpInLevel(me.points);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "36px 40px",
        marginBottom: 24,
        display: "flex", alignItems: "center", gap: 28,
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(62,229,122,0.2) 0%, rgba(62,229,122,0.08) 100%)",
          border: "2px solid rgba(62,229,122,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "Archivo, sans-serif", fontWeight: 900,
            fontSize: 28, color: "var(--green)", letterSpacing: "-0.02em",
          }}>
            {initials(me.name)}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, letterSpacing: "-0.02em", marginBottom: 4 }}>
            {me.name}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 16 }}>{me.email}</p>

          {/* Stats inline */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { v: `Nível ${lvl}`, l: "ranking" },
              { v: me.points,      l: "pontos" },
              { v: me.watched.length, l: "aulas assistidas" },
            ].map(({ v, l }) => (
              <div key={l}>
                <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 18, color: "var(--green)", lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "20px 28px", marginBottom: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ color: "var(--text-dim)", fontFamily: "Archivo, sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Nível {lvl} → {lvl + 1}
          </span>
          <span style={{ color: "var(--green)" }}>{xp} / 50 XP</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", height: 6, borderRadius: 3 }}>
          <div style={{ background: "var(--green)", height: 6, borderRadius: 3, width: `${(xp / 50) * 100}%`, transition: "width 1s ease" }} />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
          Faltam {50 - xp} XP para o próximo nível. Ganhe pontos assistindo às aulas.
        </p>
      </div>

      {/* ── Formulário ── */}
      <form onSubmit={save} style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 8, padding: "32px 40px",
        display: "flex", flexDirection: "column", gap: 24,
      }}>
        <h3 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 0, letterSpacing: "-0.01em" }}>
          Editar perfil
        </h3>

        {/* Nome */}
        <div>
          <label className="label" style={{ marginBottom: 8 }}>Nome completo</label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
          <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-muted)", marginBottom: 20, letterSpacing: "0.02em" }}>
            Alterar senha <span style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 400 }}>(deixe em branco para não alterar)</span>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label className="label" style={{ marginBottom: 8 }}>Senha atual</label>
              <input className="input" type="password" placeholder="••••••••" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="label" style={{ marginBottom: 8 }}>Nova senha</label>
                <input className="input" type="password" placeholder="••••••••" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              </div>
              <div>
                <label className="label" style={{ marginBottom: 8 }}>Confirmar</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={cfmPwd}
                  onChange={(e) => setCfmPwd(e.target.value)}
                  style={{ borderColor: cfmPwd && cfmPwd !== newPwd ? "#ff6b6b" : undefined }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {msg && (
          <div style={{
            padding: "11px 16px", borderRadius: 5, fontSize: 13,
            background: msg.ok ? "rgba(62,229,122,0.08)" : "rgba(255,100,100,0.08)",
            border: `1px solid ${msg.ok ? "rgba(62,229,122,0.25)" : "rgba(255,100,100,0.25)"}`,
            color: msg.ok ? "var(--green)" : "#ff7070",
          }}>
            {msg.ok ? "✓ " : "✕ "}{msg.text}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-green" type="submit" disabled={saving} style={{ minWidth: 140 }}>
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
