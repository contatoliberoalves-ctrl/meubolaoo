import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const avisos = await prisma.wAnnouncement.findMany({ orderBy: { created_at: "desc" } });
  return NextResponse.json({ avisos });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== "admin") return NextResponse.json({ error: "Proibido" }, { status: 403 });
  const body = await req.json();
  const a = await prisma.wAnnouncement.create({ data: { text: body.text } });
  return NextResponse.json({ aviso: a });
}
