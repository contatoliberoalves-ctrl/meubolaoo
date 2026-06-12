import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });

  return (
    <AppShell
      name={profile?.name ?? "Jogador"}
      emblem={profile?.emblem ?? "⚽"}
      isAdmin={profile?.role === "admin"}
    >
      {children}
    </AppShell>
  );
}
