-- =========================================================
-- Elevated Ink — Artist Scheduler policies
-- Run this AFTER staff_policies_1.sql / supabase_staff_policies.sql.
--
-- The public booking form has been removed from the site.
-- Appointments are now created directly by the signed-in artist
-- through the new calendar in the "Artist Scheduler" section, so
-- staff need permission to INSERT into `bookings` — which the
-- original staff policies file didn't grant (it only covered
-- UPDATE, DELETE, and SELECT).
-- =========================================================

create policy "Staff can insert their own bookings"
  on bookings for insert
  to authenticated
  with check (
    artist_id = (
      select artist_id from artist_profiles where user_id = auth.uid()
    )
  );

-- =========================================================
-- IMPORTANT — security cleanup
--
-- Since the public booking form is gone, anonymous visitors no
-- longer need permission to insert into `bookings`. Your original
-- setup (from before this project) almost certainly has a policy
-- that lets the `anon` role insert — something like:
--
--   create policy "Anyone can create a booking"
--     on bookings for insert
--     to anon
--     with check (true);
--
-- Find it in Supabase Dashboard → Authentication → Policies →
-- bookings, and drop it (replace the name below with whatever
-- yours is actually called):
--
--   drop policy "Anyone can create a booking" on bookings;
--
-- This file can't do that step for you automatically — it wasn't
-- part of what was shared with me, so I don't know its exact name.
-- Leaving it in place means anyone who finds your Supabase project
-- URL could still insert fake appointments directly against the
-- API, completely bypassing the website and the artist scheduler.
-- =========================================================
