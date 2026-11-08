// Date demonstrative: utilizatori, anunțuri, recenzii, conversații, articole
// Rulare manuală: npm run seed  (șterge și recreează datele)
const bcrypt = require('bcryptjs');
const { db, run, get, tx } = require('./db');
const { U } = require('./data');
const { slugify } = require('./helpers');
const { buildSearchText } = require('./models');

// Conturi de test (vezi și README.md)
const ADMIN_EMAIL = 'admin@constria.ro';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Constria2026!';
const DEMO_PASSWORD = 'demo12345';

const img = {
  'caramida-bca': ['photo-1495578942200-c5f5d2137def', 'photo-1585750629386-33bdc1431574', 'photo-1520758594221-872948699332', 'photo-1547056961-3c25e9140b05', 'photo-1565626424178-c699f6601afd'],
  'ciment-betoane': ['photo-1560780552-ba54683cb263', 'photo-1774931363306-5a896cd4dd02', 'photo-1579492450119-80542d516179', 'photo-1521459467264-802e2ef3141f'],
  'lemn-cherestea': ['photo-1567080586917-e6ab6aa0df85', 'photo-1644931551533-02906718127f', 'photo-1784397375428-7a2c2e781d84', 'photo-1531824475211-72594993ce2a'],
  'fier-metal': ['photo-1745909247906-123b53b70e06', 'photo-1763771420303-0f11ccf613d1', 'photo-1767823644482-d62a6e13dedb'],
  acoperisuri: ['photo-1605450099279-533bd3ce379a', 'photo-1518736346281-76873166a64a', 'photo-1763665814538-8ba04597286c', 'photo-1673645652590-9d21295bf4ac'],
  izolatii: ['photo-1768321917437-1f1f6ae2ad28', 'photo-1543525324-dc2c9006d03d', 'photo-1783587354630-3300699c053c'],
  'gresie-faianta': ['photo-1580398562556-d33329a0f29b', 'photo-1600328604921-300918f36018', 'photo-1523350165414-082d792c4bcc', 'photo-1771843471340-7387d7d903ce'],
  'gips-carton': ['photo-1768321914149-5a6428ec2f82', 'photo-1770838773417-08b18661c62f', 'photo-1733431772808-82d878e59000'],
  'vopsele-finisaje': ['photo-1525909002-1b05e0c869d8', 'photo-1773525912493-cdb088d19d64', 'photo-1535673774336-ef95d2851cf3', 'photo-1784887830054-ea5fbe193e7c'],
  instalatii: ['photo-1607472586893-edb57bdc0e39', 'photo-1538474705339-e87de81450e8', 'photo-1542274368-443d694d79aa'],
  'usi-ferestre': ['photo-1527352774566-e4916e36c645', 'photo-1625577815636-d7a61b583799'],
  agregate: ['photo-1604178449672-3e7d72d5a09a', 'photo-1774522309091-77bbdfb10425', 'photo-1604176857921-ddddcbbee64e', 'photo-1632199670702-3ea3f70909cb'],
  'scule-electrice': ['photo-1734888369502-3e01d4c0a46e', 'photo-1518709414768-a88981a4515d', 'photo-1598302936625-6075fbd98dd7', 'photo-1522322512347-a0e57fd1744c', 'photo-1645651964715-d200ce0939cc'],
  'scule-acumulator': ['photo-1572981779307-38b8cabb2407', 'photo-1504148455328-c376907d081c', 'photo-1622044939413-0b829c342434', 'photo-1590635023142-73c3d34f2805'],
  'scule-manuale': ['photo-1581783898377-1c85bf937427', 'photo-1426927308491-6380b6a9936f', 'photo-1607870411590-d5e9e06da09a', 'photo-1761544775659-aaa6fa2e5b3d'],
  'masura-trasare': ['photo-1550985543-49bee3167284', 'photo-1703756291638-b1774ae3c186', 'photo-1670511146782-8f52c5a7bd08'],
  'echipamente-protectie': ['photo-1662309376159-b95fb193d96b', 'photo-1768158988512-ad31657fe5b8', 'photo-1552879890-3a06dd3a06c2', 'photo-1673294861057-4584f92b91d2'],
  'accesorii-consumabile': ['photo-1760376208640-2ece4c4a0adc', 'photo-1585201731775-0597e1be4bfb', 'photo-1702200047649-ddefe9d4faa9'],
  'scari-depozitare': ['photo-1635082627989-dcd12a107364', 'photo-1781737873599-2cdef978d65d', 'photo-1558906050-d6d6aa390fd3'],
  excavatoare: ['photo-1580901369227-308f6f40bdeb', 'photo-1628645419184-26a1f2757340', 'photo-1629807473015-41699c4471b5', 'photo-1768085091650-e8e89ef57b76', 'photo-1503708928676-1cb796a0891e', 'photo-1575642975010-983c53b3eeb9'],
  miniutilaje: ['photo-1759950345011-ee5a96640e00', 'photo-1763516763181-4372f2987360', 'photo-1759950344779-86b5aeb1349e', 'photo-1763515187944-821eaca2426b'],
  'macarale-nacele': ['photo-1765435149256-56f3ea3db68f', 'photo-1772889417579-5188aa6ff1bf', 'photo-1770827730773-cc7848b2ee61', 'photo-1569169513673-2cecbfc943a9'],
  'camioane-basculante': ['photo-1778068846016-b0ae7a27abbe', 'photo-1760568787655-247d67618f37', 'photo-1671022412547-75c4cb01f47e'],
  'echipamente-beton': ['photo-1527410651988-c2f385ccd3f7', 'photo-1695414628474-d21608bbe0c7', 'photo-1773432114391-f85c1674b233'],
  compactare: ['photo-1782442002533-1aec0cf5a9d8', 'photo-1595734939818-f4e0d44957df', 'photo-1660508597900-f19ae2dc6b65'],
  'generatoare-compresoare': ['photo-1780445392484-38a4852a1fd8', 'photo-1700318092011-6e4666e94ab5'],
  'schele-cofraje': ['photo-1765706845871-951abd038627', 'photo-1508450859948-4e04fabaa4ea', 'photo-1758035318694-a36ba3106b76'],
  electrice: ['photo-1607400201889-565b1ee75f8e', 'photo-1759200165738-6366977a73c6'],
};

const users = [
  { email: 'contact@depozitfloresti.ro', name: 'Radu Pop', phone: '0744 112 233', county: 'Cluj', city: 'Florești', account_type: 'firma', company_name: 'Depozit Florești Mat SRL', cui: 'RO31245678', verified: 1, about: 'Depozit de materiale de construcții în Florești. Program L–V 8–18, S 8–14. Livrăm cu camion cu macara în tot județul Cluj.' },
  { email: 'vanzari@lemnulcarpatin.ro', name: 'Ioan Moldovan', phone: '0755 210 987', county: 'Suceava', city: 'Vatra Dornei', account_type: 'firma', company_name: 'Lemnul Carpatin', cui: 'RO22987411', verified: 1, about: 'Gater propriu. Cherestea de rășinoase uscată natural, grinzi, scânduri, șipci. Debitare la comandă.' },
  { email: 'office@bauconstruct.ro', name: 'Mihai Dumitrescu', phone: '0722 456 780', county: 'București', city: 'Sector 3', account_type: 'firma', company_name: 'Bau Construct Grup', cui: 'RO40112233', verified: 1, about: 'Firmă de construcții. Vindem surplusul rămas de pe șantierele noastre din București și Ilfov.' },
  { email: 'andrei.m@exemplu.ro', name: 'Andrei Marin', phone: '0733 998 877', county: 'Iași', city: 'Iași', account_type: 'persoana' },
  { email: 'ioana.p@exemplu.ro', name: 'Ioana Popescu', phone: '0766 123 456', county: 'Timiș', city: 'Timișoara', account_type: 'persoana' },
  { email: 'gabriel.s@exemplu.ro', name: 'Gabriel Stan', phone: '0745 667 788', county: 'Brașov', city: 'Codlea', account_type: 'persoana' },
  { email: 'office@ceramicavest.ro', name: 'Elena Bogdan', phone: '0727 333 444', county: 'Bihor', city: 'Oradea', account_type: 'firma', company_name: 'Ceramica Vest Distribuție', cui: 'RO35556677', verified: 0, about: 'Distribuitor gresie și faianță. Stocuri de lichidare la prețuri foarte bune.' },
  { email: 'cristi.v@exemplu.ro', name: 'Cristian Vasile', phone: '0751 909 808', county: 'Constanța', city: 'Ovidiu', account_type: 'persoana' },
  { email: 'contact@agregatemures.ro', name: 'Zoltan Kiss', phone: '0740 505 606', county: 'Mureș', city: 'Târgu Mureș', account_type: 'firma', company_name: 'Agregate Mureș', cui: 'RO28889900', verified: 1, about: 'Balastieră proprie. Nisip, pietriș, piatră spartă, balast. Transport cu basculantă 8–20 tone.' },
  { email: 'dana.r@exemplu.ro', name: 'Dana Radu', phone: '0768 202 303', county: 'Prahova', city: 'Ploiești', account_type: 'persoana' },
];

// [userIndex, categorie, titlu, preț, tip preț, unitate, cantitate, stare, livrare, notă livrare, descriere, recomandat, zile în urmă]
const listings = [
  [0, 'caramida-bca', 'BCA Ytong 25 cm – 3 paleți compleți', 14.5, 'fix', 'buc', 120, 'nou', 'ambele', 'Livrare cu macara în județul Cluj, 200 lei / transport.', 'Blocuri BCA Ytong 625×250×250 mm, 3 paleți compleți (40 buc/palet), neîncepuți, folie originală. Depozitate sub șopron.\n\nSe pot vinde și la bucată. Factură la cerere.', 1, 0],
  [2, 'caramida-bca', 'Surplus cărămidă Porotherm 30 N+F – 1,5 paleți', 7, 'negociabil', 'buc', 110, 'surplus', 'ridicare', 'Ridicare din Sector 3, ajutăm la încărcare cu motostivuitorul.', 'Au rămas după finalizarea unei case: un palet complet de Porotherm 30 N+F și jumătate de palet. Blocurile sunt noi, neudate.\n\nPreț bun la cine ia tot.', 1, 1],
  [3, 'caramida-bca', 'Cărămidă plină veche recuperată, ~2000 buc', 1.2, 'negociabil', 'buc', 2000, 'folosit', 'ridicare', null, 'Cărămidă plină din demolare casă veche, curățată parțial de mortar. Ideală pentru garduri, grătare, pereți decorativi.\nSe vinde toată cantitatea sau minimum 500 buc.', 0, 3],
  [0, 'ciment-betoane', 'Ciment Holcim 42,5R – sac 40 kg', 34, 'fix', 'sac', 300, 'nou', 'livrare', 'Livrare gratuită peste 50 de saci în raza de 20 km de Florești.', 'Ciment Portland compozit CEM II/A-S 42,5R, sac 40 kg. Fabricație recentă, depozitat în hală închisă.\nReduceri pentru cantități mari.', 1, 0],
  [2, 'ciment-betoane', 'Adeziv BCA – 18 saci rămași', 25, 'fix', 'sac', 18, 'surplus', 'ridicare', null, 'Adeziv pentru zidărie BCA, sac 25 kg, termen de valabilitate până anul viitor. Saci închiși, păstrați la uscat.', 0, 2],
  [5, 'ciment-betoane', 'Tencuială mecanizată Baumit MPI 25 – 40 saci', 22, 'negociabil', 'sac', 40, 'surplus', 'ridicare', 'Codlea, curte proprie.', 'Am comandat mai mult decât a fost nevoie. 40 de saci de tencuială var-ciment Baumit MPI 25, sigilați.', 0, 5],
  [1, 'lemn-cherestea', 'Grinzi molid 15×15 cm, uscate natural', 1350, 'fix', 'mc', 25, 'nou', 'ambele', 'Livrăm cu TIR în toată țara, preț în funcție de distanță.', 'Grinzi de molid 15×15 cm, lungimi 4, 5 și 6 m. Uscare naturală minimum 6 luni. Tratare anticarii la cerere (+80 lei/mc).\n\nDebităm și la dimensiuni speciale.', 1, 0],
  [1, 'lemn-cherestea', 'Scândură rășinoase 2,4 cm, tivită', 1100, 'fix', 'mc', 40, 'nou', 'ambele', null, 'Scândură tivită molid/brad, grosime 24 mm, lățimi 10–20 cm, lungime 4 m. Pentru cofraje, astereală, dușumea.', 0, 2],
  [7, 'lemn-cherestea', 'OSB 3 de 12 mm – 22 plăci', 75, 'negociabil', 'buc', 22, 'surplus', 'ridicare', null, 'Plăci OSB 3 Kronospan 2500×1250×12 mm, rămase de la acoperiș. Nefolosite, depozitate pe paleți în garaj.', 0, 4],
  [2, 'fier-metal', 'Fier beton PC52 Ø12 – aprox. 1,2 tone', 3.9, 'fix', 'kg', 1200, 'surplus', 'ridicare', 'Se încarcă cu macaraua de pe șantier, Sector 3.', 'Bare fier beton PC52 diametru 12 mm, lungime 12 m. Surplus de la structură, ușor oxidat la suprafață (normal). Se vinde la kilogram, minimum 200 kg.', 1, 1],
  [0, 'fier-metal', 'Plasă sudată Ø6, ochi 15×15 cm', 89, 'fix', 'buc', 150, 'nou', 'livrare', null, 'Plasă sudată STNB, Ø6 mm, ochiuri 150×150 mm, panou 2×5 m. Pentru plăci, șape armate, radiere.', 0, 6],
  [8, 'agregate', 'Nisip spălat 0–4 mm, cu transport', 85, 'fix', 'tona', 500, 'nou', 'livrare', 'Transport cu basculanta 8 t sau 20 t. Preț transport în funcție de distanță.', 'Nisip de râu spălat, sortul 0–4 mm, pentru betoane, tencuieli și șape. Livrare rapidă în Târgu Mureș și împrejurimi, de obicei în aceeași zi.', 1, 0],
  [8, 'agregate', 'Pietriș sortat 16–31 mm', 75, 'fix', 'tona', 800, 'nou', 'livrare', null, 'Pietriș rulat sortat 16–31 mm pentru betoane, drenaje și alei. Comenzi de la 8 tone.', 0, 1],
  [8, 'agregate', 'Balast natural pentru umpluturi', 45, 'fix', 'tona', 2000, 'nou', 'livrare', null, 'Balast natural 0–63 mm pentru umpluturi, drumuri de acces, platforme. Preț foarte bun la cantități mari.', 0, 7],
  [6, 'gresie-faianta', 'Gresie porțelanată 60×60 gri mat – 48 mp lichidare stoc', 39, 'fix', 'mp', 48, 'nou', 'ambele', 'Livrare în Oradea gratuită, în restul țării prin curier paletizat.', 'Gresie porțelanată rectificată 60×60 cm, culoare gri antracit, finisaj mat, clasa I. Același lot, 48 mp (cutii de 1,44 mp).\nPreț de lichidare – în magazin costă 89 lei/mp.', 1, 0],
  [4, 'gresie-faianta', 'Faianță albă 25×40 – 12 mp rămași', 15, 'negociabil', 'mp', 12, 'surplus', 'ridicare', null, 'Faianță albă lucioasă 25×40 cm, rămasă după renovarea băii. 8 cutii sigilate + câteva plăci. Ideal pentru cine are nevoie de același model.', 0, 2],
  [6, 'gresie-faianta', 'Parchet laminat stejar natural 8 mm – 35 mp', 32, 'fix', 'mp', 35, 'nou', 'ambele', null, 'Parchet laminat 8 mm, clasa de trafic AC4, decor stejar natural. Cutii sigilate. Se vinde tot sau la cutie (2,22 mp).', 0, 3],
  [9, 'gresie-faianta', 'Plăci de pavaj 20×10 roșu, ~60 mp', 0, 'gratuit', 'mp', 60, 'folosit', 'ridicare', 'Trebuie ridicate de dumneavoastră din curte, Ploiești.', 'Dăm gratuit pavaj vechi scos din curte, aproximativ 60 mp. Unele plăci sunt ciobite, majoritatea în stare bună. Cine vine primul, ia tot.', 0, 1],
  [0, 'acoperisuri', 'Țiglă metalică Bilka 0,5 mm maro – stoc', 39, 'fix', 'mp', 400, 'nou', 'livrare', null, 'Țiglă metalică Bilka, grosime 0,5 mm, culoare maro mat RAL 8017. Debitare la lungimea dorită. Accesorii disponibile.', 0, 4],
  [5, 'acoperisuri', 'Țiglă ceramică Tondach recuperată, ~900 buc', 2.5, 'negociabil', 'buc', 900, 'folosit', 'ridicare', null, 'Țiglă ceramică solzi, demontată cu grijă de pe acoperiș. Stare foarte bună, fără fisuri. Potrivită pentru anexe sau restaurări.', 0, 8],
  [2, 'acoperisuri', 'Membrană anticondens – 4 role', 160, 'fix', 'buc', 4, 'surplus', 'ridicare', null, 'Membrană anticondens difuzie 140 g/mp, rolă 75 mp. 4 role sigilate rămase de la un bloc.', 0, 3],
  [0, 'izolatii', 'Polistiren expandat EPS 80, 10 cm', 175, 'fix', 'mc', 60, 'nou', 'livrare', 'Livrare gratuită de la 10 mc în județul Cluj.', 'Polistiren expandat EPS 80 pentru fațade, grosime 10 cm, plăci 1000×500 mm. Baxuri de 0,3 mc.', 1, 1],
  [3, 'izolatii', 'Vată minerală bazaltică 10 cm – 9 baxuri', 95, 'negociabil', 'buc', 9, 'surplus', 'ridicare', null, 'Vată bazaltică 10 cm pentru mansardă, 9 baxuri nedesfăcute. Rămase după izolarea podului.', 0, 6],
  [7, 'izolatii', 'Membrană bituminoasă hidroizolație – 6 role', 120, 'fix', 'buc', 6, 'nou', 'ridicare', null, 'Membrană bituminoasă cu ardezie, 4 kg/mp, rolă 10 mp. Pentru terase și fundații.', 0, 9],
  [2, 'gips-carton', 'Plăci gips-carton Rigips 12,5 mm – 70 buc', 27, 'fix', 'buc', 70, 'surplus', 'ridicare', null, 'Plăci gips-carton standard 2600×1200×12,5 mm. Surplus de la compartimentări. Câteva plăci au colțurile ușor lovite – le dăm la jumătate.', 0, 2],
  [0, 'gips-carton', 'Profile CW/UW 50 pentru pereți', 11, 'fix', 'buc', 400, 'nou', 'ambele', null, 'Profile metalice CW 50 și UW 50, 3 m și 4 m. Stoc permanent, prețuri pentru firme.', 0, 5],
  [4, 'vopsele-finisaje', 'Vopsea lavabilă albă Savana 15 L – 4 găleți', 140, 'negociabil', 'buc', 4, 'surplus', 'ridicare', null, 'Vopsea lavabilă interior Savana Superalb, găleți de 15 L sigilate. Am cumpărat prea multă.', 0, 1],
  [9, 'vopsele-finisaje', 'Glet de finisaj Ceresit CT 127 – 12 saci', 38, 'fix', 'sac', 12, 'surplus', 'ridicare', null, 'Glet de finisaj pe bază de ipsos, sac 20 kg. Saci închiși, valabilitate încă 8 luni.', 0, 4],
  [6, 'instalatii', 'Țeavă PPR Ø20 – 50 bare de 4 m', 9, 'fix', 'buc', 50, 'nou', 'ambele', null, 'Țeavă PPR PN20 Ø20 mm pentru apă caldă și rece, bare de 4 m. Fitinguri disponibile la cerere.', 0, 3],
  [3, 'instalatii', 'Centrală termică în condensare 24 kW – nouă, în cutie', 2900, 'negociabil', 'buc', 1, 'nou', 'ridicare', null, 'Centrală termică în condensare 24 kW, nouă, sigilată, cu factură și garanție. Am trecut pe pompă de căldură și nu mai am nevoie de ea.', 1, 2],
  [5, 'usi-ferestre', 'Ferestre PVC termopan, 5 bucăți, 120×140', 650, 'negociabil', 'buc', 5, 'folosit', 'ridicare', null, 'Ferestre PVC albe cu geam termoizolant, demontate la schimbarea cu tripan. Stare bună, feronerie funcțională. Dimensiune 120×140 cm.', 0, 6],
  [2, 'usi-ferestre', 'Uși interior MDF albe, 80 cm – 6 buc', 390, 'fix', 'buc', 6, 'surplus', 'ridicare', null, 'Uși de interior din MDF, albe, cu toc reglabil și clanță. Noi, rămase de la un proiect de apartamente.', 0, 5],
  [7, 'echipamente-beton', 'Betonieră 160 L, 650 W', 750, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Betonieră 160 litri, motor 650 W, folosită la construcția casei. Funcționează perfect, coroana în stare bună.', 0, 2],
  [0, 'schele-cofraje', 'Schelă de fațadă – set 100 mp, închiriere sau vânzare', 9500, 'negociabil', 'set', 1, 'folosit', 'livrare', null, 'Set schelă metalică de fațadă tip ramă, aproximativ 100 mp, cu podine, balustrade și ancore. Stare foarte bună.', 0, 7],
  [3, 'scule-electrice', 'Rotopercutor SDS-Plus 800 W + set burghie', 320, 'fix', 'buc', 1, 'folosit', 'ridicare', null, 'Rotopercutor SDS-Plus 800 W, folosit câteva luni. Vine cu valiză și set de 7 burghie.', 0, 1],
  [9, 'electrice', 'Cablu CYY-F 3×2,5 – colac 100 m', 420, 'fix', 'buc', 3, 'nou', 'ridicare', null, 'Cablu CYY-F 3×2,5 mm², colac de 100 m, sigilat. Am 3 colaci.', 0, 3],
  [6, 'electrice', 'Doze și aparataj – lot lichidare', 250, 'negociabil', 'set', 1, 'nou', 'ambele', null, 'Lot: 120 doze aparat, 40 prize, 30 întrerupătoare albe, rame. Toate noi, în ambalaj.', 0, 8],
  [4, 'caramida-bca', 'BCA 10 cm pentru compartimentări – 80 buc', 8, 'fix', 'buc', 80, 'surplus', 'ridicare', null, 'BCA 600×250×100 mm, rămas de la compartimentarea mansardei. Se poate ridica oricând după ora 17.', 0, 2],
  [1, 'lemn-cherestea', 'Lambriu molid clasa A, 12,5 mm', 32, 'fix', 'mp', 300, 'nou', 'ambele', null, 'Lambriu din molid, clasa A, uscat în uscător, profil nut-feder. Pentru tavane și pereți interiori.', 0, 4],
  // Utilaje și echipamente: ultimul element = { tip, marcă, model, an, ore }
  [2, 'excavatoare', 'Închiriez buldoexcavator JCB 3CX cu operator', 1200, 'negociabil', 'zi', null, 'folosit', 'livrare', 'Transport cu trailer în București și Ilfov: 400 lei dus-întors.', 'Buldoexcavator JCB 3CX Sitemaster, cupă frontală și cupă spate 60 cm, ciocan hidraulic la cerere.\nPrețul include operator autorizat ISCIR și motorină pentru 8 ore de lucru.\nDisponibil pentru săpături fundații, șanțuri, nivelări, demolări.', 1, 0, { tip: 'inchiriere', brand: 'JCB', model: '3CX Sitemaster', year: 2018, hours: 6400 }],
  [8, 'excavatoare', 'Excavator pe șenile Caterpillar 320 – de vânzare', 285000, 'negociabil', 'buc', 1, 'folosit', 'ridicare', 'Se poate vedea în funcțiune la sediul nostru din Târgu Mureș.', 'Excavator pe șenile Caterpillar 320, 22 tone, cupă de 1,2 mc și cupă de taluz. Întreținut în service autorizat, istoric complet.\nȘenile 70%, motor fără scăpări, aer condiționat. Factură cu TVA.', 1, 2, { tip: 'vanzare', brand: 'Caterpillar', model: '320', year: 2016, hours: 9800 }],
  [0, 'miniutilaje', 'Miniexcavator Kubota 1,9 t de închiriat', 450, 'fix', 'zi', null, 'folosit', 'ambele', 'Livrare cu platforma în Cluj și împrejurimi, 250 lei.', 'Miniexcavator Kubota de 1,9 tone, ideal pentru curți, șanțuri de utilități, piscine și locuri înguste. Trei cupe (30, 40 și 100 cm).\nFără operator: necesită experiență. Cu operator: +300 lei/zi.', 1, 1, { tip: 'inchiriere', brand: 'Kubota', model: 'KX019-4', year: 2021, hours: 2100 }],
  [5, 'miniutilaje', 'Miniîncărcător Bobcat S450 cu accesorii', 98000, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Miniîncărcător Bobcat S450, cu cupă, furci pentru paleți și perie. Funcționează impecabil, revizie făcută acum 2 luni.', 0, 5, { tip: 'vanzare', brand: 'Bobcat', model: 'S450', year: 2017, hours: 3900 }],
  [2, 'macarale-nacele', 'Nacelă articulată 16 m – închiriere', 520, 'fix', 'zi', null, 'folosit', 'livrare', 'Livrăm cu trailer, transport separat în funcție de distanță.', 'Nacelă articulată diesel, înălțime de lucru 16 m, sarcină coș 230 kg, tracțiune 4×4 pentru teren accidentat.\nInstruire la predare. Reducere pentru închirieri de peste 7 zile.', 1, 1, { tip: 'inchiriere', brand: 'Genie', model: 'Z-45/25J', year: 2019, hours: 3100 }],
  [6, 'macarale-nacele', 'Stivuitor diesel 3 tone, catarg triplex', 650, 'negociabil', 'saptamana', null, 'folosit', 'ridicare', null, 'Stivuitor diesel 3 t, catarg triplex 4,7 m, deplasator lateral. Închiriere pe săptămână sau lună pentru depozite și șantiere.', 0, 3, { tip: 'inchiriere', brand: 'Toyota', model: '8FD30', year: 2015, hours: 11200 }],
  [8, 'camioane-basculante', 'Basculantă 8×4 MAN 32 t cu șofer – transport agregate', 180, 'fix', 'ora', null, 'folosit', 'livrare', null, 'Basculantă MAN TGS 8×4, bena 20 mc. Transport agregate, pământ și moloz în județul Mureș. Tarif pe oră cu șofer și motorină incluse, minimum 4 ore.', 0, 0, { tip: 'inchiriere', brand: 'MAN', model: 'TGS 41.400', year: 2014, hours: null }],
  [3, 'camioane-basculante', 'Autobasculantă 3,5 t Iveco Daily – de vânzare', 92000, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Iveco Daily 35C15 basculabil trilateral, categoria B. ITP valabil, anvelope noi. Ideal pentru firme mici de construcții.', 0, 4, { tip: 'vanzare', brand: 'Iveco', model: 'Daily 35C15', year: 2016, hours: null }],
  [0, 'echipamente-beton', 'Pompă de beton 36 m – închiriere cu operator', 2500, 'negociabil', 'zi', null, 'folosit', 'livrare', 'Ne deplasăm în tot județul Cluj.', 'Autopompă de beton cu braț de 36 m, debit 160 mc/h. Prețul include operatorul. Programări cu minimum 48 de ore înainte.', 0, 2, { tip: 'inchiriere', brand: 'Putzmeister', model: 'M36-4', year: 2017, hours: 5200 }],
  [5, 'compactare', 'Placă vibrantă reversibilă 300 kg', 150, 'fix', 'zi', null, 'folosit', 'ridicare', null, 'Placă compactoare reversibilă, 300 kg, motor diesel. Pentru pavaje, fundații și umpluturi. Garanție 500 lei la ridicare.', 0, 1, { tip: 'inchiriere', brand: 'Wacker Neuson', model: 'DPU 6555', year: 2020, hours: 900 }],
  [8, 'compactare', 'Cilindru compactor 10 t – de vânzare', 168000, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Cilindru compactor monobandaj vibrator de 10 tone, pentru drumuri și platforme. Stare tehnică foarte bună.', 0, 6, { tip: 'vanzare', brand: 'Bomag', model: 'BW 211 D-4', year: 2012, hours: 7600 }],
  [9, 'generatoare-compresoare', 'Generator diesel 20 kVA insonorizat', 220, 'fix', 'zi', null, 'folosit', 'ambele', null, 'Generator trifazat 20 kVA, carcasă insonorizată, tablou cu prize 230/400 V. Închiriere pentru șantiere fără curent.', 0, 2, { tip: 'inchiriere', brand: 'Atlas Copco', model: 'QAS 20', year: 2019, hours: 4300 }],
  [3, 'generatoare-compresoare', 'Compresor de aer mobil 5 mc/min + ciocan pneumatic', 21000, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Compresor mobil pe roți, 5 mc/min, motor Kubota. Vine cu un ciocan pneumatic și 20 m de furtun.', 0, 7, { tip: 'vanzare', brand: 'Kaeser', model: 'M50', year: 2013, hours: 5600 }],
  // Scule și unelte
  [0, 'scule-electrice', 'Ciocan demolator 16 kg – închiriere', 120, 'fix', 'zi', null, 'folosit', 'ridicare', 'Garanție 500 lei la ridicare, se returnează la predare.', 'Ciocan demolator electric 1600 W, 16 kg, cu daltă plată și daltă ascuțită. Ideal pentru spart beton, gresie veche și pereți.\nReducere la închirieri de peste 3 zile.', 1, 0, { tip: 'inchiriere', brand: 'Bosch', model: 'GSH 16-28', year: 2022 }],
  [6, 'scule-electrice', 'Polizor unghiular 230 mm, 2400 W – nou', 489, 'fix', 'buc', 6, 'nou', 'ambele', null, 'Flex profesional 230 mm, 2400 W, pornire lentă și protecție la repornire. Nou, în cutie, garanție 3 ani.', 1, 1, { tip: 'vanzare', brand: 'Makita', model: 'GA9020', year: 2026 }],
  [9, 'scule-electrice', 'Fierăstrău circular de masă – închiriere', 90, 'fix', 'zi', null, 'folosit', 'ridicare', null, 'Fierăstrău circular de masă 250 mm, pentru tăiat OSB, cherestea și parchet. Vine cu pânză nouă.', 0, 3, { tip: 'inchiriere', brand: 'Metabo', model: 'TS 254', year: 2021 }],
  [3, 'scule-acumulator', 'Set autofiletantă + rotopercutor 18V, 2 acumulatori', 1150, 'negociabil', 'set', 1, 'folosit', 'ridicare', null, 'Set DeWalt 18V XR: autofiletantă cu percuție și rotopercutor SDS-Plus, 2 acumulatori de 5 Ah, încărcător și valiză TSTAK. Folosit 6 luni, stare excelentă.', 1, 1, { tip: 'vanzare', brand: 'DeWalt', model: 'DCK268P2', year: 2025 }],
  [5, 'scule-acumulator', 'Mașină de înșurubat gips-carton cu acumulator', 640, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Șurubelniță pentru gips-carton cu încărcător de șuruburi bandă, 18V, un acumulator. Perfectă pentru rigipsari.', 0, 4, { tip: 'vanzare', brand: 'Makita', model: 'DFS452', year: 2023 }],
  [7, 'scule-manuale', 'Set scule zidar: mistrii, drișcă, nivelă, ciocan', 160, 'fix', 'set', 2, 'nou', 'ambele', null, 'Set complet pentru zidărie și tencuieli: 3 mistrii, drișcă inox, fier de glet, nivelă 100 cm, ciocan de zidar și găleată. Nou.', 0, 2, { tip: 'vanzare', brand: 'Stanley', model: '' }],
  [0, 'masura-trasare', 'Nivelă laser cu linii verzi 360° + trepied', 75, 'fix', 'zi', null, 'folosit', 'ridicare', null, 'Nivelă laser cu 3 linii verzi la 360°, autonivelare, cu trepied telescopic și receptor. Închiriere pe zi sau pe săptămână (350 lei).', 1, 1, { tip: 'inchiriere', brand: 'Bosch', model: 'GLL 3-80 G', year: 2023 }],
  [4, 'masura-trasare', 'Telemetru laser 50 m – nou, sigilat', 290, 'fix', 'buc', 1, 'nou', 'ridicare', null, 'Telemetru laser 50 m, calcul suprafețe și volume, sigilat. Cadou primit dublu.', 0, 5, { tip: 'vanzare', brand: 'Leica', model: 'Disto D1', year: 2026 }],
  [6, 'echipamente-protectie', 'Lot echipament protecție: 20 căști + 20 veste', 650, 'fix', 'set', 1, 'nou', 'livrare', 'Livrare prin curier în toată țara.', 'Lot pentru echipe: 20 de căști de protecție cu certificare EN 397 și 20 de veste reflectorizante. Noi, culori portocaliu și galben.', 0, 2, { tip: 'vanzare', brand: '', model: '' }],
  [9, 'accesorii-consumabile', 'Discuri diamantate 230 mm pentru beton – 10 buc', 45, 'fix', 'buc', 10, 'surplus', 'ridicare', null, 'Discuri diamantate segmentate 230 mm pentru beton și cărămidă. Rămase de la o lucrare, noi.', 0, 3, { tip: 'vanzare', brand: 'Bosch', model: 'Standard for Universal' }],
  [5, 'scari-depozitare', 'Scară aluminiu 3×12 trepte, profesională', 980, 'negociabil', 'buc', 1, 'folosit', 'ridicare', null, 'Scară multifuncțională din aluminiu, 3 tronsoane a câte 12 trepte, înălțime maximă de lucru 8,6 m. Stare bună.', 0, 6, { tip: 'vanzare', brand: 'Krause', model: 'Corda' }],
  [2, 'schele-cofraje', 'Cofraje metalice pentru pereți – închiriere 200 mp', 9, 'fix', 'zi', 200, 'folosit', 'livrare', null, 'Sistem de cofraje metalice cu panouri de 2,7 m, cleme și popi. Prețul este pe mp pe zi, minimum 2 săptămâni.', 0, 3, { tip: 'inchiriere', brand: 'Peri', model: 'Trio', year: 2018, hours: null }],
];

const posts = [
  {
    slug: 'cum-calculezi-necesarul-de-bca', tag: 'Ghid', image: U('photo-1495578942200-c5f5d2137def', 1600),
    title: 'Cum calculezi necesarul de BCA pentru o casă',
    excerpt: 'Formula simplă pe care o folosesc constructorii, plus greșelile care te costă un palet în plus.',
    body: '<h2>Pasul 1: suprafața pereților</h2><p>Înmulțește lungimea totală a pereților cu înălțimea, apoi scade golurile pentru uși și ferestre. Un geam de 1,2 × 1,4 m înseamnă 1,68 mp în minus.</p><h2>Pasul 2: blocuri pe metru pătrat</h2><p>Un bloc standard are 60 × 25 cm, deci intră <strong>6,67 blocuri pe mp</strong>, indiferent de grosime. Grosimea contează doar pentru numărul de blocuri pe palet.</p><h2>Pasul 3: rezerva</h2><p>Adaugă 5% pentru tăieturi și blocuri sparte la transport. Dacă ai multe colțuri și goluri, mergi pe 8%.</p><h3>Sfat</h3><p>Verifică pe Constria surplusul de la alte șantiere – paleții începuți se vând adesea cu 30–40% sub prețul din depozit. Sau folosește direct <a href="/calculator">calculatorul nostru</a>.</p>',
  },
  {
    slug: 'cum-vinzi-rapid-surplusul-de-pe-santier', tag: 'Vânzători', image: U('photo-1541888946425-d81bb19240f5', 1600),
    title: 'Cum vinzi rapid surplusul de pe șantier',
    excerpt: 'Cinci lucruri care fac diferența între un anunț vândut în trei zile și unul uitat o lună.',
    body: '<h2>1. Poze la lumina zilei</h2><p>Fotografiază paletul întreg, apoi un detaliu cu eticheta. Cumpărătorii vor să vadă marca și starea ambalajului.</p><h2>2. Titlu cu tot ce contează</h2><p>„BCA 25 cm Ytong – 2 paleți” spune mai mult decât „Vând BCA”. Include materialul, dimensiunea și cantitatea.</p><h2>3. Preț pe unitate corectă</h2><p>Afișează prețul pe bucată, mp sau sac – exact cum caută oamenii. Poți menționa în descriere un preț pentru tot lotul.</p><h2>4. Spune clar cum se predă</h2><p>Ai motostivuitor? Livrezi? Cumpărătorii aleg adesea anunțul care le rezolvă transportul.</p><h2>5. Răspunde repede</h2><p>Primul care răspunde vinde. Activează notificările și verifică secțiunea Mesaje.</p>',
  },
  {
    slug: 'gresie-din-acelasi-lot', tag: 'Renovare', image: U('photo-1580398562556-d33329a0f29b', 1600),
    title: 'De ce contează lotul la gresie și faianță',
    excerpt: 'Aceeași referință din catalog poate avea nuanțe diferite. Cum eviți surprizele la renovare.',
    body: '<p>Plăcile ceramice sunt arse în loturi, iar fiecare lot poate avea o nuanță ușor diferită. Pe cutie găsești codul de lot și calibrul.</p><h2>Ce faci dacă îți lipsesc câțiva metri</h2><ul><li>Caută pe Constria după numele exact al modelului – mulți vând exact cutiile rămase.</li><li>Cere vânzătorului o poză cu eticheta cutiei, ca să compari lotul.</li><li>Dacă nu găsești același lot, pune plăcile noi într-o zonă separată (sub mobilier, în debara).</li></ul>',
  },
];

// demo = false (implicit): doar contul de administrator și ghidurile – site gol, gata de lansare
// demo = true: plus utilizatori și anunțuri fictive, DOAR pentru testare locală
function seed({ reset = false, demo = false } = {}) {
  if (reset) {
    db.exec('DELETE FROM messages; DELETE FROM conversations; DELETE FROM reviews; DELETE FROM favorites; DELETE FROM reports; DELETE FROM listing_images; DELETE FROM listings; DELETE FROM posts; DELETE FROM contact_messages; DELETE FROM users;');
  }
  if (get('SELECT COUNT(*) AS n FROM users').n > 0) {
    console.log('Baza de date conține deja utilizatori – populare omisă. Folosește „npm run seed” pentru resetare.');
    return;
  }
  const demoHash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  tx(() => {
    run(`INSERT INTO users (email, password_hash, name, phone, county, city, role, verified, created_at)
         VALUES (?,?,?,?,?,?,'admin',1, datetime('now','-200 days'))`,
    ADMIN_EMAIL, bcrypt.hashSync(ADMIN_PASSWORD, 10), 'Administrator Constria', '0700 000 000', 'București', 'București');

    posts.forEach((p, i) => run("INSERT INTO posts (slug, title, excerpt, body, image, tag, created_at) VALUES (?,?,?,?,?,?, datetime('now', ?))",
      p.slug, p.title, p.excerpt, p.body, p.image, p.tag, `-${(i + 1) * 6} days`));

    if (!demo) return;

    const ids = users.map((u, i) => Number(run(
      `INSERT INTO users (email, password_hash, name, phone, county, city, account_type, company_name, cui, about, verified, created_at, last_seen)
       VALUES (?,?,?,?,?,?,?,?,?,?,?, datetime('now', ?), datetime('now', ?))`,
      u.email, demoHash, u.name, u.phone, u.county, u.city, u.account_type, u.company_name || null, u.cui || null,
      u.about || null, u.verified || 0, `-${30 + i * 17} days`, `-${i * 3} hours`,
    ).lastInsertRowid));

    const counters = {};
    const listingIds = listings.map(([ui, cat, title, price, ptype, unit, qty, cond, deliv, note, desc, feat, days, mach]) => {
      const u = users[ui];
      const mx = mach || {};
      const row = { title, description: desc, category: cat, city: u.city, county: u.county, brand: mx.brand, model: mx.model, listing_type: mx.tip };
      const id = Number(run(
        `INSERT INTO listings (user_id, category, title, slug, description, price, price_type, unit, quantity, condition, county, city,
          delivery, delivery_note, featured, views, listing_type, brand, model, year, hours, search_text, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now', ?), datetime('now', ?))`,
        ids[ui], cat, title, slugify(title), desc, price, ptype, unit, qty, cond, u.county, u.city, deliv, note, feat,
        20 + ((title.length * 37) % 400), mx.tip || 'vanzare', mx.brand || null, mx.model || null, mx.year || null, mx.hours ?? null,
        buildSearchText(row), `-${days} days`, `-${days} days`,
      ).lastInsertRowid);
      const pool = img[cat];
      const start = (counters[cat] = (counters[cat] || 0) + 1) - 1;
      const n = Math.min(pool.length, 3);
      for (let k = 0; k < n; k++) run('INSERT INTO listing_images (listing_id, path, position) VALUES (?,?,?)', id, U(pool[(start + k) % pool.length]), k);
      return id;
    });

    // Recenzii și conversații
    const reviews = [
      [0, 3, 5, 'Livrare la timp, marfa exact ca în poze. Recomand!'], [0, 4, 5, 'Foarte serioși, m-au ajutat și cu calculul cantității.'],
      [0, 7, 4, 'Prețuri bune, livrarea a durat o zi în plus.'], [1, 5, 5, 'Cherestea de calitate, bine uscată.'],
      [1, 3, 5, 'Au debitat exact cum am cerut.'], [2, 4, 4, 'Surplus în stare foarte bună, încărcare rapidă.'],
      [8, 9, 5, 'Nisip curat, basculanta a venit în aceeași zi.'], [8, 5, 5, 'Cei mai buni din zonă.'], [6, 9, 4, 'Gresia arată superb, preț excelent.'],
    ];
    for (const [s, a, r, b] of reviews) {
      const sid = ids[s], aid = ids[a];
      const lid = get('SELECT id FROM listings WHERE user_id = ? LIMIT 1', sid).id;
      run('INSERT OR IGNORE INTO conversations (listing_id, buyer_id, seller_id, created_at, updated_at) VALUES (?,?,?, datetime(\'now\',\'-10 days\'), datetime(\'now\',\'-10 days\'))', lid, aid, sid);
      run('INSERT INTO reviews (seller_id, author_id, rating, body, created_at) VALUES (?,?,?,?, datetime(\'now\', ?))', sid, aid, r, b, `-${r * 3} days`);
      const cv = get('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?', lid, aid).id;
      run("INSERT INTO messages (conversation_id, sender_id, body, read_at, created_at) VALUES (?,?,?, datetime('now','-10 days'), datetime('now','-10 days'))", cv, aid, 'Bună ziua! Mai este disponibil?');
      run("INSERT INTO messages (conversation_id, sender_id, body, read_at, created_at) VALUES (?,?,?, datetime('now','-10 days'), datetime('now','-10 days'))", cv, sid, 'Da, este. Când doriți să treceți?');
    }

    // Conversație demonstrativă cu mesaje
    const lid = listingIds[0];
    run("INSERT OR IGNORE INTO conversations (listing_id, buyer_id, seller_id, created_at, updated_at) VALUES (?,?,?, datetime('now','-2 hours'), datetime('now','-20 minutes'))", lid, ids[5], ids[0]);
    const c = get('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?', lid, ids[5]).id;
    const msgs = [
      [ids[5], 'Bună ziua! Mai sunt disponibili cei 3 paleți de BCA?', '-2 hours'],
      [ids[0], 'Bună ziua! Da, sunt disponibili. Îi luați pe toți?', '-100 minutes'],
      [ids[5], 'Da, toți trei. Cât ar costa transportul până în Gilău?', '-90 minutes'],
      [ids[0], 'Pentru Gilău transportul e 150 lei, cu descărcare cu macaraua. Putem livra joi dimineață.', '-20 minutes'],
    ];
    msgs.forEach(([s, b, t]) => run("INSERT INTO messages (conversation_id, sender_id, body, created_at) VALUES (?,?,?, datetime('now', ?))", c, s, b, t));

    // Favorite
    [[3, 0], [3, 6], [4, 14], [5, 11], [9, 29]].forEach(([u, l]) => run('INSERT OR IGNORE INTO favorites (user_id, listing_id) VALUES (?,?)', ids[u], listingIds[l]));
  });
  if (demo) console.log(`Date demonstrative create: ${users.length + 1} utilizatori, ${listings.length} anunțuri (DOAR pentru testare).`);
  else console.log('Bază de date goală: doar contul de administrator și ghidurile.');
  console.log(`Admin: ${ADMIN_EMAIL} (parola în README.md sau variabila ADMIN_PASSWORD)`);
}

module.exports = { seed };

if (require.main === module) seed({ reset: true, demo: process.argv.includes('--demo') });
