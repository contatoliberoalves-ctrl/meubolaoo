import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const { status } = await req.json();
  const c = await prisma.wComment.update({ where: { id: params.id }, data: { status } });
  return NextResponse.json({ comentario: c });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  await prisma.wComment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
