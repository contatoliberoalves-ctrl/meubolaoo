"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/aluno",             label: "Início" },
  { href: "/aluno/aulas",       label: "Aulas" },
  { href: "/aluno/materiais",   label: "Materiais" },
  { href: "/aluno/ranking",     label: "Ranking" },
  { href: "/aluno/certificado", label: "Certificado" },
];

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function sair() {
    await fetch("/api/workshop/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Nav ── */}
      <nav style={{
        height: 60,
        background: "rgba(12,12,18,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 0,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/aluno" style={{ textDecoration: "none", marginRight: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, background: "var(--green)", borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 14, color: "#000" }}>W</span>
          </div>
          <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 14, color: "var(--text)", letterSpacing: "-0.01em" }}>
            Workshop
          </span>
        </Link>

        <div style={{ width: 1, height: 20, background: "var(--border-2)", marginRight: 20, flexShrink: 0 }} />

        {/* Tabs — desktop */}
        <div className="nav-tabs" style={{ display: "flex", gap: 2, flex: 1 }}>
          {TABS.map((t) => {
            const active = t.href === "/aluno" ? pathname === "/aluno" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "7px 13px", fontSize: 13, fontWeight: active ? 600 : 500,
                  color: active ? "var(--text)" : "var(--text-dim)",
                  background: active ? "rgba(255,255,255,0.07)" : "transparent",
                  borderRadius: 5, textDecoration: "none", whiteSpace: "nowrap",
                  transition: "color 0.15s, background 0.15s",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Perfil + Sair — desktop */}
        <div className="nav-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/aluno/perfil"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: pathname === "/aluno/perfil" ? "rgba(62,229,122,0.15)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${pathname === "/aluno/perfil" ? "rgba(62,229,122,0.3)" : "var(--border-2)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              textDecoration: "none", fontSize: 14, transition: "all 0.15s",
            }}
            title="Meu perfil"
          >
            👤
          </Link>
          <button
            onClick={sair}
            style={{
              background: "none", border: "1px solid var(--border-2)",
              color: "var(--text-dim)", fontSize: 12, padding: "6px 14px",
              cursor: "pointer", borderRadius: 4, letterSpacing: "0.02em",
              transition: "all 0.15s",
            }}
          >
            Sair →
          </button>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="nav-burger"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "none", background: "none", border: "1px solid var(--border-2)",
            color: "var(--text)", padding: "6px 10px", cursor: "pointer", borderRadius: 4,
            fontSize: 16, marginLeft: "auto",
          }}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", top: 60, left: 0, right: 0, zIndex: 49,
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          display: "flex", flexDirection: "column", gap: 2,
        }}>
          {TABS.map((t) => {
            const active = t.href === "/aluno" ? pathname === "/aluno" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "11px 14px", fontSize: 14, fontWeight: active ? 700 : 500,
                  color: active ? "var(--green)" : "var(--text)",
                  background: active ? "rgba(62,229,122,0.07)" : "transparent",
                  borderRadius: 6, textDecoration: "none",
                }}
              >
                {t.label}
              </Link>
            );
          })}
          <Link href="/aluno/perfil" onClick={() => setMenuOpen(false)} style={{ padding: "11px 14px", fontSize: 14, color: "var(--text-muted)", textDecoration: "none" }}>
            👤 Meu perfil
          </Link>
          <button onClick={sair} style={{ background: "none", border: "none", color: "var(--text-dim)", fontSize: 14, padding: "11px 14px", cursor: "pointer", textAlign: "left", borderRadius: 6 }}>
            Sair →
          </button>
        </div>
      )}

      {/* ── Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px" }}>
        {children}
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-tabs    { display: none !important; }
          .nav-actions { display: none !important; }
          .nav-burger  { display: flex !important; }
          main { padding: 24px 16px !important; }
        }
      `}</style>
    </div>
  );
}
