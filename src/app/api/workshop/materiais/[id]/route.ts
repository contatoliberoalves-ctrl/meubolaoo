import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const body = await req.json();
  const data: Record<string, string> = {};
  if (body.image_url !== undefined) data.image_url = body.image_url;
  if (body.title !== undefined)     data.title     = body.title;
  if (body.materia !== undefined)   data.materia   = body.materia;
  if (body.url !== undefined)       data.url       = body.url;
  const m = await prisma.wMaterial.update({ where: { id: params.id }, data });
  return NextResponse.json({ material: m });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  await prisma.wMaterial.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
