-- =========================================================
-- Elevated Ink — Portfolio photo management
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- (Safe to run again; it skips anything that already exists.)
--
-- What it sets up:
--   1. A `portfolio_photos` table that records each artist's edits:
--        - photos an artist UPLOADS (stored in the `portfolio` bucket)
--        - changes to the photos already on the site (caption,
--          featured, or "removed")
--   2. A public storage bucket called `portfolio` for uploaded photos
--   3. Row-level security so ANYONE can view photos, but a signed-in
--      artist can only add/edit/remove rows and files for THEIR OWN
--      artist_id (looked up through artist_profiles, like the scheduler)
-- =========================================================

create table if not exists portfolio_photos (
  id           uuid primary key default gen_random_uuid(),
  artist_id    text not null,
  src          text not null,            -- image address: "images/portfolio/tj-001.jpg" or a storage URL
  storage_path text,                     -- set only for uploaded photos, so the file can be deleted too
  caption      text not null default '',
  featured     boolean not null default false,
  hidden       boolean not null default false,   -- true = removed from the public page (restorable)
  created_at   timestamptz not null default now(),
  unique (artist_id, src)
);

alter table portfolio_photos enable row level security;

drop policy if exists "Anyone can view portfolio photos" on portfolio_photos;
create policy "Anyone can view portfolio photos"
  on portfolio_photos for select
  to anon, authenticated
  using (true);

drop policy if exists "Artists add their own portfolio photos" on portfolio_photos;
create policy "Artists add their own portfolio photos"
  on portfolio_photos for insert
  to authenticated
  with check (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

drop policy if exists "Artists edit their own portfolio photos" on portfolio_photos;
create policy "Artists edit their own portfolio photos"
  on portfolio_photos for update
  to authenticated
  using (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  )
  with check (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

drop policy if exists "Artists delete their own portfolio photos" on portfolio_photos;
create policy "Artists delete their own portfolio photos"
  on portfolio_photos for delete
  to authenticated
  using (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

-- ---------------------------------------------------------
-- Storage bucket for uploaded photos (public to view, 5 MB max,
-- JPG/PNG/WebP only). Each artist's files live in a folder named
-- after their artist_id, e.g. portfolio/tj/1699999999-ab12.jpg
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists "Portfolio images are public" on storage.objects;
create policy "Portfolio images are public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'portfolio');

drop policy if exists "Artists upload to their own portfolio folder" on storage.objects;
create policy "Artists upload to their own portfolio folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select artist_id from artist_profiles where user_id = auth.uid())
  );

drop policy if exists "Artists update files in their own portfolio folder" on storage.objects;
create policy "Artists update files in their own portfolio folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select artist_id from artist_profiles where user_id = auth.uid())
  );

drop policy if exists "Artists delete files in their own portfolio folder" on storage.objects;
create policy "Artists delete files in their own portfolio folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select artist_id from artist_profiles where user_id = auth.uid())
  );
