-- =========================================================
-- Elevated Ink — Artist profile text (bio, role, intro, specialties, Instagram)
-- Run ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- (Safe to run again.)
--
-- Anyone can READ these (they show on the public artist pages).
-- A signed-in artist can only ADD/CHANGE the row for THEIR OWN artist_id
-- (looked up through artist_profiles, same as the portfolio photos).
-- =========================================================

create table if not exists artist_bios (
  artist_id   text primary key,
  role        text not null default '',
  tagline     text not null default '',
  bio         text not null default '',
  specialties text not null default '',     -- comma-separated, e.g. "Traditional, Color realism"
  instagram   text not null default '',     -- handle only, no @
  updated_at  timestamptz not null default now()
);

alter table artist_bios enable row level security;

drop policy if exists "Anyone can view artist profiles" on artist_bios;
create policy "Anyone can view artist profiles"
  on artist_bios for select to anon, authenticated using (true);

drop policy if exists "Artists add their own profile text" on artist_bios;
create policy "Artists add their own profile text"
  on artist_bios for insert to authenticated
  with check (artist_id = (select artist_id from artist_profiles where user_id = auth.uid()));

drop policy if exists "Artists edit their own profile text" on artist_bios;
create policy "Artists edit their own profile text"
  on artist_bios for update to authenticated
  using      (artist_id = (select artist_id from artist_profiles where user_id = auth.uid()))
  with check (artist_id = (select artist_id from artist_profiles where user_id = auth.uid()));
