import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AdminClient from "@/components/AdminClient";
import { GROUP_CODES } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile?.role !== "admin") redirect("/app/jogos");

  const cfg = await prisma.prizeConfig.findMany();
  const prizes: Record<string, string> = {};
  cfg.forEach((c) => (prizes[c.slot] = c.prize_label));

  return <AdminClient groups={GROUP_CODES} prizes={prizes} />;
}
