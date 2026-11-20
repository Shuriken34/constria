# CLAUDE.md

@AGENTS.md

## Project

Constria is the presentation site of a Romanian contractor: new roofs, roof replacement and painting, fences of any type, gazebos (foișoare) and terraces. One page (`src/app/page.tsx`) plus a 404 page. All copy is Romanian with correct diacritics (ă â î ș ț); keep new copy in Romanian.

Stack: Next.js 16 App Router with `output: "export"` (static site in `out/`), Tailwind CSS v4, GSAP + ScrollTrigger (`@gsap/react`), lucide-react icons, Supabase for quote requests.

## Commands

```bash
npm run dev     # http://localhost:3000
npm run build   # static export to out/
npm start       # node server.js — serves out/ like production
npm run lint
```

The project folder is inside OneDrive: if `next build` fails with EPERM on `.next`, stop the dev server and delete `.next`, then rebuild.

## Deployment

https://constria.ro runs on Hostinger Node.js hosting, which auto-deploys every push to `main` of GitHub `Shuriken34/constria`: **a push to `main` is a production release**. Entry file `server.js` (no dependencies) serves `out/`; `out/` is committed on purpose, so always run `npm run build` before committing so `out/` matches the source. The owner works directly on `main`.

The previous site (an Express + EJS construction-materials marketplace) is kept on branch `marketplace-vechi`; its data is still in the same Supabase project.

## Content and design

- Editable business data (phone, email, hours, area), services, photos and process steps live in `src/lib/site.ts`.
- Brand (from the old constria.ro): plum `#4a002a`/`#2e001a`, red `#f00037`/`#c8002e`, beige `#f6e1ce`, cream `#fff3e4`; Anton (uppercase display, `.display`) + Figtree. Tokens are in `src/app/globals.css` `@theme`.
- Photos and the hero video are Pexels placeholders, loaded through the custom image loader `src/lib/image-loader.ts` (Pexels resizes them). Replace with real project photos in `public/` when available.
- All animation lives in `src/components/Motion.tsx`, driven by classes/attributes in the markup (`hero-rise`, `hero-fade`, `reveal`, `data-parallax`, `data-hero-line`, `.fill-text .w`, `data-progress-line`). Elements start hidden only under `html.js` (set by an inline script in `layout.tsx`); `prefers-reduced-motion` shows everything statically and pauses the hero video.

## Quote form and Supabase

- `src/lib/quote.ts` validates and inserts directly from the browser into `public.quote_requests` with the publishable key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, committed in `.env.production`, local overrides in `.env.local`). Never add a secret / service_role key.
- Access control is RLS in Supabase project `uqligfwvdktyeeetqyio`: anon/authenticated may only INSERT the columns name, phone, locality, service, message; only admins (`public.is_admin()`) can SELECT/UPDATE (status). Schema: `supabase/migrations/`. Allowed `service` values are a CHECK constraint — keep them in sync with `services` ids in `site.ts` and `SERVICES` in `quote.ts`.
- Clicking any element with `data-service="<id>"` preselects that service in the form.
