import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const body = await req.json();
  const a = await prisma.wAnnouncement.update({
    where: { id: params.id },
    data: {
      ...(body.text !== undefined && { text: body.text }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });
  return NextResponse.json({ aviso: a });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  await prisma.wAnnouncement.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
