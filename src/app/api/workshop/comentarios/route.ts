import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lesson_id");
  if (session.role === "admin") {
    const all = await prisma.wComment.findMany({ ...(lessonId ? { where: { lesson_id: lessonId } } : {}), orderBy: { created_at: "desc" }, include: { lesson: { select: { materia: true } } } });
    return NextResponse.json({ comentarios: all });
  }
  const approved = await prisma.wComment.findMany({ where: { lesson_id: lessonId ?? undefined, status: "approved" }, orderBy: { created_at: "asc" } });
  return NextResponse.json({ comentarios: approved });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "student") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const body = await req.json();
  const c = await prisma.wComment.create({ data: { lesson_id: body.lesson_id, student_id: session.id, student_name: session.name, text: body.text } });
  return NextResponse.json({ comentario: c });
}