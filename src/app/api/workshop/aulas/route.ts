import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const aulas = await prisma.wLesson.findMany({
    orderBy: [{ sort_order: "asc" }, { date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json({ aulas });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const body = await req.json();
  const aula = await prisma.wLesson.create({
    data: {
      date: body.date,
      time: body.time,
      materia: body.materia,
      palestrante: body.palestrante ?? "",
      youtube_url: body.youtube_url ?? "",
      image_url: body.image_url ?? "",
      sort_order: body.sort_order ?? 0,
    },
  });
  return NextResponse.json({ aula });
}
