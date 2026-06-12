import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import RankingClient from "@/components/RankingClient";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cfg = await prisma.prizeConfig.findMany();
  const prizeMap: Record<string, string> = {};
  cfg.forEach((c) => (prizeMap[c.slot] = c.prize_label));

  return <RankingClient meId={user?.id ?? null} prizes={prizeMap} />;
}
