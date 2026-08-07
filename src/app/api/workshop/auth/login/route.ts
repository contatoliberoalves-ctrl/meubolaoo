import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, sessionCookieOpts, WSession } from "@/lib/workshop-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, password, role } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios" }, { status: 400 });
  }

  let session: WSession;

  if (role === "admin") {
    const adminEmail = process.env.WORKSHOP_ADMIN_EMAIL ?? "contatoliberoalves@gmail.com";
    const adminPass = process.env.WORKSHOP_ADMIN_PASSWORD ?? "admin2026";
    if (email !== adminEmail || password !== adminPass) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
    }
    session = { role: "admin", id: "admin" };
  } else {
    const student = await prisma.wStudent.findUnique({ where: { email } });
    if (!student || !(await bcrypt.compare(password, student.password))) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
    }
    session = { role: "student", id: student.id, name: student.name };
  }

  const token = await createSession(session);
  const res = NextResponse.json({ ok: true, role: session.role });
  res.cookies.set(sessionCookieOpts(token));
  return res;
}
