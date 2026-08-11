import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

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
    points: student.points,
    watched: student.watched.map((w) => w.lesson_id),
    last_lesson,
  });
}
