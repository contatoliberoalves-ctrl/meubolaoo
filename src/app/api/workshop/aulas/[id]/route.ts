import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  const body = await req.json();
  const aula = await prisma.wLesson.update({
    where: { id: params.id },
    data: {
      ...(body.date !== undefined && { date: body.date }),
      ...(body.time !== undefined && { time: body.time }),
      ...(body.materia !== undefined && { materia: body.materia }),
      ...(body.palestrante !== undefined && { palestrante: body.palestrante }),
      ...(body.youtube_url !== undefined && { youtube_url: body.youtube_url }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.image_url !== undefined && { image_url: body.image_url }),
    },
  });
  return NextResponse.json({ aula });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });

  await prisma.wLesson.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
