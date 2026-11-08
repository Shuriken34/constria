// Conținut editorial reutilizabil
const faq = [
  {
    q: 'Cât costă să public un anunț pe Constria?',
    a: 'Nimic. Publicarea anunțurilor este gratuită, atât pentru persoane fizice, cât și pentru firme. Nu luăm comision din vânzare – banii ajung direct la tine.',
  },
  {
    q: 'Cum iau legătura cu vânzătorul?',
    a: 'Din pagina anunțului poți vedea numărul de telefon, îi poți scrie pe WhatsApp sau îi poți trimite un mesaj direct prin Constria. Toate conversațiile le găsești în contul tău, la secțiunea Mesaje.',
  },
  {
    q: 'Cine se ocupă de transport?',
    a: 'Fiecare vânzător își stabilește singur modul de predare: ridicare personală, livrare cu mijloacele proprii sau ambele variante. Costul și detaliile transportului le stabilești direct cu vânzătorul.',
  },
  {
    q: 'Pot închiria utilaje sau scule?',
    a: 'Da. În secțiunea Utilaje găsești excavatoare, nacele, basculante, betoniere, generatoare și schele, iar în secțiunea Scule ciocane demolatoare, flexuri, fierăstraie sau nivele laser – toate de închiriat pe oră, zi, săptămână sau lună. Condițiile (operator, garanție, transport) le stabilești direct cu proprietarul.',
  },
  {
    q: 'Cum plătesc materialele?',
    a: 'Plata se face direct între cumpărător și vânzător, de obicei la predare (numerar sau transfer bancar). Îți recomandăm să nu plătești niciodată în avans fără să fi văzut marfa sau documentele firmei.',
  },
  {
    q: 'Ce înseamnă „surplus șantier”?',
    a: 'Sunt materiale noi, rămase după finalizarea unei lucrări – paleți de BCA începuți, saci de adeziv, plăci de gresie din același lot. De obicei se vând mult sub prețul din magazin.',
  },
  {
    q: 'Pot vinde ca firmă?',
    a: 'Da. La înregistrare alege tipul de cont „Firmă” și completează denumirea și CUI-ul. Anunțurile tale vor afișa numele firmei, iar cumpărătorii pot filtra după tipul vânzătorului.',
  },
  {
    q: 'Cum raportez un anunț suspect?',
    a: 'Folosește butonul „Raportează anunțul” din pagina acestuia. Echipa noastră verifică fiecare raportare și elimină anunțurile care încalcă regulile.',
  },
];

const testimonials = [
  { name: 'Andrei M.', role: 'Constructor, Cluj-Napoca', text: 'Am vândut în trei zile 4 paleți de BCA rămași de la o vilă. Înainte îi țineam în curte o iarnă întreagă.' },
  { name: 'Ioana P.', role: 'Renovează un apartament, București', text: 'Am găsit gresie din același lot cu cea pe care o aveam deja, la jumătate de preț. Vânzătorul a adus-o chiar el.' },
  { name: 'Mihai D.', role: 'Depozit materiale, Iași', text: 'Pentru noi e un canal de vânzare în plus, fără comisioane. Clienții sună direct, ca pe vremuri.' },
];

const safetyTips = [
  'Verifică marfa înainte de plată – mergi la ridicare sau cere poze și clipuri recente.',
  'Nu trimite avansuri prin servicii de transfer de bani către persoane necunoscute.',
  'Cere factură sau aviz de însoțire atunci când cumperi de la o firmă.',
  'Comunică prin mesageria Constria ca să ai un istoric al înțelegerii.',
  'Nu oferi niciodată date de card, coduri primite prin SMS sau parole.',
  'Dacă prețul pare prea bun ca să fie adevărat, probabil că nu este. Raportează anunțul.',
];

module.exports = { faq, testimonials, safetyTips };
