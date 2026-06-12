import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOCK_MS } from "@/lib/data";

export const dynamic = "force-dynamic";

// Vercel Cron: lock matches whose kickoff is within 5 minutes.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() + LOCK_MS);
  const result = await prisma.match.updateMany({
    where: { locked: false, kickoff_at: { lte: cutoff } },
    data: { locked: true },
  });

  return NextResponse.json({ locked: result.count });
}
