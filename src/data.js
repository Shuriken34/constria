// Date statice: categorii, județe, unități de măsură
const U = (id, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const groups = [
  { id: 'materiale', name: 'Materiale de construcții', short: 'Materiale', path: '/materiale' },
  { id: 'utilaje', name: 'Utilaje și echipamente', short: 'Utilaje', path: '/utilaje' },
  { id: 'scule', name: 'Scule și unelte', short: 'Scule', path: '/scule' },
];
// Grupele la care se pot completa marcă/model și se poate închiria
const rentableGroups = ['utilaje', 'scule'];

const categories = [
  // Materiale
  { group: 'materiale', slug: 'caramida-bca', name: 'Cărămidă și BCA', short: 'Zidărie', icon: 'brick-wall', image: U('photo-1495578942200-c5f5d2137def', 800) },
  { group: 'materiale', slug: 'ciment-betoane', name: 'Ciment, mortare și betoane', short: 'Ciment', icon: 'package', image: U('photo-1560780552-ba54683cb263', 800) },
  { group: 'materiale', slug: 'lemn-cherestea', name: 'Lemn și cherestea', short: 'Lemn', icon: 'trees', image: U('photo-1567080586917-e6ab6aa0df85', 800) },
  { group: 'materiale', slug: 'fier-metal', name: 'Fier beton și metal', short: 'Metal', icon: 'grid-3x3', image: U('photo-1745909247906-123b53b70e06', 800) },
  { group: 'materiale', slug: 'acoperisuri', name: 'Acoperișuri și învelitori', short: 'Acoperiș', icon: 'house', image: U('photo-1605450099279-533bd3ce379a', 800) },
  { group: 'materiale', slug: 'izolatii', name: 'Izolații termice și hidro', short: 'Izolații', icon: 'layers', image: U('photo-1768321917437-1f1f6ae2ad28', 800) },
  { group: 'materiale', slug: 'gresie-faianta', name: 'Gresie, faianță și pardoseli', short: 'Gresie', icon: 'layout-grid', image: U('photo-1580398562556-d33329a0f29b', 800) },
  { group: 'materiale', slug: 'gips-carton', name: 'Gips-carton și profile', short: 'Gips-carton', icon: 'panels-top-left', image: U('photo-1768321914149-5a6428ec2f82', 800) },
  { group: 'materiale', slug: 'vopsele-finisaje', name: 'Vopsele și finisaje', short: 'Vopsele', icon: 'paint-roller', image: U('photo-1525909002-1b05e0c869d8', 800) },
  { group: 'materiale', slug: 'instalatii', name: 'Instalații sanitare și termice', short: 'Instalații', icon: 'wrench', image: U('photo-1607472586893-edb57bdc0e39', 800) },
  { group: 'materiale', slug: 'usi-ferestre', name: 'Uși și ferestre', short: 'Uși & ferestre', icon: 'door-open', image: U('photo-1527352774566-e4916e36c645', 800) },
  { group: 'materiale', slug: 'agregate', name: 'Agregate: nisip, pietriș', short: 'Agregate', icon: 'mountain', image: U('photo-1604178449672-3e7d72d5a09a', 800) },
  { group: 'materiale', slug: 'electrice', name: 'Materiale electrice', short: 'Electrice', icon: 'zap', image: U('photo-1607400201889-565b1ee75f8e', 800) },
  // Utilaje și echipamente
  { group: 'utilaje', slug: 'excavatoare', name: 'Excavatoare și buldoexcavatoare', short: 'Excavatoare', icon: 'tractor', image: U('photo-1580901369227-308f6f40bdeb', 800) },
  { group: 'utilaje', slug: 'miniutilaje', name: 'Miniexcavatoare și miniîncărcătoare', short: 'Miniutilaje', icon: 'tractor', image: U('photo-1759950345011-ee5a96640e00', 800) },
  { group: 'utilaje', slug: 'macarale-nacele', name: 'Macarale, nacele și stivuitoare', short: 'Macarale & nacele', icon: 'forklift', image: U('photo-1765435149256-56f3ea3db68f', 800) },
  { group: 'utilaje', slug: 'camioane-basculante', name: 'Basculante și camioane', short: 'Basculante', icon: 'truck', image: U('photo-1778068846016-b0ae7a27abbe', 800) },
  { group: 'utilaje', slug: 'echipamente-beton', name: 'Betoniere, pompe și malaxoare', short: 'Echipamente beton', icon: 'cylinder', image: U('photo-1527410651988-c2f385ccd3f7', 800) },
  { group: 'utilaje', slug: 'compactare', name: 'Compactoare și cilindri', short: 'Compactare', icon: 'hammer', image: U('photo-1782442002533-1aec0cf5a9d8', 800) },
  { group: 'utilaje', slug: 'generatoare-compresoare', name: 'Generatoare și compresoare', short: 'Generatoare', icon: 'plug-zap', image: U('photo-1780445392484-38a4852a1fd8', 800) },
  { group: 'utilaje', slug: 'schele-cofraje', name: 'Schele și cofraje', short: 'Schele', icon: 'construction', image: U('photo-1765706845871-951abd038627', 800) },
  // Scule și unelte
  { group: 'scule', slug: 'scule-electrice', name: 'Scule electrice', short: 'Scule electrice', icon: 'drill', image: U('photo-1734888369502-3e01d4c0a46e', 800) },
  { group: 'scule', slug: 'scule-acumulator', name: 'Scule cu acumulator', short: 'Cu acumulator', icon: 'battery-charging', image: U('photo-1572981779307-38b8cabb2407', 800) },
  { group: 'scule', slug: 'scule-manuale', name: 'Scule manuale', short: 'Scule manuale', icon: 'hammer', image: U('photo-1581783898377-1c85bf937427', 800) },
  { group: 'scule', slug: 'masura-trasare', name: 'Măsură și trasare', short: 'Măsură', icon: 'ruler', image: U('photo-1550985543-49bee3167284', 800) },
  { group: 'scule', slug: 'echipamente-protectie', name: 'Echipamente de protecție', short: 'Protecție', icon: 'hard-hat', image: U('photo-1662309376159-b95fb193d96b', 800) },
  { group: 'scule', slug: 'accesorii-consumabile', name: 'Accesorii și consumabile', short: 'Accesorii', icon: 'disc', image: U('photo-1760376208640-2ece4c4a0adc', 800) },
  { group: 'scule', slug: 'scari-depozitare', name: 'Scări și depozitare scule', short: 'Scări & cutii', icon: 'archive', image: U('photo-1635082627989-dcd12a107364', 800) },
];

const listingTypes = [
  { id: 'vanzare', name: 'De vânzare' },
  { id: 'inchiriere', name: 'De închiriat' },
];

const counties = [
  'Alba', 'Arad', 'Argeș', 'Bacău', 'Bihor', 'Bistrița-Năsăud', 'Botoșani', 'Brăila', 'Brașov', 'București',
  'Buzău', 'Călărași', 'Caraș-Severin', 'Cluj', 'Constanța', 'Covasna', 'Dâmbovița', 'Dolj', 'Galați', 'Giurgiu',
  'Gorj', 'Harghita', 'Hunedoara', 'Ialomița', 'Iași', 'Ilfov', 'Maramureș', 'Mehedinți', 'Mureș', 'Neamț',
  'Olt', 'Prahova', 'Sălaj', 'Satu Mare', 'Sibiu', 'Suceava', 'Teleorman', 'Timiș', 'Tulcea', 'Vâlcea',
  'Vaslui', 'Vrancea',
];

const units = [
  { id: 'buc', name: 'bucată' },
  { id: 'mp', name: 'metru pătrat (mp)' },
  { id: 'mc', name: 'metru cub (mc)' },
  { id: 'ml', name: 'metru liniar (ml)' },
  { id: 'kg', name: 'kilogram (kg)' },
  { id: 'tona', name: 'tonă' },
  { id: 'sac', name: 'sac' },
  { id: 'palet', name: 'palet' },
  { id: 'set', name: 'set / lot' },
  { id: 'litru', name: 'litru' },
  { id: 'ora', name: 'oră (închiriere)' },
  { id: 'zi', name: 'zi (închiriere)' },
  { id: 'saptamana', name: 'săptămână (închiriere)' },
  { id: 'luna', name: 'lună (închiriere)' },
];

const conditions = [
  { id: 'nou', name: 'Nou' },
  { id: 'surplus', name: 'Surplus șantier' },
  { id: 'folosit', name: 'Folosit' },
];

const deliveryOptions = [
  { id: 'ridicare', name: 'Ridicare personală' },
  { id: 'livrare', name: 'Livrare de la vânzător' },
  { id: 'ambele', name: 'Ridicare sau livrare' },
];

const priceTypes = [
  { id: 'fix', name: 'Preț fix' },
  { id: 'negociabil', name: 'Negociabil' },
  { id: 'gratuit', name: 'Gratuit' },
];

const reportReasons = [
  'Anunț fals sau înșelătorie',
  'Preț sau informații greșite',
  'Produs deja vândut',
  'Conținut ofensator',
  'Anunț duplicat',
  'Altceva',
];

const images = {
  hero: U('photo-1587582423116-ec07293f0395', 1800),
  heroAlt: U('photo-1541888946425-d81bb19240f5', 1800),
  wide: U('photo-1508450859948-4e04fabaa4ea', 2000),
  crane: U('photo-1535732759880-bbd5c7265e3f', 1400),
  f1: U('photo-1589939705384-5185137a7f0f', 1200),
  f2: U('photo-1763771420303-0f11ccf613d1', 1200),
  f3: U('photo-1553413077-190dd305871c', 1200),
  calcA: U('photo-1772442198624-4fc4d7281e89', 900),
  calcB: U('photo-1606676539940-12768ce0e762', 900),
  about: U('photo-1504307651254-35680f356dfd', 1600),
  workers: U('photo-1768926968986-a88590ce5025', 1600),
  machines: U('photo-1503708928676-1cb796a0891e', 2000),
  machinesAerial: U('photo-1517089596392-fb9a9033e05b', 1600),
  heroPoster: U('photo-1575281923032-f40d94ef6160', 1800),
  tools: U('photo-1598302936625-6075fbd98dd7', 1600),
  toolsWall: U('photo-1426927308491-6380b6a9936f', 1200),
};

// Clipuri video gratuite (Pexels) pentru hero – rulate pe rând
const heroVideos = [
  { src: 'https://videos.pexels.com/video-files/35650012/15107631_1280_720_50fps.mp4', label: 'Utilaje · excavator și basculantă' },
  { src: 'https://videos.pexels.com/video-files/13457611/13457611-hd_1280_720_30fps.mp4', label: 'Scule · polizor unghiular' },
  { src: 'https://videos.pexels.com/video-files/7065837/7065837-hd_1280_720_24fps.mp4', label: 'Materiale · cărămidă' },
  { src: 'https://videos.pexels.com/video-files/16227945/16227945-hd_1280_720_25fps.mp4', label: 'Utilaje · macara pe șantier' },
  { src: 'https://videos.pexels.com/video-files/24906853/11898920_1280_720_60fps.mp4', label: 'Scule · tăiere beton' },
  { src: 'https://videos.pexels.com/video-files/5972638/5972638-hd_1280_720_25fps.mp4', label: 'Scule · bormașină' },
  { src: 'https://videos.pexels.com/video-files/28823325/12486023_1280_720_30fps.mp4', label: 'Șantier la apus' },
];

const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));
const groupMap = Object.fromEntries(groups.map((g) => [g.id, g]));
const listingTypeMap = Object.fromEntries(listingTypes.map((t) => [t.id, t]));
const catsByGroup = (g) => categories.filter((c) => c.group === g);
const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
const conditionMap = Object.fromEntries(conditions.map((c) => [c.id, c]));
const deliveryMap = Object.fromEntries(deliveryOptions.map((d) => [d.id, d]));

module.exports = {
  U, groups, rentableGroups, categories, listingTypes, counties, units, conditions, deliveryOptions, priceTypes, reportReasons, images, heroVideos,
  catMap, groupMap, listingTypeMap, catsByGroup, unitMap, conditionMap, deliveryMap,
};
