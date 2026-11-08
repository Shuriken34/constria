// Middleware: utilizator curent, CSRF, mesaje flash, protecție rute
const crypto = require('node:crypto');
const { get, run } = require('./db');
const { unreadCount } = require('./models');
const { token } = require('./helpers');

function loadUser(req, res, next) {
  res.locals.user = null;
  res.locals.unread = 0;
  const uid = req.session && req.session.uid;
  if (uid) {
    const u = get('SELECT id, email, name, phone, county, city, account_type, company_name, cui, about, avatar, role, banned, verified, created_at FROM users WHERE id = ?', uid);
    if (u && !u.banned) {
      req.user = u;
      res.locals.user = u;
      res.locals.unread = unreadCount(u.id);
      // actualizare "văzut ultima dată" cel mult o dată la 5 minute
      if (!req.session.seen || Date.now() - req.session.seen > 300000) {
        run("UPDATE users SET last_seen = datetime('now') WHERE id = ?", u.id);
        req.session.seen = Date.now();
      }
    } else {
      req.session.uid = null;
    }
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
  flash(req, 'info', 'Intră în cont pentru a continua.');
  res.redirect('/autentificare?next=' + encodeURIComponent(req.originalUrl));
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
