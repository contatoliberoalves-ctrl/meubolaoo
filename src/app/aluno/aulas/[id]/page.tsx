"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Lesson = { id: string; date: string; time: string; materia: string; palestrante: string; youtube_url: string; status: string; image_url: string };
type Me = { id: string; name: string; watched: string[] };
type Comment = { id: string; student_name: string; text: string; created_at: string };

function ytEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AulaDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [marking, setMarking] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [aulas, meRes, comRes] = await Promise.all([
      fetch("/api/workshop/aulas").then((r) => r.json()),
      fetch("/api/workshop/me").then((r) => r.json()),
      fetch(`/api/workshop/comentarios?lesson_id=${id}`).then((r) => r.json()),
    ]);
    const found = (aulas.aulas ?? []).find((a: Lesson) => a.id === id);
    setLesson(found ?? null);
    setMe(meRes.role === "admin" ? { id: "admin", name: "Admin", watched: [] } : meRes);
    setComments(comRes.comentarios ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const watched = me?.watched.includes(id) ?? false;

  async function markWatched() {
    setMarking(true);
    await fetch(`/api/workshop/aulas/${id}/assistida`, { method: "POST" });
    await load();
    setMarking(false);
  }

  async function sendComment(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await fetch("/api/workshop/comentarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lesson_id: id, text }) });
    setText("");
    await load();
    setSending(false);
  }

  if (!lesson) return <p style={{ color: "var(--text-dim)" }}>Carregando…</p>;

  const embed = ytEmbed(lesson.youtube_url);
  const canWatch = lesson.status === "ao_vivo" || lesson.status === "gravada";

  return (
    <div>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "var(--text-dim)", cursor: "pointer", fontSize: 13, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>← Voltar às aulas</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ aspectRatio: "16/9", background: "var(--highlight)", position: "relative", marginBottom: 20 }}>
            {canWatch && embed ? (
              <iframe src={embed} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media" allowFullScreen />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 14 }}>🔒 O link será divulgado em breve</div>
            )}
          </div>
          <h1 style={{ fontFamily: "Archivo, sans-serif", fontWeight: 900, fontSize: 24, marginBottom: 6 }}>{lesson.materia}</h1>
          <p style={{ color: "var(--green-dark)", fontWeight: 600, marginBottom: 4 }}>{lesson.palestrante}</p>
          <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 16 }}>
            {lesson.date} · {lesson.time} · {lesson.status === "ao_vivo" ? <span className="pulse" style={{ color: "var(--green)" }}>● Ao vivo</span> : lesson.status === "gravada" ? <span style={{ color: "var(--green)" }}>Gravada</span> : <span>Agendada</span>}
          </p>
          {!watched ? (
            <button className="btn-green" onClick={markWatched} disabled={marking} style={{ marginBottom: 8 }}>{marking ? "Salvando…" : "✓ Marcar como assistida (+10 pts)"}</button>
          ) : (
            <div className="badge-green" style={{ padding: "8px 16px", fontSize: 13, display: "inline-block" }}>✓ Aula assistida</div>
          )}
        </div>
        <div className="card-2" style={{ padding: 20, display: "flex", flexDirection: "column", height: "60vh" }}>
          <p className="label" style={{ marginBottom: 12 }}>Comentários</p>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
            {comments.length === 0 && <p style={{ color: "var(--text-dim)", fontSize: 13 }}>Nenhum comentário aprovado ainda.</p>}
            {comments.map((c) => (
              <div key={c.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.student_name}</span>
                  <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{formatDate(c.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendComment} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <textarea className="input" rows={3} placeholder="Escreva seu comentário…" value={text} onChange={(e) => setText(e.target.value)} style={{ resize: "none" }} />
            <button className="btn-green" type="submit" disabled={sending || !text.trim()} style={{ fontSize: 12 }}>{sending ? "Enviando…" : "Enviar"}</button>
            <p style={{ color: "var(--text-dim)", fontSize: 11 }}>Comentários passam por moderação antes de aparecer.</p>
          </form>
        </div>
      </div>
    </div>
  );
}