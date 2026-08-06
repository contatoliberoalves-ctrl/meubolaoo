import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.role === "admin") return NextResponse.json({ role: "admin", id: "admin", name: "Admin" });
  const student = await prisma.wStudent.findUnique({ where: { id: session.id }, include: { watched: { select: { lesson_id: true } } } });
  if (!student) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ role: "student", id: student.id, name: student.name, points: student.points, watched: student.watched.map((w) => w.lesson_id) });
}