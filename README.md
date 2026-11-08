# Constria

Piața online pentru cumpărarea, vânzarea și închirierea de materiale, utilaje și scule de construcții în România (model tip OLX).
Cumpărătorii contactează direct vânzătorul (telefon, WhatsApp sau mesaje în platformă), iar fiecare vânzător se ocupă de transport.

**Tehnologii:** Node.js + Express + EJS, cu **Supabase** pentru baza de date (Postgres), conturi (Supabase Auth) și fotografii (Supabase Storage).

## Pornire

Necesită **Node.js 22.13+**.

1. Copiază `.env.example` în `.env` și completează valorile din Supabase (Project Settings → API Keys):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   Cheia *publishable* este publică prin design – securitatea vine din regulile RLS din baza de date. **Nu pune niciodată cheia secretă (`sb_secret_...`) în proiect.**

2. Instalează și pornește:

   ```bash
   npm install
   npm start
   ```

3. Deschide http://localhost:3000.

## Conturi și reguli de acces

- Oricine poate **naviga, căuta și vedea anunțuri** fără cont.
- **Toate formularele cer cont**: publicare anunț, mesaje, favorite, recenzii, raportări și formularul de contact.
- Conturile sunt gestionate de **Supabase Auth** (înregistrare cu email + parolă, confirmare email, resetare parolă).
- Regulile **RLS** din Postgres garantează că fiecare utilizator își poate modifica doar propriile anunțuri, vede doar propriile mesaje și favorite, iar telefonul unui vânzător se afișează doar pentru anunțurile active.

### Setări necesare în panoul Supabase

1. **Authentication → URL Configuration**
   - *Site URL*: adresa site-ului (local: `http://localhost:3000`, în producție: `https://domeniul-tau.ro`)
   - *Redirect URLs*: adaugă `http://localhost:3000/auth/confirm` și `https://domeniul-tau.ro/auth/confirm`
2. **Authentication → Emails / SMTP**: serviciul de email inclus în Supabase trimite doar câteva emailuri pe oră. Înainte de lansare configurează un SMTP propriu (ex. Resend, Brevo, Amazon SES), altfel înregistrările și resetările de parolă se vor bloca.

### Cont de administrator

Creează-ți un cont normal pe site, apoi rulează în **Supabase → SQL Editor** (înlocuiește emailul):

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
where email = 'emailul-tau@exemplu.ro';
```

Ieși din cont și intră din nou: în meniul contului apare **Administrare** (moderare anunțuri, utilizatori, raportări și mesaje de contact).

## Funcționalități

- **Trei secțiuni**: Materiale de construcții (`/materiale`), Utilaje și echipamente (`/utilaje`) și Scule și unelte (`/scule`).
- **Vânzare sau închiriere** pentru utilaje și scule, cu preț pe oră / zi / săptămână / lună, plus marcă, model, an fabricație și (la utilaje) ore de funcționare.
- **Video în spatele titlului principal**: clipuri gratuite de pe Pexels (lista în `heroVideos` din `src/data.js`), cu buton de pauză; nu pornesc automat dacă vizitatorul a ales „mișcare redusă”.
- Anunțuri: căutare (fără diacritice), filtre, sortare, paginare.
- Pagina anunțului: galerie, detalii, telefon la cerere, WhatsApp, mesaje, favorite, raportare, anunțuri similare.
- Conturi persoană fizică / firmă (CUI), profil public cu recenzii.
- Până la 8 fotografii pe anunț, salvate în Supabase Storage (fiecare utilizator are folderul lui).
- Mesagerie între cumpărător și vânzător, cu actualizare automată și număr de mesaje necitite.
- Calculator de materiale, blog / ghiduri, Întrebări frecvente, Contact, Termeni, Confidențialitate.
- Ștergerea contului elimină și anunțurile, mesajele și fotografiile utilizatorului.

## Structură

```
server.js              pornire Express, middleware
src/supabase.js        client Supabase per cerere (@supabase/ssr, sesiune în cookie)
src/middleware.js      utilizator curent, CSRF, protecție rute
src/models.js          interogări Supabase
src/upload.js          încărcare imagini în Supabase Storage
src/routes/            rute publice, autentificare, cont, administrare
src/data.js            categorii, județe, unități, imagini
views/                 șabloane EJS (în limba română)
public/                CSS, JavaScript, imagini
```

Schema bazei de date (tabele, reguli RLS, funcții și bucket-ul de fotografii) este creată prin migrațiile din proiectul Supabase.

## Înainte de lansare

- Setează `NODE_ENV=production`, `SESSION_SECRET` și `SITE_URL` (ex. `https://constria.ro`).
- Configurează SMTP propriu și URL-urile de redirecționare în Supabase (vezi mai sus).
- Revizuiește Termenii și Politica de confidențialitate cu un jurist.
- Rulează în spatele HTTPS.
