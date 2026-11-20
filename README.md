# Constria

Site-ul firmei Constria: **acoperișuri noi, schimbare și vopsire de acoperișuri, garduri de orice tip, foișoare și terase**.
Rulează pe https://constria.ro.

**Tehnologii:** Next.js (export static) + Tailwind CSS + GSAP pentru animații. Cererile de ofertă se salvează în **Supabase**, în tabelul `quote_requests`.

## Pornire locală

Necesită **Node.js 20.12+** (recomandat 22).

```bash
npm install
npm run dev      # versiunea de lucru, cu reîncărcare automată: http://localhost:3000
```

Pentru a vedea exact ce rulează pe server:

```bash
npm run build    # generează site-ul static în out/
npm start        # server.js servește out/ pe http://localhost:3000
```

## Unde modifici

| Ce | Unde |
| --- | --- |
| Telefon, email, program, zonă | `src/lib/site.ts` → `site` |
| Servicii, texte, poze | `src/lib/site.ts` → `services`, `media` |
| Pașii „Cum lucrăm” | `src/lib/site.ts` → `steps` |
| Secțiunile paginii | `src/components/sections.tsx` |
| Formularul de ofertă | `src/components/QuoteForm.tsx`, `src/lib/quote.ts` |
| Animații | `src/components/Motion.tsx` |
| Culori, fonturi | `src/app/globals.css` |

## Publicare

Fiecare push pe ramura `main` din GitHub se publică automat pe constria.ro (Hostinger).
Înainte de commit rulează **`npm run build`**, ca folderul `out/` să conțină ultima versiune.

## Cererile de ofertă

Supabase Dashboard → proiectul constria.ro → **Table Editor** → **`quote_requests`**.
Vizitatorii pot doar trimite cereri; le citesc și le actualizează doar administratorii.
Structura tabelului: `supabase/migrations/`.

## Site-ul vechi (marketplace)

Codul marketplace-ului de materiale este păstrat pe ramura **`marketplace-vechi`**.
Datele lui (anunțuri, conturi) au rămas neatinse în Supabase.
