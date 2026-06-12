"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { createClient } from "@/lib/supabase/client";

const TABS = [
  { href: "/app/jogos", label: "Jogos" },
  { href: "/app/ranking", label: "Ranking" },
  { href: "/app/premios", label: "Prêmios" },
  { href: "/app/conquistas", label: "Conquistas" },
];

export default function AppShell({
  name,
  emblem,
  isAdmin,
  children,
}: {
  name: string;
  emblem: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = isAdmin
    ? [...TABS, { href: "/app/admin", label: "⚙ Admin" }]
    : TABS;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      <header className="flex items-center justify-between gap-3">
        <Link href="/app/jogos" className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-white/5">
            <Mascot />
          </div>
          <div className="leading-tight">
            <div className="font-black">Bolão do Prof. Líbero</div>
            <div className="text-xs text-sky">@liberofilho · Copa 2026</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="pill px-3 py-1.5 text-sm">
            {emblem} {name}
          </span>
          <button className="chip" onClick={signOut}>
            sair
          </button>
        </div>
      </header>

      <nav className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`chip whitespace-nowrap ${active ? "chip-active" : ""}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
