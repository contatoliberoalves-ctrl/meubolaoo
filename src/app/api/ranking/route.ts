import { NextResponse } from "next/server";
import { computeRanking, type Scope } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get("scope") ?? "overall") as Scope;
  const valid: Scope[] = ["overall", "weekly", "streak"];
  const s = valid.includes(scope) ? scope : "overall";
  const rows = await computeRanking(s);
  return NextResponse.json({ scope: s, rows });
}
