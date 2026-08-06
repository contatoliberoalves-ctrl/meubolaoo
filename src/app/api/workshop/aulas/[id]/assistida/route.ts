import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "student") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const existing = await prisma.wWatched.findUnique({ where: { student_id_lesson_id: { student_id: session.id, lesson_id: params.id } } });
  if (existing) return NextResponse.json({ ok: true, points: 0 });
  await prisma.$transaction([ prisma.wWatched.create({ data: { student_id: session.id, lesson_id: params.id } }), prisma.wStudent.update({ where: { id: session.id }, data: { points: { increment: 10 } } }) ]);
  return NextResponse.json({ ok: true, points: 10 });
}