-- Editable homepage slideshow. Run once in the Supabase SQL editor (after supabase_roles.sql).
create table if not exists public.site_slides (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  img text not null,
  storage_path text,
  fit text,
  title text default '',
  text text default '',
  link text default '',
  link_text text default '',
  created_at timestamptz default now()
);
alter table public.site_slides enable row level security;
drop policy if exists "Anyone can see slides" on public.site_slides;
create policy "Anyone can see slides" on public.site_slides for select using (true);
drop policy if exists "Managers add slides" on public.site_slides;
create policy "Managers add slides" on public.site_slides for insert to authenticated with check (public.can_manage_portfolios());
drop policy if exists "Managers change slides" on public.site_slides;
create policy "Managers change slides" on public.site_slides for update to authenticated using (public.can_manage_portfolios()) with check (public.can_manage_portfolios());
drop policy if exists "Managers delete slides" on public.site_slides;
create policy "Managers delete slides" on public.site_slides for delete to authenticated using (public.can_manage_portfolios());
