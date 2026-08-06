import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const materiais = await prisma.wMaterial.findMany({ orderBy: { created_at: "asc" } });
  return NextResponse.json({ materiais });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const body = await req.json();
  const m = await prisma.wMaterial.create({ data: { materia: body.materia, title: body.title, url: body.url } });
  return NextResponse.json({ material: m });
}
