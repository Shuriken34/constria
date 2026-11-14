// Statistici proprii, fără cookie-uri și fără date personale: vizitatorul e un hash zilnic (IP + browser + zi + secret),
// care nu poate fi legat de o persoană și se schimbă în fiecare zi. Doar adminii văd rezultatele (RLS pe site_events).
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|preview|headless|lighthouse|pagespeed|curl|wget|python|node-fetch|axios|go-http|java\/|monitor|uptime|scan/i;
const SKIP = /^\/(api|admin|auth)(\/|$)|\.(xml|txt|ico|json|webmanifest)$/;

let secret = '';
const day = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });

function visitorId(req) {
  return crypto.createHash('sha256').update(`${secret}|${day()}|${req.ip}|${req.get('user-agent') || ''}`).digest('hex').slice(0, 16);
}

function shouldTrack(req) {
  const ua = req.get('user-agent') || '';
  return ua && !BOT.test(ua) && !(req.user && req.user.role === 'admin');
}

// Sursa vizitei: utm_source, apoi ID-urile de click ale rețelelor, apoi site-ul de unde a venit (referer)
function normalize(s) {
  const map = [[/facebook|^fb$|fb\.com|fb\.me/, 'facebook'], [/instagram|^ig$/, 'instagram'], [/tiktok/, 'tiktok'],
    [/google/, 'google'], [/bing/, 'bing'], [/yahoo/, 'yahoo'], [/duckduckgo/, 'duckduckgo'], [/whatsapp/, 'whatsapp'],
    [/youtube|youtu\.be/, 'youtube'], [/linkedin|lnkd/, 'linkedin'], [/^t\.co$|twitter|^x\.com$/, 'x / twitter'], [/messenger/, 'messenger']];
  for (const [re, name] of map) if (re.test(s)) return name;
  return s.slice(0, 40);
}

function sourceOf(req) {
  const q = req.query || {};
  const utm = String(q.utm_source || '').toLowerCase().trim();
  if (utm) return normalize(utm);
  if (q.fbclid) return 'facebook';
  if (q.ttclid) return 'tiktok';
  if (q.gclid || q.gbraid || q.wbraid) return 'google';
  const ref = req.get('referer');
  if (!ref) return 'direct';
  let host;
  try { host = new URL(ref).hostname.toLowerCase().replace(/^(www|m|l|lm)\./, ''); } catch { return 'direct'; }
  if (host === req.hostname.toLowerCase().replace(/^www\./, '')) return 'intern';
  return normalize(host);
}

function track(req, kind, listingId) {
  if (!secret || !shouldTrack(req)) return;
  sb.rpc('track_event', {
    p_kind: kind,
    p_path: req.path.slice(0, 200),
    p_listing_id: listingId ? Number(listingId) || null : null,
    p_source: kind === 'pageview' ? sourceOf(req) : 'intern',
    p_visitor: visitorId(req),
  }).then(() => {}, () => {});
}

// Înregistrează afișările de pagini HTML reușite (după ce răspunsul a plecat, ca să nu încetinească site-ul)
function pageviews(sessionSecret) {
  secret = sessionSecret;
  return (req, res, next) => {
    if (req.method !== 'GET' || SKIP.test(req.path)) return next();
    res.on('finish', () => {
      if (res.statusCode !== 200 || !String(res.get('content-type') || '').includes('text/html')) return;
      const m = /^\/anunt\/(\d+)-/.exec(req.path);
      track(req, 'pageview', m ? m[1] : null);
    });
    next();
  };
}

module.exports = { pageviews, track };
