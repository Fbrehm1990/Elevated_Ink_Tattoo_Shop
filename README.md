# Elevated Ink Tattoo Co. — Website

A static site for a 6-artist tattoo studio: a public marketing site (hero, team
photo, artist previews, gallery, FAQ) with no public booking form — clients reach
out to artists directly on Instagram — plus a **separate, unlinked** scheduler page
where each artist manages their own calendar in Supabase. The scheduler is
deliberately not linked from anywhere on the public pages; only someone who has
the direct URL can reach it.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home — hero, team photo + shop socials, artist previews, priced gallery, FAQ |
| `scheduler.html` | **Not linked publicly.** Artist sign-in + calendar. Bookmark the direct URL — it's `noindex` and won't show up in search either |
| `tj.html` | TJ — bio, portfolio, socials, "Message to Book" |
| `austin.html` | Austin — bio, portfolio, socials, "Message to Book" |
| `ariana.html` | Ariana — bio, portfolio, socials, "Message to Book" |
| `makenzi.html` | Makenzi — bio, portfolio, socials, "Message to Book" |
| `aaron.html` | Aaron — bio, portfolio, socials, "Message to Book" |
| `doug.html` | Doug — bio, portfolio, socials, "Message to Book" |
| `terms.html` | Terms of Service |
| `privacy.html` | Privacy Policy |
| `accessibility.html` | Accessibility Statement |
| `logo.png` | Shop logo, processed to a transparent light-ink mark for the dark background |
| `logo-watermark.png` | Same logo at higher opacity — the large fixed background behind every page |
| `supabase_staff_policies.sql` | RLS policies for staff to view/update/cancel/block their own bookings — **run first** |
| `artist_scheduler_policies.sql` | RLS policy letting a signed-in artist INSERT appointments — **run second**, and read the note inside about disabling the old public-booking policy |

No build step, no framework — plain HTML/CSS/JS in each file. Only `scheduler.html`
loads the Supabase JS client; the public pages don't need it at all anymore.

## The Artist Scheduler

Open `scheduler.html` directly (bookmark it — there's no link to it anywhere on
the public site on purpose) and sign in with your own Supabase Auth email/password,
linked to an `artist_id` via `artist_profiles`. Once signed in you get a real month
calendar:

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
   plain files, so they're reachable at `/tj.html`, `/austin.html`, etc.
3. **Keep all files in the same folder** — every page links back to `index.html`
   and loads `logo.png` / `logo-watermark.png` by relative path. If any of these
   move, update the paths in the affected tags.

## Supabase setup

**If you already set up any test logins under the old roster (`mara`/`desmond`/`yuki`),
those `artist_id` values no longer match anything on the site.** The real artist IDs
are now `tj`, `austin`, `ariana`, `makenzi`, `aaron`, `doug` — update the `artist_id`
column in your `artist_profiles` table (Supabase Table Editor) to match, or sign-in
will succeed but the scheduler will say no artist profile is linked.

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
  `<script>` block in each artist page (`tj.html`, `austin.html`, `ariana.html`, `makenzi.html`, `aaron.html`, `doug.html`). Bios are currently neutral placeholders — swap in real ones when ready.
- **Gallery art and prices**: the `GALLERY` array and `svg*()` functions in
  `index.html` — hand-drawn inline SVGs, no image files to manage or host.
- **FAQ answers** (deposit, age requirement, walk-ins, prep): plain HTML in the
  `#faq` section of `index.html` — each is a `<details>` element, no JS involved.
- **Hours, address, phone**: in the `<footer>` of each page.
- **Logo size/opacity on the page background**: `background-size` and the
  `logo-watermark.png` file itself (baked-in opacity, not CSS) in the `body` rule
  near the top of each page's `<style>` block.


## Spotlight slideshow (homepage)

The first photo section on `index.html` is a slideshow. Slides are listed in the
`SLIDES` array in the last `<script>` block of `index.html`; each one points at a
file in `spotlight/`. To add or swap a slide, drop the photo into `spotlight/` and
add or edit a line in that array (image, alt text, title, caption, link).

## Artist portfolio manager

`portfolio-manager.html` (linked from the scheduler as "My Portfolio") lets a signed-in
artist add, edit, feature, remove and restore photos on their own portfolio page. It uses
the same Supabase sign-in as the scheduler, so an artist already signed in there does not
need to sign in again.

**One-time setup:** run `supabase_portfolio.sql` in the Supabase SQL Editor. It creates the
`portfolio_photos` table and a public `portfolio` storage bucket, with rules so each artist
can only change their own photos (matched through `artist_profiles`, like the scheduler).

How photos are combined on the public pages:
- `portfolio.json` + `images/portfolio/` hold the starter photos (imported from Instagram).
- Anything an artist changes in the manager is stored in Supabase and layered on top:
  uploads are added, "removed" starter photos are hidden (restorable), captions and
  "featured" flags override the starter values.
- If Supabase can't be reached, the pages fall back to the starter set.
- Featured photos show first on the artist page, and up to 4 per artist appear in the
  homepage gallery.


## Artist accounts (created by the shop owner)

Public sign-up is OFF. The shop owner creates each artist's account in Supabase.
`auth.js` (shared by `scheduler.html`, `portfolio-manager.html`, `change-password.html`)
adds a **Menu** dropdown once signed in: Scheduler, My Portfolio, Change password, Sign out.

**One-time setup**
1. Supabase -> Authentication -> Sign In / Providers -> turn OFF "Allow new users to sign up".
2. For each artist: Authentication -> Users -> Add user -> Create new user. Enter their email and a
   temporary password and tick "Auto Confirm User".
3. Link each account to its artist page (SQL Editor), one line per artist:
   `insert into artist_profiles (user_id, artist_id) select id, 'tj' from auth.users where email = 'tj@example.com';`
   Artist ids: tj, austin, ariana, makenzi, aaron, doug.
4. Tell each artist their temporary password. After signing in at /scheduler they open
   Menu -> Change password and choose their own.

To remove an artist's access: Authentication -> Users -> delete (or ban) the user.

## Artist profile text (bio, title, intro, specialties, Instagram)

Run `supabase_profiles.sql` once in the Supabase SQL Editor. Artists then edit these under
**My Portfolio -> Edit Portfolio -> Profile & bio**. Saved text shows on their public page
(`/tj`, `/austin`, ...); blank boxes keep the default text already in the page. Artists can only
change their own row.

## Footer

Every page's footer is centered: logo, contact info, then a **Legal** heading with the Terms,
Privacy and Accessibility links centered beneath it.

## Roles: master calendar and portfolio managers

Run `supabase_roles.sql` once (after `supabase_portfolio.sql` and `supabase_profiles.sql`), then
uncomment and run the two lines at the bottom with TJ's and Ariana's sign-in emails.
- **TJ (master):** Scheduler -> **Master Calendar** tab shows every artist's appointments for a chosen day
  (reads the same bookings table, so anything an artist schedules appears there automatically).
  The **Calendar** tab has a "Viewing calendar of" dropdown to open and edit any artist's calendar.
  My Portfolio has a "Managing portfolio for" dropdown to add/edit/delete photos and profile text for any artist.
- **Ariana (social media manager):** same "Managing portfolio for" dropdown on My Portfolio. Her scheduler is her own calendar.
- Roles can only be granted in the Supabase SQL Editor, never from the website.

## Other content

- Hero slogan: "Rise Above". Artist order everywhere: TJ, Ariana, Makenzi, Aaron, Austin, Doug.
- Artist pages show an artist photo to the right of the bio (upload it under Profile & bio). TJ and Ariana
  default to their expo photos until they upload one.
- Homepage gallery: newest uploads (any artist) appear first, then each artist's featured photos.
- FAQ section rewritten, followed by the plain note "We do not sell tattoo supplies."

## Edit photos right on the artist page

`page-edit.js` (loaded by every artist page) does nothing for visitors. When TJ, Ariana (or the artist who
owns that page) is signed in on the same browser, photos show an **Edit** badge: click one to open a pop-out
to change its caption, feature it, or remove it. A bar at the bottom has **+ Add photos**, **Edit bio & profile**,
and an **Edit mode** toggle to preview the page as a visitor. Permissions are enforced by the database.
