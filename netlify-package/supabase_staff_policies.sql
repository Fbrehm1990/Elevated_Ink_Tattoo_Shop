-- =========================================================
-- Crow & Iron Tattoo Co. — staff edit/cancel policies
-- Run this AFTER your existing bookings setup.
-- Assumes a table like:
--   artist_profiles (user_id uuid references auth.users primary key, artist_id text)
-- linking each Supabase Auth account to the artist they manage.
-- Adjust the column names below if yours differ.
-- =========================================================

-- 6. Allow a signed-in artist to UPDATE only bookings tied to their own artist_id
create policy "Staff can update their own bookings"
  on bookings for update
  to authenticated
  using (
    artist_id = (
      select artist_id from artist_profiles where user_id = auth.uid()
    )
  )
  with check (
    artist_id = (
      select artist_id from artist_profiles where user_id = auth.uid()
    )
  );

-- 7. Allow a signed-in artist to DELETE (cancel) only their own bookings
create policy "Staff can delete their own bookings"
  on bookings for delete
  to authenticated
  using (
    artist_id = (
      select artist_id from artist_profiles where user_id = auth.uid()
    )
  );

-- 8. Staff also need to SELECT bookings as an authenticated user
--    (the existing "Anyone can view bookings" policy is for the
--    anon role only — authenticated needs its own select policy,
--    or this widens "Anyone can view" to include authenticated too)
create policy "Staff can view their own bookings"
  on bookings for select
  to authenticated
  using (
    artist_id = (
      select artist_id from artist_profiles where user_id = auth.uid()
    )
  );

-- =========================================================
-- Repeat the same three policies for blocked_slots, since the
-- staff dashboard also inserts/deletes rows there (Block/Unblock).
-- Swap in your actual blocked_slots column names if different.
-- =========================================================

alter table blocked_slots enable row level security;

create policy "Staff can view their own blocks"
  on blocked_slots for select
  to authenticated
  using (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

create policy "Staff can insert their own blocks"
  on blocked_slots for insert
  to authenticated
  with check (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

create policy "Staff can delete their own blocks"
  on blocked_slots for delete
  to authenticated
  using (
    artist_id = (select artist_id from artist_profiles where user_id = auth.uid())
  );

-- Public also needs to see blocked_slots to know which times are taken
create policy "Anyone can view blocked slots"
  on blocked_slots for select
  to anon
  using (true);
