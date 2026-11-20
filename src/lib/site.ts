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
  heroClips: [
    // Foișor în construcție, lucrare Constria (de pe TikTok, convertit în H.264 cu ffmpeg)
    "/video/foisor.mp4",
    // Casă cu acoperiș din țiglă metalică maro, jgheaburi maro și streașină din lemn
    // (Pexels 5644254, primele 6 secunde, tăiat cu ffmpeg)
    "/video/acoperis.mp4",
  ],
  heroPoster: "/video/foisor-poster.jpg",
  roofBand: "/lucrari/acoperis-tigla-maro-vedere-sus.jpg",
  gazeboBand: "/lucrari/foisor-romanesc-terminat.jpg",
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
    image: "/lucrari/acoperis-tigla-maro-casa.jpg",
    alt: "Casă cu acoperișul schimbat de Constria, cu țiglă metalică maro și opritori de zăpadă",
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
    image: "/lucrari/foisor-romanesc-montaj-acoperis.jpg",
    alt: "Foișor din lemn în construcție, cu acoperiș din țiglă metalică maro, lucrare Constria",
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
    image: "/lucrari/acoperis-sipci-folie.jpg",
    alt: "Șipci din lemn montate peste folia anticondens, înainte de învelitoare",
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

// Lucrări realizate de Constria, grupate pe proiecte. Primul proiect apare primul.
export type Photo = { src: string; w: number; h: number; alt: string };
export type Project = { id: string; title: string; text: string; photos: Photo[] };

export const projects: Project[] = [
  {
    id: "schimbare-acoperis-tigla-maro",
    title: "Schimbare acoperiș cu țiglă metalică maro",
    text: "Am înlocuit acoperișul unei case și al copertinei de la intrare: șipci noi peste folie anticondens, țiglă metalică maro, opritori de zăpadă, jgheaburi și streașină cu lambriu.",
    photos: [
      { src: "/lucrari/acoperis-tigla-maro-casa.jpg", w: 1440, h: 1080, alt: "Casa cu acoperișul nou din țiglă metalică maro, văzută din curte" },
      { src: "/lucrari/acoperis-montaj-tigla-maro.jpg", w: 1080, h: 1440, alt: "Montajul țiglei metalice maro pe acoperișul copertinei" },
      { src: "/lucrari/acoperis-tigla-maro-opritori-zapada.jpg", w: 1440, h: 1080, alt: "Țiglă metalică maro cu opritori de zăpadă, de aproape" },
      { src: "/lucrari/acoperis-tigla-maro-vedere-sus.jpg", w: 1440, h: 1080, alt: "Acoperișul nou văzut de sus, cu satul în fundal" },
      { src: "/lucrari/acoperis-tigla-maro-streasina.jpg", w: 1080, h: 1440, alt: "Acoperișul casei și copertina de la intrare, cu jgheaburi noi" },
      { src: "/lucrari/acoperis-montaj-copertina.jpg", w: 1080, h: 1174, alt: "Echipa montează acoperișul copertinei de la intrare" },
      { src: "/lucrari/acoperis-jgheab-lambriu.jpg", w: 1080, h: 1440, alt: "Jgheab nou și streașină din lambriu, văzute de dedesubt" },
      { src: "/lucrari/acoperis-sipci-folie.jpg", w: 1080, h: 1440, alt: "Șipci din lemn peste folia anticondens, înainte de țiglă" },
    ],
  },
  {
    id: "foisoare-romanesti",
    title: "Foișoare din lemn cu acoperiș din țiglă metalică",
    text: "Foișoare construite pe fundație de beton, din lemn masiv, cu balustradă și acoperiș din țiglă metalică maro.",
    photos: [
      { src: "/lucrari/foisor-romanesc-terminat.jpg", w: 1079, h: 1160, alt: "Foișor din lemn cu acoperiș din țiglă metalică maro, lângă o casă albă" },
      { src: "/lucrari/foisor-romanesc-montaj-acoperis.jpg", w: 756, h: 700, alt: "Montajul acoperișului din țiglă metalică maro pe un foișor din lemn" },
    ],
  },
  {
    id: "foisoare-pergole",
    title: "Foișoare și pergole din lemn masiv",
    text: "Structuri mari din lemn, de la fundația de beton la acoperiș.",
    photos: [
      { src: "/lucrari/foisor-tavan-lemn.jpg", w: 971, h: 2048, alt: "Tavanul din lemn al unui foișor, văzut de dedesubt" },
      { src: "/lucrari/pavilion-lemn-casa.jpg", w: 1200, h: 568, alt: "Foișor din lemn lipit de casă, peste terasă" },
      { src: "/lucrari/pavilion-lemn-structura.jpg", w: 960, h: 720, alt: "Structura unui foișor mare din lemn, în timpul montajului" },
      { src: "/lucrari/pavilion-lemn-constructie.jpg", w: 960, h: 540, alt: "Echipa montează căpriorii unui foișor din lemn" },
      { src: "/lucrari/pergola-lemn.jpg", w: 949, h: 949, alt: "Pergolă din lemn masiv în fața unei case" },
      { src: "/lucrari/fundatie-beton-foisor.jpg", w: 960, h: 720, alt: "Fundația din beton turnată pentru un foișor" },
    ],
  },
];

export const allPhotos = projects.flatMap((p) => p.photos);

// Previzualizarea de pe prima pagină
export const galleryPreview: Photo[] = [
  projects[0].photos[0],
  projects[1].photos[0],
  projects[0].photos[1],
  projects[1].photos[1],
];

export const mainServices = services.filter((s) => s.main);
export const otherServices = services.filter((s) => !s.main);

export const steps = [
  { title: "Vizită și măsurători", text: "Venim la tine, vedem locul și măsurăm. Îți spunem pe loc ce variante ai." },
  { title: "Ofertă scrisă", text: "Primești o ofertă clară, cu materialele, manopera și termenul de execuție." },
  { title: "Execuție", text: "Lucrăm după termenul stabilit și lăsăm locul curat la final de zi." },
  { title: "Predare și garanție", text: "Verificăm lucrarea împreună cu tine și primești garanție scrisă." },
];
