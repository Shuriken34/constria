# Constria

Piața online pentru cumpărarea și vânzarea materialelor de construcții în România (model tip OLX).
Cumpărătorii contactează direct vânzătorul (telefon, WhatsApp sau mesaje în platformă), iar fiecare vânzător se ocupă de transport.

## Pornire

Necesită **Node.js 22.13+** (folosește baza de date SQLite inclusă în Node, fără instalări suplimentare).

```bash
npm install
npm start
```

Deschide http://localhost:3000. La prima pornire baza de date se populează automat cu date demonstrative.

Pentru a reseta datele demonstrative:

```bash
npm run seed
```

## Conturi de test (doar pentru dezvoltare)

| Rol | Email | Parolă |
|---|---|---|
| Administrator | admin@constria.ro | `Constria2026!` (sau valoarea din `ADMIN_PASSWORD`) |
| Vânzător firmă | contact@depozitfloresti.ro | `demo12345` |
| Persoană fizică | gabriel.s@exemplu.ro | `demo12345` |

Toate conturile demonstrative din `src/seed.js` folosesc parola `demo12345`. **Schimbă parola de administrator înainte de lansare.**

## Funcționalități

- **Trei secțiuni**: Materiale de construcții (`/materiale`), Utilaje și echipamente (`/utilaje` – excavatoare, miniutilaje, macarale și nacele, basculante, echipamente pentru beton, compactoare, generatoare, schele) și Scule și unelte (`/scule` – scule electrice, cu acumulator, manuale, măsură și trasare, echipamente de protecție, accesorii, scări).
- **Vânzare sau închiriere** pentru utilaje și scule, cu preț pe oră / zi / săptămână / lună, plus marcă, model, an fabricație și (la utilaje) ore de funcționare.
- **Video în spatele titlului principal**: clipuri gratuite de pe Pexels cu utilaje, scule și materiale (lista în `heroVideos` din `src/data.js`), rulate pe rând cu tranziție, cu buton de pauză; nu pornesc automat dacă vizitatorul a ales „mișcare redusă”. Pentru producție, găzduiește clipurile proprii (ex. în `public/video/`) și actualizează lista.

- Pagină principală în stilul de referință: titluri uriașe, scenă hero în straturi cu paralaxă, text care se colorează la derulare, imagini duotone, beneficii numerotate, bandă derulantă.
- Anunțuri: căutare (fără diacritice), filtre (categorie, județ, localitate, preț, stare, tip vânzător, livrare, gratuit), sortare, paginare.
- Pagina anunțului: galerie, detalii, afișare telefon la cerere, WhatsApp, mesaje, favorite, raportare, anunțuri similare.
- Conturi persoană fizică / firmă (CUI), profil public cu recenzii.
- Adăugare / editare anunț cu până la 8 fotografii (validare tip real al fișierului), ciornă salvată automat, marcare ca vândut, dezactivare, ștergere.
- Mesagerie între cumpărător și vânzător, cu actualizare automată și număr de mesaje necitite.
- Calculator de materiale (BCA, cărămidă, beton, tencuială, gresie, vopsea, izolație) cu legătură spre anunțuri din județ.
- Blog / ghiduri, Întrebări frecvente, Cum funcționează, Siguranță, Despre noi, Contact, Termeni, Confidențialitate.
- Panou de administrare: raportări, mesaje de contact, blocare/promovare anunțuri, suspendare/verificare utilizatori.
- Securitate: parole bcrypt, protecție CSRF, limitarea încercărilor de autentificare, cookie de sesiune httpOnly.

## Structură

```
server.js            pornire Express, middleware
src/data.js          categorii, județe, unități, imagini
src/db.js            schema SQLite
src/models.js        interogări
src/routes/          rute publice, autentificare, cont, administrare
src/seed.js          date demonstrative
views/               șabloane EJS (în limba română)
public/css/style.css sistemul vizual (culori, tipografie, componente)
public/js/           interacțiuni, animații GSAP, calculator
```

## Personalizare rapidă

- **Culori și fonturi**: variabilele din începutul fișierului `public/css/style.css`.
- **Logo**: `views/partials/logo.ejs` și `public/img/favicon.svg`.
- **Categorii**: `src/data.js`.
- **Imagini**: momentan imagini stoc de pe Unsplash. Înlocuiește-le cu fotografii proprii în `src/data.js`.

## Înainte de lansare

- Setează `NODE_ENV=production`, `SESSION_SECRET` și `ADMIN_PASSWORD`.
- Configurează un serviciu de email pentru resetarea parolei (acum pagina doar confirmă cererea).
- Revizuiește Termenii și Politica de confidențialitate cu un jurist.
- Rulează în spatele HTTPS (ex. Nginx, Render, Railway, un VPS).
