-- RLS policies for Bolão do Prof. Líbero Filho
-- Tables are prefixed with bolao_ because this Supabase project is shared with
-- another platform (avoids name collisions with its `profiles`/`badges` tables).
-- Run this in the Supabase SQL editor AFTER `prisma migrate deploy` / `db push`.

-- Helper: is the current auth user a Bolão admin?
create or replace function public.bolao_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.bolao_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Enable RLS
alter table public.bolao_profiles      enable row level security;
alter table public.bolao_groups        enable row level security;
alter table public.bolao_teams         enable row level security;
alter table public.bolao_matches       enable row level security;
alter table public.bolao_predictions   enable row level security;
alter table public.bolao_prizes_config enable row level security;
alter table public.bolao_badges        enable row level security;
alter table public.bolao_user_badges   enable row level security;

-- PROFILES: everyone authenticated can read; users update only their own row
drop policy if exists bolao_profiles_read on public.bolao_profiles;
create policy bolao_profiles_read on public.bolao_profiles
  for select using (true);

drop policy if exists bolao_profiles_insert_self on public.bolao_profiles;
create policy bolao_profiles_insert_self on public.bolao_profiles
  for insert with check (auth.uid() = id);

-- Users may update own row but NOT escalate role (role must stay unchanged).
drop policy if exists bolao_profiles_update_self on public.bolao_profiles;
create policy bolao_profiles_update_self on public.bolao_profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.bolao_profiles p where p.id = auth.uid()));

-- GROUPS / TEAMS / MATCHES: public read, admin write
drop policy if exists bolao_groups_read on public.bolao_groups;
create policy bolao_groups_read on public.bolao_groups for select using (true);
drop policy if exists bolao_groups_write on public.bolao_groups;
create policy bolao_groups_write on public.bolao_groups for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

drop policy if exists bolao_teams_read on public.bolao_teams;
create policy bolao_teams_read on public.bolao_teams for select using (true);
drop policy if exists bolao_teams_write on public.bolao_teams;
create policy bolao_teams_write on public.bolao_teams for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

drop policy if exists bolao_matches_read on public.bolao_matches;
create policy bolao_matches_read on public.bolao_matches for select using (true);
drop policy if exists bolao_matches_write on public.bolao_matches;
create policy bolao_matches_write on public.bolao_matches for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

-- PREDICTIONS: everyone can read (leaderboard); users insert/update only own row.
-- `points` may only be set by admins (enforced in API; here we restrict writes to own row).
drop policy if exists bolao_predictions_read on public.bolao_predictions;
create policy bolao_predictions_read on public.bolao_predictions for select using (true);

drop policy if exists bolao_predictions_insert_self on public.bolao_predictions;
create policy bolao_predictions_insert_self on public.bolao_predictions
  for insert with check (auth.uid() = user_id and points is null);

drop policy if exists bolao_predictions_update_self on public.bolao_predictions;
create policy bolao_predictions_update_self on public.bolao_predictions
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bolao_predictions_admin on public.bolao_predictions;
create policy bolao_predictions_admin on public.bolao_predictions
  for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

-- PRIZES_CONFIG / BADGES: public read, admin write
drop policy if exists bolao_prizes_read on public.bolao_prizes_config;
create policy bolao_prizes_read on public.bolao_prizes_config for select using (true);
drop policy if exists bolao_prizes_write on public.bolao_prizes_config;
create policy bolao_prizes_write on public.bolao_prizes_config for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

drop policy if exists bolao_badges_read on public.bolao_badges;
create policy bolao_badges_read on public.bolao_badges for select using (true);
drop policy if exists bolao_badges_write on public.bolao_badges;
create policy bolao_badges_write on public.bolao_badges for all using (public.bolao_is_admin()) with check (public.bolao_is_admin());

drop policy if exists bolao_user_badges_read on public.bolao_user_badges;
create policy bolao_user_badges_read on public.bolao_user_badges for select using (true);
drop policy if exists bolao_user_badges_self on public.bolao_user_badges;
create policy bolao_user_badges_self on public.bolao_user_badges
  for all using (auth.uid() = user_id or public.bolao_is_admin())
  with check (auth.uid() = user_id or public.bolao_is_admin());

-- NOTE: The server uses the service-role key for admin mutations & scoring,
-- which bypasses RLS. These policies protect direct (anon/auth) client access.
