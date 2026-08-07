"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; youtube_url: string; image_url: string; status: string };
type Student = { id: string; name: string; email: string; points: number; watched: number; total: number; progress: number };
type Material = { id: string; materia: string; title: string; url: string };
type Aviso = { id: string; text: string; active: boolean; created_at: string };
type Comment = { id: string; lesson_id: string; student_name: string; text: string; status: string; created_at: string; lesson?: { materia: string } };

type Tab = "aulas" | "avisos" | "materiais" | "alunos" | "comentarios";

const STATUS_CYCLE: Record<string, string> = { agendada: "ao_vivo", ao_vivo: "gravada", gravada: "agendada" };
const STATUS_LABEL: Record<string, string> = { agendada: "Agendada", ao_vivo: "Ao vivo", gravada: "Gravada" };
const STATUS_COLOR: Record<string, string> = { agendada: "var(--text-dim)", ao_vivo: "var(--green)", gravada: "var(--green-dark)" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Aulas tab ───────────────────────────────────────────────────────────────
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/workshop/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Falha no upload");
  const { url } = await res.json();
  return url;
}

function AulasTab({ lessons, onRefresh }: { lessons: Lesson[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ date: "", time: "", materia: "", palestrante: "", image_url: "" });
  const [busy, setBusy] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  async function cycleStatus(l: Lesson) {
    setBusy(l.id);
    await fetch(`/api/workshop/aulas/${l.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: STATUS_CYCLE[l.status] }),
    });
    onRefresh(); setBusy(null);
  }

  async function updateField(id: string, field: string, value: string) {
    await fetch(`/api/workshop/aulas/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    onRefresh();
  }

  async function del(id: string) {
    if (!confirm("Remover aula?")) return;
    await fetch(`/api/workshop/aulas/${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/workshop/aulas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form }),
    });
    setForm({ date: "", time: "", materia: "", palestrante: "", image_url: "" });
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {lessons.map((l) => (
          <div key={l.id} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "80px 80px 1fr 1fr 1fr auto auto", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <input className="input" defaultValue={l.date} onBlur={(e) => updateField(l.id, "date", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
              <input className="input" defaultValue={l.time} onBlur={(e) => updateField(l.id, "time", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} />
              <input className="input" defaultValue={l.materia} onBlur={(e) => updateField(l.id, "materia", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} placeholder="Matéria" />
              <input className="input" defaultValue={l.palestrante} onBlur={(e) => updateField(l.id, "palestrante", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} placeholder="Palestrante" />
              <input className="input" defaultValue={l.youtube_url} onBlur={(e) => updateField(l.id, "youtube_url", e.target.value)} style={{ fontSize: 12, padding: "6px 8px" }} placeholder="URL YouTube" />
              <button
                onClick={() => cycleStatus(l)} disabled={busy === l.id}
                style={{ background: "none", border: `1px solid ${STATUS_COLOR[l.status]}`, color: STATUS_COLOR[l.status], padding: "6px 10px", cursor: "pointer", fontSize: 11, fontFamily: "Archivo, sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}
              >
                {l.status === "ao_vivo" && <span className="pulse">● </span>}{STATUS_LABEL[l.status]}
              </button>
              <button onClick={() => del(l.id)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
            </div>
            {/* Miniatura */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {l.image_url && (
                <img src={l.image_url} alt="capa" style={{ width: 80, height: 45, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
              )}
              <input
                className="input"
                defaultValue={l.image_url}
                onBlur={(e) => updateField(l.id, "image_url", e.target.value)}
                style={{ fontSize: 12, padding: "6px 8px", flex: 1 }}
                placeholder="URL da miniatura (capa) — cole o link da imagem"
              />
              <label style={{
                display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                border: "1px solid var(--border-2)", color: "var(--text-dim)",
                padding: "6px 10px", fontSize: 11, whiteSpace: "nowrap", flexShrink: 0,
                opacity: uploading === l.id ? 0.5 : 1,
              }}>
                {uploading === l.id ? "Enviando…" : "📁 Subir imagem"}
                <input
                  type="file" accept="image/*" style={{ display: "none" }}
                  disabled={uploading === l.id}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(l.id);
                    try {
                      const url = await uploadImage(file);
                      await updateField(l.id, "image_url", url);
                    } catch { alert("Erro no upload"); }
                    finally { setUploading(null); }
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "20px 20px" }}>
        <p className="label" style={{ marginBottom: 14 }}>Nova aula</p>
        <form onSubmit={addLesson} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label className="label">Data</label>
              <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Horário</label>
              <input className="input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
            </div>
            <div>
              <label className="label">Matéria</label>
              <input className="input" placeholder="Ex: Contratos" value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} required />
            </div>
            <div>
              <label className="label">Palestrante</label>
              <input className="input" placeholder="Nome" value={form.palestrante} onChange={(e) => setForm({ ...form, palestrante: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label className="label">URL da Miniatura (capa)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" type="url" placeholder="https://… (opcional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} style={{ flex: 1 }} />
                <label style={{
                  display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                  border: "1px solid var(--border-2)", color: "var(--text-dim)",
                  padding: "0 12px", fontSize: 12, whiteSpace: "nowrap", height: 42,
                  opacity: uploading === "new" ? 0.5 : 1,
                }}>
                  {uploading === "new" ? "Enviando…" : "📁 Subir"}
                  <input
                    type="file" accept="image/*" style={{ display: "none" }}
                    disabled={uploading === "new"}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading("new");
                      try {
                        const url = await uploadImage(file);
                        setForm((f) => ({ ...f, image_url: url }));
                      } catch { alert("Erro no upload"); }
                      finally { setUploading(null); }
                    }}
                  />
                </label>
              </div>
            </div>
            <button className="btn-green" type="submit" style={{ height: 42, padding: "0 20px", flexShrink: 0 }}>+ Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Avisos tab ───────────────────────────────────────────────────────────────
function AvisosTab({ avisos, onRefresh }: { avisos: Aviso[]; onRefresh: () => void }) {
  const [text, setText] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch("/api/workshop/avisos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    setText(""); onRefresh();
  }

  async function toggleActive(a: Aviso) {
    await fetch(`/api/workshop/avisos/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !a.active }) });
    onRefresh();
  }

  async function del(id: string) {
    await fetch(`/api/workshop/avisos/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {avisos.map((a) => (
          <div key={a.id} className="card accent-left" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <p style={{ flex: 1, fontSize: 14, color: "var(--text-muted)" }}>{a.text}</p>
            <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{formatDate(a.created_at)}</span>
            <button
              onClick={() => toggleActive(a)}
              style={{
                background: a.active ? "rgba(57,255,106,0.12)" : "var(--highlight)",
                border: `1px solid ${a.active ? "var(--green)" : "var(--border-2)"}`,
                color: a.active ? "var(--green)" : "var(--text-dim)",
                padding: "4px 10px", cursor: "pointer", fontFamily: "Archivo, sans-serif", fontWeight: 700, fontSize: 11,
              }}
            >
              {a.active ? "Ativo" : "Oculto"}
            </button>
            <button onClick={() => del(a.id)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ))}
        {avisos.length === 0 && <p style={{ color: "var(--text-dim)" }}>Nenhum aviso.</p>}
      </div>

      <form onSubmit={add} style={{ display: "flex", gap: 10 }}>
        <input className="input" placeholder="Escreva o aviso…" value={text} onChange={(e) => setText(e.target.value)} required style={{ flex: 1 }} />
        <button className="btn-green" type="submit">Publicar</button>
      </form>
    </div>
  );
}

// ─── Materiais tab ────────────────────────────────────────────────────────────
function MateriaisTab({ materiais, onRefresh }: { materiais: Material[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ materia: "", title: "", url: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/workshop/materiais", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ materia: "", title: "", url: "" }); onRefresh();
  }

  async function del(id: string) {
    await fetch(`/api/workshop/materiais/${id}`, { method: "DELETE" }); onRefresh();
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24 }}>
        {materiais.map((m) => (
          <div key={m.id} className="card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div className="badge-green" style={{ fontSize: 10, padding: "2px 6px" }}>PDF</div>
            <span style={{ color: "var(--text-dim)", fontSize: 12, minWidth: 100 }}>{m.materia}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{m.title}</span>
            <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green-dark)", fontSize: 12 }}>↗</a>
            <button onClick={() => del(m.id)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        ))}
        {materiais.length === 0 && <p style={{ color: "var(--text-dim)" }}>Nenhum material cadastrado.</p>}
      </div>

      <div className="card" style={{ padding: "20px" }}>
        <p className="label" style={{ marginBottom: 14 }}>Novo material</p>
        <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: 10 }}>
          <div>
            <label className="label">Matéria</label>
            <input className="input" placeholder="Ex: Contratos" value={form.materia} onChange={(e) => setForm({ ...form, materia: e.target.value })} required />
          </div>
          <div>
            <label className="label">Título</label>
            <input className="input" placeholder="Ex: Guia de Contratos" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">URL do PDF</label>
            <input className="input" type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button className="btn-green" type="submit" style={{ height: 42, padding: "0 20px" }}>+ Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Alunos tab ───────────────────────────────────────────────────────────────
function AlunosTab({ alunos, onRefresh }: { alunos: Student[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const res = await fetch("/api/workshop/alunos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) { const j = await res.json(); setErr(j.error ?? "Erro"); return; }
    setForm({ name: "", email: "", password: "" }); onRefresh();
  }

  async function del(id: string, name: string) {
    if (!confirm(`Remover aluno "${name}"?`)) return;
    await fetch(`/api/workshop/alunos/${id}`, { method: "DELETE" }); onRefresh();
  }

  return (
    <div>
      <div className="card" style={{ overflowX: "auto", marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Nome", "Email", "Pontos", "Progresso", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-dim)", fontFamily: "Archivo, sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunos.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.name}</td>
                <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{s.email}</td>
                <td style={{ padding: "10px 14px", color: "var(--green)", fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>{s.points}</td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: "var(--border)", height: 4, width: 80, flexShrink: 0 }}>
                      <div style={{ background: "var(--green)", height: 4, width: `${s.progress}%` }} />
                    </div>
                    <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{s.progress}%</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button onClick={() => del(s.id, s.name)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 14 }}>✕</button>
                </td>
              </tr>
            ))}
            {alunos.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "20px 14px", color: "var(--text-dim)", textAlign: "center" }}>Nenhum aluno cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: "20px" }}>
        <p className="label" style={{ marginBottom: 14 }}>Adicionar aluno</p>
        <form onSubmit={add} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 10 }}>
          <div>
            <label className="label">Nome</label>
            <input className="input" placeholder="Nome completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="aluno@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label">Senha</label>
            <input className="input" type="text" placeholder="Senha inicial" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button className="btn-green" type="submit" style={{ height: 42, padding: "0 20px" }}>+ Adicionar</button>
          </div>
        </form>
        {err && <p style={{ color: "#ff6b6b", marginTop: 8, fontSize: 13 }}>{err}</p>}
      </div>
    </div>
  );
}

// ─── Comentarios tab ──────────────────────────────────────────────────────────
function ComentariosTab({ comments, onRefresh }: { comments: Comment[]; onRefresh: () => void }) {
  async function setStatus(id: string, status: string) {
    await fetch(`/api/workshop/comentarios/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    onRefresh();
  }

  async function del(id: string) {
    await fetch(`/api/workshop/comentarios/${id}`, { method: "DELETE" }); onRefresh();
  }

  const STATUS_COLOR_MAP: Record<string, string> = { pending: "var(--text-dim)", approved: "var(--green)", rejected: "#ff6b6b" };
  const STATUS_PT: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {comments.map((c) => (
          <div key={c.id} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.student_name}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{c.lesson?.materia ?? ""}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{formatDate(c.created_at)}</span>
                  <span style={{ color: STATUS_COLOR_MAP[c.status], fontSize: 11, fontFamily: "Archivo, sans-serif", fontWeight: 700 }}>
                    {STATUS_PT[c.status]}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{c.text}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {c.status !== "approved" && (
                  <button className="btn-green" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setStatus(c.id, "approved")}>Aprovar</button>
                )}
                {c.status !== "rejected" && (
                  <button className="btn-outline" style={{ fontSize: 11, padding: "4px 10px", borderColor: "#ff6b6b", color: "#ff6b6b" }} onClick={() => setStatus(c.id, "rejected")}>Rejeitar</button>
                )}
                <button onClick={() => del(c.id)} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p style={{ color: "var(--text-dim)" }}>Nenhum comentário ainda.</p>}
      </div>
    </div>
  );
}

// ─── Main Admin page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("aulas");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const router = useRouter();

  const load = useCallback(async () => {
    const [al, st, ma, av, co] = await Promise.all([
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/alunos").then((r) => r.json()),
      fetch("/api/workshop/materiais").then((r) => r.json()),
      fetch("/api/workshop/avisos").then((r) => r.json()),
      fetch("/api/workshop/comentarios").then((r) => r.json()),
    ]);
    setLessons(al.aulas ?? []);
    setStudents(st.alunos ?? []);
    setMateriais(ma.materiais ?? []);
    setAvisos(av.avisos ?? []);
    setComments(co.comentarios ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function sair() {
    await fetch("/api/workshop/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const activeAvisos = avisos.filter((a) => a.active).length;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "aulas", label: "Aulas", badge: lessons.length },
    { key: "avisos", label: "Avisos", badge: activeAvisos },
    { key: "materiais", label: "Materiais", badge: materiais.length },
    { key: "alunos", label: "Alunos", badge: students.length },
    { key: "comentarios", label: "Comentários", badge: pendingCount },
  ];

  const stats = [
    { label: "Alunos", v: students.length },
    { label: "Aulas", v: lessons.length },
    { label: "Materiais", v: materiais.length },
    { label: "Avisos ativos", v: activeAvisos },
    { label: "Comentários pendentes", v: pendingCount },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 230, background: "var(--sidebar)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", padding: "28px 0", position: "sticky", top: 0, height: "100vh",
        }}
      >
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 14, color: "var(--green)", letterSpacing: "-0.01em" }}>
            Jovem Advogado
          </p>
          <p style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>Painel Admin</p>
        </div>

        <nav style={{ flex: 1, padding: "16px 0" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                width: "100%", background: tab === t.key ? "rgba(57,255,106,0.08)" : "none",
                border: "none", borderLeft: tab === t.key ? "3px solid var(--green)" : "3px solid transparent",
                color: tab === t.key ? "var(--text)" : "var(--text-dim)",
                fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14,
                padding: "10px 20px", cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span style={{
                  background: t.key === "comentarios" && pendingCount > 0 ? "var(--green)" : "var(--border-2)",
                  color: t.key === "comentarios" && pendingCount > 0 ? "#000" : "var(--text-dim)",
                  fontFamily: "Archivo, sans-serif", fontWeight: 800, fontSize: 11,
                  padding: "1px 7px", minWidth: 20, textAlign: "center",
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "0 20px" }}>
          <button className="btn-outline" onClick={sair} style={{ width: "100%", fontSize: 13 }}>Sair</button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
          {stats.map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
              <div style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 26, color: "var(--green)" }}>{s.v}</div>
              <div style={{ color: "var(--text-dim)", fontSize: 12, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 22, marginBottom: 20 }}>
          {TABS.find((t) => t.key === tab)?.label}
        </h2>

        {tab === "aulas" && <AulasTab lessons={lessons} onRefresh={load} />}
        {tab === "avisos" && <AvisosTab avisos={avisos} onRefresh={load} />}
        {tab === "materiais" && <MateriaisTab materiais={materiais} onRefresh={load} />}
        {tab === "alunos" && <AlunosTab alunos={students} onRefresh={load} />}
        {tab === "comentarios" && <ComentariosTab comments={comments} onRefresh={load} />}
      </main>
    </div>
  );
}
