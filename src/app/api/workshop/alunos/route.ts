import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const students = await prisma.wStudent.findMany({ orderBy: { created_at: "asc" }, include: { _count: { select: { watched: true } } } });
  const total = await prisma.wLesson.count();
  return NextResponse.json({ alunos: students.map((s) => ({ id: s.id, name: s.name, email: s.email, points: s.points, watched: s._count.watched, total, progress: total > 0 ? Math.round((s._count.watched / total) * 100) : 0 })) });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const { name, email, password } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const student = await prisma.wStudent.create({ data: { name, email, password: hashed } });
  return NextResponse.json({ aluno: { id: student.id, name: student.name, email: student.email } });
}