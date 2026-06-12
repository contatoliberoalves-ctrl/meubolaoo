"use client";

import { useState } from "react";
import Figurinha from "@/components/Figurinha";
import AuthModal from "@/components/AuthModal";

const TAGS = [
  "⚽ 48 seleções",
  "🏆 Ranking ao vivo",
  "🔥 Streak de acertos",
  "🎯 Placar exato vale 5 pts",
];

export default function Landing() {
  const [modal, setModal] = useState<null | "login" | "signup">(null);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-sky">
        PROF. LÍBERO FILHO · BOLÃO OFICIAL
      </div>

      <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="pill inline-block px-4 py-1.5 text-xs font-bold tracking-wide">
            ⚽ COPA 2026 · EDIÇÃO 01
          </span>
          <h1
            className="title mt-5"
            style={{ fontSize: "clamp(2.6rem,7vw,5rem)" }}
          >
            BOLÃO DO
            <br />
            PROF. LÍBERO
          </h1>
          <p className="mt-3 text-lg font-light italic text-sky">
            Crava o placar. Sobe no ranking. Vira craque.
          </p>
          <p className="mt-5 max-w-lg text-white/80">
            São <strong>72 jogos da fase de grupos</strong> da Copa do Mundo
            2026 para você cravar. Placar exato vale <strong>5 pontos</strong>,
            acertar o resultado vale <strong>2</strong>. Suba no ranking ao vivo,
            mantenha a sequência e dispute prêmios.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button className="btn btn-go" onClick={() => setModal("signup")}>
              Criar minha conta
            </button>
            <button className="btn btn-ghost" onClick={() => setModal("login")}>
              Já jogo, entrar
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <span key={t} className="pill px-3 py-1.5 text-sm">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xs">
          <Figurinha />
          <p className="mt-3 text-center font-semibold text-sky">@liberofilho</p>
        </div>
      </div>

      <footer className="mt-20 border-t border-white/10 pt-6 text-sm text-white/60">
        <div className="font-black tracking-wide text-white">
          PROF. LÍBERO FILHO
        </div>
        <div>BOLÃO · COPA DO MUNDO 2026</div>
      </footer>

      {modal && <AuthModal mode={modal} onClose={() => setModal(null)} />}
    </main>
  );
}
