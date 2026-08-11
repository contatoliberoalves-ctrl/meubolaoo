"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/aluno",             label: "Início" },
  { href: "/aluno/aulas",       label: "Aulas" },
  { href: "/aluno/materiais",   label: "Materiais" },
  { href: "/aluno/ranking",     label: "Ranking" },
  { href: "/aluno/certificado", label: "Certificado" },
];

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function sair() {
    await fetch("/api/workshop/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Nav ── */}
      <nav style={{
        height: 60,
        background: "rgba(12,12,18,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 32px", gap: 0,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <Link href="/aluno" style={{ textDecoration: "none", marginRight: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24,
              background: "var(--green)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 4,
            }}>
              <span style={{ fontSize: 13, color: "#000", fontWeight: 900 }}>W</span>
            </div>
            <span style={{
              fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 14,
              color: "var(--text)", letterSpacing: "-0.01em",
            }}>
              Workshop
            </span>
          </div>
        </Link>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: "var(--border-2)", marginRight: 28 }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {TABS.map((t) => {
            const active = t.href === "/aluno"
              ? pathname === "/aluno"
              : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "8px 14px",
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  color: active ? "var(--text)" : "var(--text-dim)",
                  background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  borderRadius: 5,
                  textDecoration: "none", whiteSpace: "nowrap",
                  transition: "color 0.15s, background 0.15s",
                  letterSpacing: "-0.01em",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-muted)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Sair */}
        <button
          onClick={sair}
          style={{
            background: "none", border: "1px solid var(--border-2)",
            color: "var(--text-dim)", fontSize: 12, padding: "6px 14px",
            cursor: "pointer", fontFamily: "Inter, sans-serif",
            borderRadius: 4,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-2)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-2)";
            e.currentTarget.style.color = "var(--text-dim)";
          }}
        >
          Sair →
        </button>
      </nav>

      {/* ── Content ── */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {children}
      </main>
    </div>
  );
}
