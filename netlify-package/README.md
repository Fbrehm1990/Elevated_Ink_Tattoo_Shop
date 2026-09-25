# Elevated Ink Tattoo Co. — Website

A static site for a 3-artist tattoo studio: single-page marketing site (hero, artist
previews, gallery, FAQ) plus a dedicated profile page per artist, backed by an
artist-only scheduler where each artist manages their own calendar directly in
Supabase. There's no public booking form — clients reach out to the artist
directly on Instagram, and the artist puts the appointment on their own calendar.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — hero, artist previews, priced gallery, FAQ, artist scheduler login |
| `mara.html` | Mara Voss — full bio, priced portfolio, socials, "Message to Book" |
| `desmond.html` | Desmond Cole — full bio, priced portfolio, socials, "Message to Book" |
| `yuki.html` | Yuki Tanaka — full bio, priced portfolio, socials, "Message to Book" |
| `logo.png` | Shop logo, processed to a transparent light-ink mark for the dark background |
| `logo-watermark.png` | Same logo at ~11% opacity — the large fixed background behind every page |
| `supabase_staff_policies.sql` | RLS policies for staff to view/update/cancel/block their own bookings — **run first** |
| `artist_scheduler_policies.sql` | RLS policy letting a signed-in artist INSERT appointments — **run second**, and read the note inside about disabling the old public-booking policy |

No build step, no framework — plain HTML/CSS/JS in each file plus the Supabase JS
client loaded from a CDN.

## The Artist Scheduler

Each artist signs in (bottom of the homepage, or the "Staff Login" footer link) with
their own Supabase Auth email/password, linked to an `artist_id` via
`artist_profiles`. Once signed in they get a real month calendar:

- Click any studio day (Tue–Sat) to open it
- **Add** — log a client appointment: name, phone, and a note field for tattoo
  idea / placement / deposit status, whatever's useful
- **Block** a time they're unavailable, or **Unblock** one
- Click any existing appointment to edit the client's details, move it to a
  different date/time, or cancel it
- A red dot on a day means it has appointments; a gold dot means it has blocked
  time; a gold outline marks today

Each artist only ever sees and edits their own calendar — enforced both in the UI
and by the two SQL policy files above.

## Deploying to Netlify

This is a static site, so there's nothing to build:

1. Drag this whole folder onto [app.netlify.com/drop](https://app.netlify.com/drop),
   **or** connect this repo in Netlify and leave the build command blank with the
   publish directory set to the repo root (`.`).
2. Netlify serves `index.html` at the root automatically. The artist pages are
   plain files, so they're reachable at `/mara.html`, `/desmond.html`, `/yuki.html`.
3. **Keep all files in the same folder** — every page links back to `index.html`
   and loads `logo.png` / `logo-watermark.png` by relative path. If any of these
   move, update the paths in the affected tags.

## Supabase setup

Configuration lives near the top of the `<script>` block in `index.html`:

```js
const SUPABASE_URL = "https://bvsgrgdardumiabfewwr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__Qic8J69dJyd76lnVw2m-A_OaF0R9nO";
```

This is the **publishable anon key**, not a secret — it's meant to be visible in
client-side code. Data access is controlled by Supabase's row-level security (RLS)
policies, not by hiding this key.

Run both SQL files against your Supabase project (SQL Editor → paste → run), in
this order:

1. `supabase_staff_policies.sql`
2. `artist_scheduler_policies.sql` — **and follow the comment inside it**: it
   flags that your original public-booking `anon insert` policy on `bookings`
   should be dropped now that the public form is gone, since leaving it live
   means anyone with your Supabase URL could still insert fake appointments
   directly against the API.

If a signed-in artist's adds, edits, or cancellations silently fail with a
message about RLS policies, one of these two files likely hasn't been applied yet.

## Editing content

- **Artist bios, portfolio pieces/prices, and social links**: near the top of the
  `<script>` block in each artist page (`mara.html`, `desmond.html`, `yuki.html`).
  The Instagram/TikTok handles are placeholders — swap in the real ones.
- **Gallery art and prices**: the `GALLERY` array and `svg*()` functions in
  `index.html` — hand-drawn inline SVGs, no image files to manage or host.
- **FAQ answers** (deposit, age requirement, walk-ins, prep): plain HTML in the
  `#faq` section of `index.html` — each is a `<details>` element, no JS involved.
- **Hours, address, phone**: in the `<footer>` of each page.
- **Logo size/opacity on the page background**: `background-size` and the
  `logo-watermark.png` file itself (baked-in opacity, not CSS) in the `body` rule
  near the top of each page's `<style>` block.
