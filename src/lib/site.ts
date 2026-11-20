// Datele de contact și conținutul site-ului Constria.
// TODO: înlocuiește emailul și zona cu datele reale ale firmei.

export const site = {
  name: "Constria",
  phone: "0740 293 991",
  phoneHref: "tel:+40740293991",
  whatsappHref: "https://wa.me/40740293991",
  email: "contact@constria.ro",
  area: "Județul tău și împrejurimi",
  hours: "Luni – Sâmbătă, 8:00 – 18:00",
};

// Fotografii de prezentare de pe Pexels (licență gratuită).
// TODO: înlocuiește-le cu poze din lucrările voastre.
const px = (path: string) => `https://images.pexels.com/photos/${path}`;

export const media = {
  // Clipurile din prima secțiune rulează pe rând, în ordinea de aici.
  // TODO: înlocuiește-le cu clipuri cu lucrările voastre (tablă maro pe case românești, foișor în construcție):
  // pune fișierele .mp4 în /public/video/ și scrie aici "/video/nume.mp4".
  heroClips: ["https://videos.pexels.com/video-files/13361432/13361432-hd_1280_720_60fps.mp4"],
  heroPoster: px("37704251/pexels-photo-37704251/free-photo-of-professional-roofer-working-safely-on-a-building-roof.jpeg?auto=compress&cs=tinysrgb&w=1600"),
  roofBand: px("32050401/pexels-photo-32050401/free-photo-of-silhouetted-workers-on-rooftop-against-blue-sky.jpeg"),
  gazeboBand: px("6903862/pexels-photo-6903862.jpeg"),
};

export type Service = {
  id: string;
  title: string;
  short: string;
  /** true = lucrare principală (apare mare, în față); false = la „Alte servicii” */
  main: boolean;
  summary: string;
  details: string[];
  image: string;
  alt: string;
};

// Ordinea contează: primele sunt lucrările principale, în ordinea importanței.
export const services: Service[] = [
  {
    id: "schimbare-acoperis",
    title: "Schimbare acoperiș",
    short: "Schimbare acoperiș",
    main: true,
    summary:
      "Acoperișul vechi, care plouă sau e ruginit, îl înlocuim cu unul nou. Demontăm tot, verificăm șarpanta, schimbăm lemnul putred și montăm învelitoarea nouă, cu jgheaburi și burlane.",
    details: [
      "Demontare și evacuare moloz",
      "Verificarea și repararea șarpantei",
      "Tablă fălțuită, țiglă metalică sau ceramică",
      "Folie anticondens și izolație",
      "Jgheaburi, burlane și opritori de zăpadă",
      "Lucrăm pe etape, nu rămâi descoperit",
    ],
    image: px("31763534/pexels-photo-31763534/free-photo-of-rustic-roof-renovation-with-chimney-and-ladder.jpeg"),
    alt: "Acoperiș vechi în renovare, cu horn și scară",
  },
  {
    id: "foisoare",
    title: "Foișoare",
    short: "Foișoare",
    main: true,
    summary:
      "Construim foișoare din lemn masiv, pe măsura curții tale: cu acoperiș asortat casei, pardoseală, balustradă și loc pentru masă sau grătar.",
    details: [
      "Structură din lemn masiv tratat",
      "Acoperiș din țiglă metalică sau șindrilă",
      "Pardoseală și balustradă",
      "Dimensiuni și formă la cerere",
      "Opțional: loc pentru grătar sau bucătărie de vară",
    ],
    image: px("11114385/pexels-photo-11114385.jpeg"),
    alt: "Foișor din lemn cu masă rustică într-o grădină verde",
  },
  {
    id: "garduri",
    title: "Garduri",
    short: "Garduri",
    main: true,
    summary:
      "Schimbăm gardul vechi și montăm unul nou, de orice tip, cu porți și portițe potrivite.",
    details: [
      "Șipcă metalică și tablă cutată",
      "Panouri bordurate și plasă",
      "Lemn, fier forjat sau beton",
      "Porți batante, culisante și portițe",
    ],
    image: px("33903903/pexels-photo-33903903/free-photo-of-modern-industrial-fence-against-brick-wall.jpeg"),
    alt: "Gard metalic negru în fața unui zid de cărămidă",
  },
  {
    id: "acoperis-nou",
    title: "Acoperișuri noi",
    short: "Acoperișuri noi",
    main: false,
    summary: "Pentru case noi: de la șarpanta din lemn până la coamă.",
    details: ["Șarpantă din lemn tratat", "Tablă fălțuită sau țiglă metalică", "Jgheaburi și burlane"],
    image: px("33404080/pexels-photo-33404080/free-photo-of-roof-installation-on-brick-house-in-fort-worth.jpeg"),
    alt: "Echipă care montează un acoperiș nou pe o casă din cărămidă",
  },
  {
    id: "vopsire-acoperis",
    title: "Vopsire acoperiș",
    short: "Vopsire",
    main: false,
    summary: "Tabla ruginită, curățată, grunduită și vopsită în culori RAL.",
    details: ["Curățare de rugină", "Grund anticoroziv", "Vopsea pentru tablă"],
    image: px("10875363/pexels-photo-10875363.jpeg"),
    alt: "Acoperiș din tablă ondulată ruginită, înainte de vopsire",
  },
  {
    id: "terase",
    title: "Terase",
    short: "Terase",
    main: false,
    summary: "Terase și pergole din lemn sau WPC, cu sau fără acoperiș.",
    details: ["Pardoseală din lemn sau WPC", "Pergole și copertine", "Balustrade și trepte"],
    image: px("8180361/pexels-photo-8180361.jpeg"),
    alt: "Terasă din lemn cu scaune și masă, cu vedere spre pădure",
  },
];

export const mainServices = services.filter((s) => s.main);
export const otherServices = services.filter((s) => !s.main);

export const steps = [
  { title: "Vizită și măsurători", text: "Venim la tine, vedem locul și măsurăm. Îți spunem pe loc ce variante ai." },
  { title: "Ofertă scrisă", text: "Primești o ofertă clară, cu materialele, manopera și termenul de execuție." },
  { title: "Execuție", text: "Lucrăm după termenul stabilit și lăsăm locul curat la final de zi." },
  { title: "Predare și garanție", text: "Verificăm lucrarea împreună cu tine și primești garanție scrisă." },
];
