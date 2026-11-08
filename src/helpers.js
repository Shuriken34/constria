// Funcții utilitare
const crypto = require('node:crypto');
const { catMap, unitMap, conditionMap, deliveryMap } = require('./data');

function stripDiacritics(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[șşŞȘ]/g, 's')
    .replace(/[țţŢȚ]/g, 't')
    .toLowerCase();
}

function slugify(s = '') {
  return stripDiacritics(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'anunt';
}

const nf = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 });
function formatNumber(n) {
  return nf.format(Number(n) || 0);
}

function formatPrice(l) {
  if (l.price_type === 'gratuit') return 'Gratuit';
  return `${formatNumber(l.price)} lei`;
}

function unitLabel(id) {
  const u = unitMap[id];
  if (!u) return id;
  return { buc: 'buc', mp: 'mp', mc: 'mc', ml: 'ml', kg: 'kg', tona: 'tonă', sac: 'sac', palet: 'palet', set: 'lot', litru: 'l', ora: 'oră', zi: 'zi', saptamana: 'săpt.', luna: 'lună' }[id] || u.name;
}

// Datele din SQLite sunt în UTC, format "YYYY-MM-DD HH:MM:SS"
function parseDate(s) {
  if (!s) return new Date();
  return new Date(s.replace(' ', 'T') + 'Z');
}

function timeAgo(s) {
  const d = parseDate(s);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'chiar acum';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return m === 1 ? 'acum un minut' : `acum ${m} ${m < 20 ? 'minute' : 'de minute'}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return h === 1 ? 'acum o oră' : `acum ${h} ${h < 20 ? 'ore' : 'de ore'}`;
  }
  if (diff < 86400 * 2) return 'ieri';
  if (diff < 86400 * 30) {
    const z = Math.floor(diff / 86400);
    return `acum ${z} ${z < 20 ? 'zile' : 'de zile'}`;
  }
  return formatDate(s);
}

function formatDate(s) {
  return parseDate(s).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' });
}

function formatTime(s) {
  return parseDate(s).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
}

function plural(n, one, many, manyDe) {
  if (n === 1) return `1 ${one}`;
  const mod = n % 100;
  if (n === 0 || (mod >= 1 && mod <= 19)) return `${formatNumber(n)} ${many}`;
  return `${formatNumber(n)} ${manyDe || 'de ' + many}`;
}

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
}

function imgSrc(p) {
  if (!p) return '/img/placeholder.svg';
  if (/^https?:\/\//.test(p)) return p;
  return p.startsWith('/') ? p : '/uploads/' + p;
}

function listingUrl(l) {
  return `/anunt/${l.id}-${l.slug}`;
}

function token() {
  return crypto.randomBytes(24).toString('hex');
}

function maskPhone(p = '') {
  const d = String(p).replace(/\s+/g, '');
  if (d.length < 6) return 'xxx xxx xxx';
  return d.slice(0, 4) + ' xxx xxx';
}

function whatsappLink(phone, text) {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '4' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

function buildQuery(base, params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

function truncate(s = '', n = 140) {
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

module.exports = {
  stripDiacritics, slugify, formatNumber, formatPrice, unitLabel, timeAgo, formatDate, formatTime, plural,
  initials, imgSrc, listingUrl, token, maskPhone, whatsappLink, buildQuery, truncate, parseDate,
  catMap, unitMap, conditionMap, deliveryMap,
};
