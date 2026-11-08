// Autentificare și înregistrare
const express = require('express');
const bcrypt = require('bcryptjs');
const { get, run } = require('../db');
const { counties } = require('../data');
const { flash, rateLimit } = require('../middleware');

const r = express.Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

function safeNext(n) {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/cont';
}

r.get('/autentificare', (req, res) => {
  if (req.user) return res.redirect('/cont');
  res.render('auth/login', { title: 'Intră în cont', form: {}, error: null, next: safeNext(req.query.next) });
});

r.post('/autentificare', limiter, (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const next = safeNext(req.body.next);
  const u = get('SELECT id, password_hash, banned FROM users WHERE email = ?', email);
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).render('auth/login', { title: 'Intră în cont', form: { email }, error: 'Emailul sau parola nu sunt corecte. Verifică datele și încearcă din nou.', next });
  }
  if (u.banned) {
    return res.status(403).render('auth/login', { title: 'Intră în cont', form: { email }, error: 'Contul tău a fost suspendat. Scrie-ne la pagina Contact pentru detalii.', next });
  }
  req.session.uid = u.id;
  req.session.csrf = null; // regenerare token după autentificare
  flash(req, 'success', 'Bine ai revenit!');
  res.redirect(next);
});

r.get('/inregistrare', (req, res) => {
  if (req.user) return res.redirect('/cont');
  res.render('auth/register', { title: 'Creează cont', form: { account_type: req.query.tip === 'firma' ? 'firma' : 'persoana' }, errors: {}, next: safeNext(req.query.next) });
});

r.post('/inregistrare', limiter, (req, res) => {
  const b = req.body;
  const form = {
    name: (b.name || '').trim().slice(0, 80),
    email: (b.email || '').trim().toLowerCase().slice(0, 150),
    phone: (b.phone || '').replace(/[^\d+ ]/g, '').trim().slice(0, 20),
    county: counties.includes(b.county) ? b.county : '',
    city: (b.city || '').trim().slice(0, 60),
    account_type: b.account_type === 'firma' ? 'firma' : 'persoana',
    company_name: (b.company_name || '').trim().slice(0, 120),
    cui: (b.cui || '').replace(/\s/g, '').toUpperCase().slice(0, 14),
    terms: b.terms,
  };
  const next = safeNext(b.next);
  const errors = {};
  if (form.name.length < 2) errors.name = 'Scrie numele tău (minimum 2 caractere).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Adresa de email nu pare corectă (ex: nume@exemplu.ro).';
  else if (get('SELECT 1 FROM users WHERE email = ?', form.email)) errors.email = 'Există deja un cont cu acest email. Încearcă să te autentifici.';
  if (form.phone.replace(/\D/g, '').length < 9) errors.phone = 'Numărul de telefon trebuie să aibă cel puțin 9 cifre (ex: 0722 123 456).';
  if (!form.county) errors.county = 'Alege județul.';
  if (form.city.length < 2) errors.city = 'Scrie localitatea.';
  if (form.account_type === 'firma') {
    if (form.company_name.length < 2) errors.company_name = 'Scrie denumirea firmei.';
    if (!/^(RO)?\d{2,10}$/.test(form.cui)) errors.cui = 'CUI-ul trebuie să conțină între 2 și 10 cifre, opțional cu prefixul RO.';
  }
  if ((b.password || '').length < 8) errors.password = 'Parola trebuie să aibă cel puțin 8 caractere.';
  else if (b.password !== b.password2) errors.password2 = 'Parolele nu coincid.';
  if (!form.terms) errors.terms = 'Trebuie să accepți termenii și condițiile.';

  if (Object.keys(errors).length) {
    return res.status(422).render('auth/register', { title: 'Creează cont', form, errors, next });
  }
  const hash = bcrypt.hashSync(b.password, 10);
  const info = run(
    `INSERT INTO users (email, password_hash, name, phone, county, city, account_type, company_name, cui)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    form.email, hash, form.name, form.phone, form.county, form.city, form.account_type,
    form.account_type === 'firma' ? form.company_name : null, form.account_type === 'firma' ? form.cui : null,
  );
  req.session.uid = Number(info.lastInsertRowid);
  req.session.csrf = null;
  flash(req, 'success', `Bine ai venit pe Constria, ${form.name.split(' ')[0]}! Contul tău este gata.`);
  res.redirect(next === '/cont' ? '/cont' : next);
});

r.post('/deconectare', (req, res) => {
  req.session = null;
  res.redirect('/');
});

r.get('/parola-uitata', (req, res) => res.render('auth/forgot', { title: 'Ai uitat parola?', sent: false }));
r.post('/parola-uitata', limiter, (req, res) => {
  // Fără serviciu de email configurat: confirmăm generic, fără a dezvălui dacă emailul există
  res.render('auth/forgot', { title: 'Ai uitat parola?', sent: true });
});

module.exports = r;
