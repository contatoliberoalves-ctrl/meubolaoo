"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMBLEMS } from "@/lib/data";

export default function AuthModal({
  mode,
  onClose,
}: {
  mode: "login" | "signup";
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [name, setName] = useState("");
  const [emblem, setEmblem] = useState(EMBLEMS[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (tab === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, emblem, email, password }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao criar conta");
        // Try to sign in immediately (works if email confirmation disabled).
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signErr) {
          setInfo("Conta criada! Confirme seu e-mail para entrar.");
          setLoading(false);
          return;
        }
        router.push("/app");
        router.refresh();
      } else {
        const { error: signErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signErr) throw new Error(signErr.message);
        router.push("/app");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,12,30,.7)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        style={{ background: "rgba(18,32,66,.96)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex gap-2">
          <button
            className={`chip flex-1 ${tab === "login" ? "chip-active" : ""}`}
            onClick={() => setTab("login")}
            type="button"
          >
            Entrar
          </button>
          <button
            className={`chip flex-1 ${tab === "signup" ? "chip-active" : ""}`}
            onClick={() => setTab("signup")}
            type="button"
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {tab === "signup" && (
            <>
              <input
                className="rounded-xl px-4 py-3 text-ink"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <div>
                <div className="mb-1 text-sm text-sky">Escolha seu emblema</div>
                <div className="flex flex-wrap gap-2">
                  {EMBLEMS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmblem(em)}
                      className={`h-10 w-10 rounded-full text-xl ${
                        emblem === em ? "chip-active" : "pill"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <input
            className="rounded-xl px-4 py-3 text-ink"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="rounded-xl px-4 py-3 text-ink"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {info && <p className="text-sm text-sky">{info}</p>}
          <button className="btn btn-go mt-1" disabled={loading} type="submit">
            {loading
              ? "..."
              : tab === "signup"
              ? "Criar minha conta"
              : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
