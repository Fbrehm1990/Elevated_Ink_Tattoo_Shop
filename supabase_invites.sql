-- Artist self-signup by invitation. Run once in the Supabase SQL editor (after supabase_artists.sql).
-- Managers (TJ, Ariana) create a one-time sign-up link for an artist; the artist opens it,
-- picks their own email + password, and the account is linked to their artist page automatically.

create table if not exists public.artist_invites (
  code text primary key default replace(gen_random_uuid()::text, '-', ''),
  artist_id text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  used_by uuid,
  used_at timestamptz
);
alter table public.artist_invites enable row level security;
drop policy if exists "Managers see invites" on public.artist_invites;
create policy "Managers see invites" on public.artist_invites for select to authenticated using (public.can_manage_portfolios());
drop policy if exists "Managers create invites" on public.artist_invites;
create policy "Managers create invites" on public.artist_invites for insert to authenticated with check (public.can_manage_portfolios());
drop policy if exists "Managers delete invites" on public.artist_invites;
create policy "Managers delete invites" on public.artist_invites for delete to authenticated using (public.can_manage_portfolios());

-- Lets the sign-up page show which artist a link is for (without exposing the invites table).
create or replace function public.invite_info(p_code text)
returns table(artist_id text, name text) language sql security definer set search_path = public as $$
  select i.artist_id, coalesce(a.name, '') from public.artist_invites i
  left join public.site_artists a on a.slug = i.artist_id
  where i.code = p_code and i.used_at is null and i.expires_at > now();
$$;
grant execute on function public.invite_info(text) to anon, authenticated;

-- Links the signed-in person to the artist page named by a valid, unused invite.
create or replace function public.claim_invite(p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  if auth.uid() is null then raise exception 'Please sign in first.'; end if;
  select * into inv from public.artist_invites where code = p_code and used_at is null and expires_at > now() for update;
  if not found then raise exception 'This sign-up link is no longer valid.'; end if;
  if exists (select 1 from public.artist_profiles where user_id = auth.uid()) then
    raise exception 'This account is already linked to an artist page.';
  end if;
  insert into public.artist_profiles (user_id, artist_id) values (auth.uid(), inv.artist_id);
  update public.artist_invites set used_by = auth.uid(), used_at = now() where code = inv.code;
  return inv.artist_id;
end $$;
revoke all on function public.claim_invite(text) from public, anon;
grant execute on function public.claim_invite(text) to authenticated;
