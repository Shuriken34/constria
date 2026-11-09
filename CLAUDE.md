# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Constria is a Romanian-language marketplace (OLX-style) for buying, selling and renting construction materials, machinery (`utilaje`) and tools (`scule`). Buyers contact sellers directly; sellers handle delivery. All UI text, flash messages, validation errors and email copy are in Romanian, so keep new copy in Romanian (with correct diacritics: ă â î ș ț).

Stack: Node.js (CommonJS, Node ≥ 20.12) + Express 5 + server-rendered EJS. Supabase provides Postgres, Auth and Storage. There is no build step, bundler, linter or test suite.

## Commands

```bash
npm install
npm run dev     # node --watch server.js, http://localhost:3000 (PORT overrides)
npm start       # node server.js
node scripts/smtp-test.mjs   # interactive check of SMTP credentials (Hostinger / Titan)
```

On this Windows machine PowerShell blocks `npx.ps1`/`npm.ps1`, so use `npm.cmd` / `npx.cmd`. Git lives at `C:\Program Files\Git\cmd` and may not be on PATH in PowerShell sessions.

There are no automated tests. Verify changes by running the server and requesting the affected routes (e.g. with `fetch`/`curl`), including logged-in flows.

## Configuration

`server.js` loads `.env` and, when `NODE_ENV=production`, also `.env.production`. Variables already set in the process environment win over both files.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the `NEXT_PUBLIC_` names are historical; this is not a Next.js app. Only the publishable key is used anywhere. Never add an `sb_secret_` key; `.env.production` is committed, `.env` is gitignored.
- `SITE_URL`: base for auth email redirect links (falls back to the request host).
- `SESSION_SECRET`: signs the `co_sess` cookie (falls back to a generated `data/.secret`).

## Architecture

### Request pipeline (`server.js`)

static files → body parsers → `cookie-session` (`co_sess`, used only for flash messages, the CSRF token and small UI state) → a middleware that spreads everything from `src/helpers.js` and `src/data.js` into `res.locals` (so every template can use helpers, categories, counties, etc. directly) → `loadUser` → `csrf` → `flashLocals` → `verifyCsrf` → routers (`public`, `auth`, `account`, `/admin`).

- `loadUser` (`src/middleware.js`) creates `req.sb`, a per-request Supabase client from `src/supabase.js` (`@supabase/ssr` with cookie get/set adapters), calls `auth.getClaims()`, then loads the user's `profiles` + `profile_contacts` rows into `req.user` / `res.locals.user`. `req.user.role` is `'admin'` only when the JWT's `app_metadata.role === 'admin'`. A new role takes effect only after the user logs in again.
- CSRF: `verifyCsrf` checks every non-multipart POST (`_csrf` field or `X-CSRF-Token` header). Multipart routes run multer first and must call `checkCsrf(req)` themselves. The token is also exposed in `<meta name="csrf-token">` for `public/js/main.js` fetch calls.
- Express 5 forwards rejected async handlers to the error handler; `must()` in `src/supabase.js` turns a Supabase `{ error }` into a thrown error.

### Authorization lives in the database

The server never uses a service/secret key. Every query runs through `req.sb` as the current user (or as `anon`), so Postgres RLS policies and column-level grants are the real access control; route guards (`requireAuth`, `requireAdmin`) only shape the UX. When adding a feature that writes data, check that the matching RLS policy and column `GRANT` exist, or the write will fail or silently affect 0 rows.

- Schema, policies, views and functions exist only as migrations applied to the Supabase project (`uqligfwvdktyeeetqyio`); there are no migration files in this repo. Use the Supabase MCP tools to inspect or change them, and run the security advisor afterwards.
- Read-side views (`security_invoker`): `listing_cards` (listing + seller fields + `cover` image, the main source for cards and the listing page), `category_counts`, `seller_stats`, `conversation_overview` (last message + unread count for the current user).
- Operations that need to bypass grants go through `SECURITY DEFINER` RPCs with internal checks: `get_listing_phone` (active listings only), `increment_listing_views`, `my_listing_fav_counts`, `admin_set_featured`, `admin_set_profile_flags`, `delete_my_account`.
- Private data is split out: emails and phones live in `profile_contacts` (owner/admin only), and public profile fields in `profiles`. A trigger on `auth.users` creates both rows from the sign-up metadata.
- Every form submission requires an account (listings, messages, favourites, reviews, reports, contact form). Browsing, search and phone reveal are public.

### Domain data and listings

- Categories, groups (`materiale`, `utilaje`, `scule`), units, counties and image URLs are static config in `src/data.js`, not database tables; listings store the category slug as text. `rentableGroups` (`utilaje`, `scule`) enables `listing_type` (sale/rent), brand, model and year; `hours` applies to `utilaje` only (enforced in `parseListing` in `src/routes/account.js` and in the form JS).
- Search uses `listings.search_text`, a diacritics-stripped string built by `buildSearchText` in `src/models.js` and matched word by word with `ilike`. Any code path that writes a listing must go through `createListing` / `updateListing` so `search_text` and `slug` stay in sync.
- Listing URLs are `/anunt/:id-:slug`; wrong slugs 301-redirect to the canonical one.
- Images: multer keeps uploads in memory (`src/upload.js`), magic bytes are checked, and files go to the Supabase Storage bucket `listing-images` under `<userId>/`. RLS only lets a user write to their own folder. `listing_images.path` stores the public URL and `storage_path` the object key; `helpers.imgSrc` handles both absolute URLs and placeholders.
- Dates from Postgres are ISO strings; format them with `helpers.parseDate`, `timeAgo`, `formatDate`.

### Auth flows (`src/routes/auth.js`)

Supabase Auth with email + password. `/auth/confirm` handles all email links: `token_hash` + `type` (works from any device; the recommended links in `emails/*.html`, which are pasted into Supabase's email templates), a PKCE `code` (works only in the browser that started the flow; on failure, sign-up is reported as confirmed and the user is asked to log in), and Supabase `error` params. Links that land on `/` with these params are forwarded to `/auth/confirm`.

### Views

Every page includes `views/partials/head.ejs` and `views/partials/foot.ejs`. Page-specific scripts are passed to the foot include (`include('partials/foot', { scripts: [...] })`), not the head. Styling is a single token-based stylesheet (`public/css/style.css`: plum/beige palette, Anton + Figtree fonts). Client behaviour (GSAP animations, hero video playlist, favourites, chat polling, filters) is in `public/js/main.js`.

## Deployment

The site runs at https://constria.ro on Hostinger Node.js hosting (Express app, entry `server.js`, Node 22). Hostinger auto-deploys every push to `main` of GitHub `Shuriken34/constria`, so a push to `main` is a production release. `NODE_ENV`, `SITE_URL` and `SESSION_SECRET` are set as Hostinger environment variables. The owner works directly on `main` and wants changes committed there.

Supabase dashboard settings that the code depends on: Site URL / Redirect URLs (`https://constria.ro/auth/confirm`), the custom email templates from `emails/`, and SMTP through Hostinger (`smtp.hostinger.com:465`).

`outreach/` holds local prospecting lists with third-party contact data and is gitignored on purpose.
