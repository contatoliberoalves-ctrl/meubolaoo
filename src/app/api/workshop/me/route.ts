import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  if (session.role === "admin") {
    return NextResponse.json({ role: "admin", id: "admin", name: "Admin" });
  }

  const student = await prisma.wStudent.findUnique({
    where: { id: session.id },
    include: {
      watched: {
        select: { lesson_id: true, watched_at: true },
        orderBy: { watched_at: "desc" },
      },
    },
  });
  if (!student) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Última aula assistida com dados completos
  let last_lesson = null;
  if (student.watched.length > 0) {
    const lastId = student.watched[0].lesson_id;
    last_lesson = await prisma.wLesson.findUnique({ where: { id: lastId } });
  }

  return NextResponse.json({
    role: "student",
    id: student.id,
    name: student.name,
    email: student.email,
    points: student.points,
    watched: student.watched.map((w) => w.lesson_id),
    last_lesson,
  });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role === "admin")
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const { name, current_password, new_password } = body;

  const student = await prisma.wStudent.findUnique({ where: { id: session.id } });
  if (!student) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const data: { name?: string; password?: string } = {};

  if (name && name.trim()) data.name = name.trim();

  if (new_password) {
    if (!current_password)
      return NextResponse.json({ error: "Informe a senha atual" }, { status: 400 });
    const ok = await bcrypt.compare(current_password, student.password);
    if (!ok)
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    if (new_password.length < 6)
      return NextResponse.json({ error: "Nova senha precisa ter ao menos 6 caracteres" }, { status: 400 });
    data.password = await bcrypt.hash(new_password, 10);
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });

  const updated = await prisma.wStudent.update({ where: { id: session.id }, data });
  return NextResponse.json({ name: updated.name });
}
