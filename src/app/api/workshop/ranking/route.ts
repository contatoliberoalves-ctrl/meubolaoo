import { NextResponse } from "next/server";
import { getSession } from "@/lib/workshop-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const students = await prisma.wStudent.findMany({
    select: { id: true, name: true, points: true },
    orderBy: { points: "desc" },
    take: 20,
  });

  return NextResponse.json({ ranking: students });
}
