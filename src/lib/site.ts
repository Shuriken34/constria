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
  heroVideo: "https://videos.pexels.com/video-files/13361432/13361432-hd_1280_720_60fps.mp4",
  heroPoster: px("37704251/pexels-photo-37704251/free-photo-of-professional-roofer-working-safely-on-a-building-roof.jpeg?auto=compress&cs=tinysrgb&w=1600"),
  band: px("32050401/pexels-photo-32050401/free-photo-of-silhouetted-workers-on-rooftop-against-blue-sky.jpeg"),
};

export type Service = {
  id: string;
  title: string;
  short: string;
  summary: string;
  details: string[];
  image: string;
  alt: string;
};

export const services: Service[] = [
  {
    id: "acoperis-nou",
    title: "Acoperișuri noi",
    short: "Acoperișuri",
    summary: "De la șarpanta din lemn până la coamă, jgheaburi și burlane.",
    details: ["Șarpantă din lemn tratat", "Tablă fălțuită sau țiglă metalică", "Folie anticondens și izolație", "Jgheaburi și opritori de zăpadă"],
    image: px("33404080/pexels-photo-33404080/free-photo-of-roof-installation-on-brick-house-in-fort-worth.jpeg"),
    alt: "Echipă care montează un acoperiș nou pe o casă din cărămidă",
  },
  {
    id: "schimbare-acoperis",
    title: "Schimbare acoperiș",
    short: "Schimbare",
    summary: "Demontăm acoperișul vechi, reparăm șarpanta și montăm învelitoarea nouă.",
    details: ["Demontare și evacuare moloz", "Verificarea și repararea șarpantei", "Învelitoare nouă la alegere", "Lucrăm pe etape, nu rămâi descoperit"],
    image: px("31763534/pexels-photo-31763534/free-photo-of-rustic-roof-renovation-with-chimney-and-ladder.jpeg"),
    alt: "Acoperiș vechi în renovare, cu horn și scară",
  },
  {
    id: "vopsire-acoperis",
    title: "Vopsire acoperiș",
    short: "Vopsire",
    summary: "Tabla ruginită devine ca nouă: curățare, grund anticoroziv și vopsea RAL.",
    details: ["Spălare și curățare de rugină", "Grund anticoroziv", "Vopsea pentru tablă, culori RAL", "Vopsim și jgheaburile"],
    image: px("10875363/pexels-photo-10875363.jpeg"),
    alt: "Acoperiș din tablă ondulată ruginită, înainte de vopsire",
  },
  {
    id: "garduri",
    title: "Garduri de orice tip",
    short: "Garduri",
    summary: "Schimbăm gardul vechi și montăm unul nou, cu porți și portițe.",
    details: ["Șipcă metalică și tablă cutată", "Panouri bordurate și plasă", "Lemn, fier forjat sau beton", "Porți batante și culisante"],
    image: px("33903903/pexels-photo-33903903/free-photo-of-modern-industrial-fence-against-brick-wall.jpeg"),
    alt: "Gard metalic negru în fața unui zid de cărămidă",
  },
  {
    id: "foisoare",
    title: "Foișoare",
    short: "Foișoare",
    summary: "Foișoare din lemn masiv, pe măsura curții tale.",
    details: ["Structură din lemn masiv", "Acoperiș din țiglă metalică sau șindrilă", "Pardoseală și balustradă", "Dimensiuni la cerere"],
    image: px("11114385/pexels-photo-11114385.jpeg"),
    alt: "Foișor din lemn cu masă rustică într-o grădină verde",
  },
  {
    id: "terase",
    title: "Terase",
    short: "Terase",
    summary: "Terase și pergole care prelungesc casa în curte.",
    details: ["Pardoseală din lemn sau WPC", "Pergole și copertine", "Acoperire cu policarbonat sau tablă", "Balustrade și trepte"],
    image: px("8180361/pexels-photo-8180361.jpeg"),
    alt: "Terasă din lemn cu scaune și masă, cu vedere spre pădure",
  },
];

export const steps = [
  { title: "Vizită și măsurători", text: "Venim la tine, vedem locul și măsurăm. Îți spunem pe loc ce variante ai." },
  { title: "Ofertă scrisă", text: "Primești o ofertă clară, cu materialele, manopera și termenul de execuție." },
  { title: "Execuție", text: "Lucrăm după termenul stabilit și lăsăm locul curat la final de zi." },
  { title: "Predare și garanție", text: "Verificăm lucrarea împreună cu tine și primești garanție scrisă." },
];
