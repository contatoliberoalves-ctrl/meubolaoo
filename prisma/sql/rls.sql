-- RLS policies for Bolão do Prof. Líbero Filho
-- Run this in the Supabase SQL editor AFTER `prisma migrate deploy` / `db push`.

-- Helper: is the current auth user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Enable RLS
alter table public.profiles      enable row level security;
alter table public.groups        enable row level security;
alter table public.teams         enable row level security;
alter table public.matches       enable row level security;
alter table public.predictions   enable row level security;
alter table public.prizes_config enable row level security;
alter table public.badges        enable row level security;
alter table public.user_badges   enable row level security;

-- PROFILES: everyone authenticated can read; users update only their own row
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

-- Users may update own row but NOT escalate role (role must stay unchanged).
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles p where p.id = auth.uid()));

-- GROUPS / TEAMS / MATCHES: public read, admin write
drop policy if exists groups_read on public.groups;
create policy groups_read on public.groups for select using (true);
drop policy if exists groups_write on public.groups;
create policy groups_write on public.groups for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select using (true);
drop policy if exists teams_write on public.teams;
create policy teams_write on public.teams for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select using (true);
drop policy if exists matches_write on public.matches;
create policy matches_write on public.matches for all using (public.is_admin()) with check (public.is_admin());

-- PREDICTIONS: everyone can read (leaderboard); users insert/update only own row.
-- `points` may only be set by admins (enforced in API; here we restrict writes to own row).
drop policy if exists predictions_read on public.predictions;
create policy predictions_read on public.predictions for select using (true);

drop policy if exists predictions_insert_self on public.predictions;
create policy predictions_insert_self on public.predictions
  for insert with check (auth.uid() = user_id and points is null);

drop policy if exists predictions_update_self on public.predictions;
create policy predictions_update_self on public.predictions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists predictions_admin on public.predictions;
create policy predictions_admin on public.predictions
  for all using (public.is_admin()) with check (public.is_admin());

-- PRIZES_CONFIG / BADGES: public read, admin write
drop policy if exists prizes_read on public.prizes_config;
create policy prizes_read on public.prizes_config for select using (true);
drop policy if exists prizes_write on public.prizes_config;
create policy prizes_write on public.prizes_config for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists badges_read on public.badges;
create policy badges_read on public.badges for select using (true);
drop policy if exists badges_write on public.badges;
create policy badges_write on public.badges for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_badges_read on public.user_badges;
create policy user_badges_read on public.user_badges for select using (true);
drop policy if exists user_badges_self on public.user_badges;
create policy user_badges_self on public.user_badges
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- NOTE: The server uses the service-role key for admin mutations & scoring,
-- which bypasses RLS. These policies protect direct (anon/auth) client access.
