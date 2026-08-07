"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/aluno", label: "Início" },
  { href: "/aluno/aulas", label: "Aulas" },
  { href: "/aluno/materiais", label: "Materiais de apoio" },
];

export default function AlunoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function sair() {
    await fetch("/api/workshop/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <nav
        style={{
          height: 64, background: "var(--bg)", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", padding: "0 32px", gap: 32,
          position: "sticky", top: 0, zIndex: 50,
        }}
      >
        <span style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 15, color: "var(--green)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          Workshop
        </span>
        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          {TABS.map((t) => {
            const active = t.href === "/aluno" ? pathname === "/aluno" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "20px 14px", fontSize: 14, fontWeight: 500,
                  color: active ? "var(--text)" : "var(--text-dim)",
                  borderBottom: active ? "2px solid var(--green)" : "2px solid transparent",
                  textDecoration: "none", whiteSpace: "nowrap", transition: "color 0.15s",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <button
          onClick={sair}
          style={{ background: "none", border: "1px solid var(--border-2)", color: "var(--text-dim)", fontSize: 13, padding: "6px 14px", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
        >
          Sair
        </button>
      </nav>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}
