-- =========================================================
-- Elevated Ink — Staff roles (TJ = master, Ariana = social media manager)
-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- (Safe to run again.) Run AFTER supabase_portfolio.sql and supabase_profiles.sql.
--
--   master  (TJ)     : sees and edits EVERY artist's calendar, plus the
--                      master day view, and can add/edit/delete photos
--                      and profile text for EVERY artist.
--   social  (Ariana) : can add/edit/delete photos and profile text for
--                      EVERY artist. (Her own calendar works as before.)
--   everyone else    : unchanged — only their own calendar and portfolio.
--
-- Roles can only be granted here in the SQL Editor (or the dashboard).
-- The website cannot give anyone a role.
-- =========================================================

create table if not exists staff_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null check (role in ('master', 'social'))
);

alter table staff_roles enable row level security;

-- A signed-in person may read ONLY their own role row (so the site knows what to show them).
drop policy if exists "Read own role" on staff_roles;
create policy "Read own role" on staff_roles
  for select to authenticated using (user_id = auth.uid());
-- (No insert/update/delete policies: nobody can change roles from the website.)

create or replace function is_master() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role = 'master');
$$;

create or replace function can_manage_portfolios() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff_roles where user_id = auth.uid() and role in ('master', 'social'));
$$;

revoke all on function is_master(), can_manage_portfolios() from public, anon;
grant execute on function is_master(), can_manage_portfolios() to authenticated;

-- ---------- master: every artist's calendar ----------
drop policy if exists "Master reads all bookings" on bookings;
create policy "Master reads all bookings" on bookings for select to authenticated using (is_master());
drop policy if exists "Master adds bookings" on bookings;
create policy "Master adds bookings" on bookings for insert to authenticated with check (is_master());
drop policy if exists "Master edits bookings" on bookings;
create policy "Master edits bookings" on bookings for update to authenticated using (is_master()) with check (is_master());
drop policy if exists "Master deletes bookings" on bookings;
create policy "Master deletes bookings" on bookings for delete to authenticated using (is_master());

drop policy if exists "Master reads all blocked slots" on blocked_slots;
create policy "Master reads all blocked slots" on blocked_slots for select to authenticated using (is_master());
drop policy if exists "Master adds blocked slots" on blocked_slots;
create policy "Master adds blocked slots" on blocked_slots for insert to authenticated with check (is_master());
drop policy if exists "Master edits blocked slots" on blocked_slots;
create policy "Master edits blocked slots" on blocked_slots for update to authenticated using (is_master()) with check (is_master());
drop policy if exists "Master deletes blocked slots" on blocked_slots;
create policy "Master deletes blocked slots" on blocked_slots for delete to authenticated using (is_master());

-- ---------- master + social: every artist's portfolio and profile ----------
drop policy if exists "Managers add any portfolio photo" on portfolio_photos;
create policy "Managers add any portfolio photo" on portfolio_photos for insert to authenticated with check (can_manage_portfolios());
drop policy if exists "Managers edit any portfolio photo" on portfolio_photos;
create policy "Managers edit any portfolio photo" on portfolio_photos for update to authenticated using (can_manage_portfolios()) with check (can_manage_portfolios());
drop policy if exists "Managers delete any portfolio photo" on portfolio_photos;
create policy "Managers delete any portfolio photo" on portfolio_photos for delete to authenticated using (can_manage_portfolios());

drop policy if exists "Managers add any artist profile" on artist_bios;
create policy "Managers add any artist profile" on artist_bios for insert to authenticated with check (can_manage_portfolios());
drop policy if exists "Managers edit any artist profile" on artist_bios;
create policy "Managers edit any artist profile" on artist_bios for update to authenticated using (can_manage_portfolios()) with check (can_manage_portfolios());

drop policy if exists "Managers upload to any portfolio folder" on storage.objects;
create policy "Managers upload to any portfolio folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio' and can_manage_portfolios());
drop policy if exists "Managers update any portfolio file" on storage.objects;
create policy "Managers update any portfolio file" on storage.objects for update to authenticated
  using (bucket_id = 'portfolio' and can_manage_portfolios());
drop policy if exists "Managers delete any portfolio file" on storage.objects;
create policy "Managers delete any portfolio file" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and can_manage_portfolios());

-- =========================================================
-- GIVE THE ROLES — replace the emails with TJ's and Ariana's sign-in emails
-- (the ones you used in Authentication -> Users), then run these two lines:
-- =========================================================
-- insert into staff_roles (user_id, role) select id, 'master' from auth.users where email = 'TJS-EMAIL@example.com'
--   on conflict (user_id) do update set role = excluded.role;
-- insert into staff_roles (user_id, role) select id, 'social' from auth.users where email = 'ARIANAS-EMAIL@example.com'
--   on conflict (user_id) do update set role = excluded.role;
