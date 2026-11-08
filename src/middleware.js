// Middleware: client Supabase, utilizator curent, CSRF, mesaje flash, protecție rute
const crypto = require('node:crypto');
const { createSupabase } = require('./supabase');
const { token } = require('./helpers');

// Atașează clientul Supabase și încarcă utilizatorul autentificat (dacă există)
async function loadUser(req, res, next) {
  req.sb = createSupabase(req, res);
  res.locals.user = null;
  res.locals.unread = 0;
  const { data, error } = await req.sb.auth.getClaims();
  const claims = !error && data ? data.claims : null;
  if (!claims || !claims.sub) return next();

  const uid = claims.sub;
  const [{ data: profile }, { data: contact }] = await Promise.all([
    req.sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
    req.sb.from('profile_contacts').select('email, phone').eq('user_id', uid).maybeSingle(),
  ]);
  if (!profile || profile.banned) {
    await req.sb.auth.signOut();
    return next();
  }
  const role = claims.app_metadata && claims.app_metadata.role === 'admin' ? 'admin' : 'user';
  req.user = { ...profile, email: (contact && contact.email) || claims.email, phone: contact ? contact.phone : null, role };
  res.locals.user = req.user;

  const { count } = await req.sb.from('messages').select('id', { count: 'exact', head: true })
    .is('read_at', null).neq('sender_id', uid);
  res.locals.unread = count || 0;

  // „Văzut ultima dată” cel mult o dată la 5 minute
  if (!req.session.seen || Date.now() - req.session.seen > 300000) {
    req.session.seen = Date.now();
    req.sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', uid).then(() => {}, () => {});
  }
  next();
}

function csrf(req, res, next) {
  if (!req.session.csrf) req.session.csrf = token();
  res.locals.csrf = req.session.csrf;
  next();
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function checkCsrf(req) {
  const t = (req.body && req.body._csrf) || req.get('x-csrf-token');
  return safeEqual(t, req.session.csrf);
}

// Verificare automată pentru formulare normale; cele multipart verifică după multer
function verifyCsrf(req, res, next) {
  if (req.method !== 'POST') return next();
  if ((req.get('content-type') || '').startsWith('multipart/form-data')) return next();
  if (!checkCsrf(req)) {
    return res.status(403).render('error', { title: 'Sesiune expirată', code: 403, message: 'Formularul a expirat. Reîncarcă pagina și încearcă din nou.' });
  }
  next();
}

function flash(req, type, text) {
  req.session.flash = req.session.flash || [];
  req.session.flash.push({ type, text });
}

function flashLocals(req, res, next) {
  res.locals.flash = req.session.flash || [];
  req.session.flash = [];
  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const back = req.method === 'GET' ? req.originalUrl : (req.get('referer') ? new URL(req.get('referer')).pathname : '/');
  if (wantsJson) return res.status(401).json({ login: '/autentificare?next=' + encodeURIComponent(back) });
  flash(req, 'info', 'Ai nevoie de un cont ca să continui. Intră în cont sau creează unul gratuit.');
  res.redirect('/autentificare?next=' + encodeURIComponent(back));
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') return next();
  res.status(404).render('error', { title: 'Pagina nu există', code: 404, message: 'Pagina căutată nu există.' });
}

// Limitare simplă a încercărilor (în memorie)
function rateLimit({ windowMs, max, key = (req) => req.ip }) {
  const hits = new Map();
  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    const h = (hits.get(k) || []).filter((t) => now - t < windowMs);
    if (h.length >= max) {
      return res.status(429).render('error', { title: 'Prea multe încercări', code: 429, message: 'Ai făcut prea multe încercări. Așteaptă câteva minute și încearcă din nou.' });
    }
    h.push(now);
    hits.set(k, h);
    next();
  };
}

module.exports = { loadUser, csrf, verifyCsrf, checkCsrf, flash, flashLocals, requireAuth, requireAdmin, rateLimit };
