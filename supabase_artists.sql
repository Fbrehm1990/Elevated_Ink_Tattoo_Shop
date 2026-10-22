-- Lets TJ and Ariana add new artists to the website (Manage mode "+" button).
-- Run once in the Supabase SQL editor (after supabase_roles.sql).
create table if not exists public.site_artists (
  slug text primary key,
  name text not null,
  role text default 'Resident Artist',
  bio text default '',
  instagram text default '',
  photo text default '',
  photo_path text,
  position int not null default 0,
  created_at timestamptz default now()
);
alter table public.site_artists enable row level security;
drop policy if exists "Anyone can see artists" on public.site_artists;
create policy "Anyone can see artists" on public.site_artists for select using (true);
drop policy if exists "Managers add artists" on public.site_artists;
create policy "Managers add artists" on public.site_artists for insert to authenticated with check (public.can_manage_portfolios());
drop policy if exists "Managers change artists" on public.site_artists;
create policy "Managers change artists" on public.site_artists for update to authenticated using (public.can_manage_portfolios()) with check (public.can_manage_portfolios());
drop policy if exists "Managers delete artists" on public.site_artists;
create policy "Managers delete artists" on public.site_artists for delete to authenticated using (public.can_manage_portfolios());

-- Lets managers remove (hide) the original artists, e.g. when someone leaves.
alter table public.site_artists add column if not exists hidden boolean default false;

-- When an artist is removed from the website, delete their booking calendar too
-- (appointments, blocked time and the link to their login). TJ, Ariana and the Freddy test page are protected.
create or replace function public.cleanup_removed_artist()
returns trigger language plpgsql security definer set search_path = public as $$
declare s text := null;
begin
  if tg_op = 'DELETE' then
    if coalesce(old.hidden, false) = false and old.slug not in ('tj','ariana','makenzi','aaron','austin','doug') then s := old.slug; end if;
  elsif coalesce(new.hidden, false) = true and (tg_op = 'INSERT' or coalesce(old.hidden, false) = false) then
    s := new.slug;
  end if;
  if s is not null and s not in ('tj','ariana','freddy') then
    delete from public.bookings where artist_id = s;
    delete from public.blocked_slots where artist_id = s;
    delete from public.artist_profiles where artist_id = s;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists site_artists_cleanup on public.site_artists;
create trigger site_artists_cleanup after insert or update or delete on public.site_artists
  for each row execute function public.cleanup_removed_artist();
