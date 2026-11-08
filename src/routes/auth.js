// Autentificare cu Supabase Auth: intrare, înregistrare, confirmare email, resetare parolă
const express = require('express');
const { counties } = require('../data');
const { flash, rateLimit, requireAuth } = require('../middleware');

const r = express.Router();
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

function safeNext(n) {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/cont';
}
const siteUrl = (req) => (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

r.get('/autentificare', (req, res) => {
  if (req.user) return res.redirect('/cont');
  res.render('auth/login', { title: 'Intră în cont', form: {}, error: null, next: safeNext(req.query.next), showResend: req.query.confirmare === 'retrimite' });
});

r.post('/autentificare', limiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const password = req.body.password || '';
  const next = safeNext(req.body.next);
  const { data, error } = await req.sb.auth.signInWithPassword({ email, password });
  if (error) {
    const notConfirmed = /not confirmed/i.test(error.message);
    const msg = notConfirmed
      ? 'Adresa de email nu a fost încă confirmată. Deschide emailul de confirmare primit la înregistrare sau cere unul nou mai jos.'
      : 'Emailul sau parola nu sunt corecte. Verifică datele și încearcă din nou.';
    return res.status(401).render('auth/login', { title: 'Intră în cont', form: { email }, error: msg, next, showResend: notConfirmed });
  }
  const { data: profile } = await req.sb.from('profiles').select('banned, name').eq('id', data.user.id).maybeSingle();
  if (profile && profile.banned) {
    await req.sb.auth.signOut();
    return res.status(403).render('auth/login', { title: 'Intră în cont', form: { email }, error: 'Contul tău a fost suspendat. Scrie-ne la pagina Contact pentru detalii.', next, showResend: false });
  }
  req.session.csrf = null; // regenerare token după autentificare
  flash(req, 'success', 'Bine ai revenit!');
  res.redirect(next);
});

r.get('/inregistrare', (req, res) => {
  if (req.user) return res.redirect('/cont');
  res.render('auth/register', { title: 'Creează cont', form: { account_type: req.query.tip === 'firma' ? 'firma' : 'persoana' }, errors: {}, next: safeNext(req.query.next) });
});

r.post('/inregistrare', limiter, async (req, res) => {
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

  const { data, error } = await req.sb.auth.signUp({
    email: form.email,
    password: b.password,
    options: {
      emailRedirectTo: `${siteUrl(req)}/auth/confirm?next=${encodeURIComponent(next)}`,
      // Folosite doar ca valori inițiale ale profilului (trigger în baza de date)
      data: {
        name: form.name, phone: form.phone, county: form.county, city: form.city, account_type: form.account_type,
        company_name: form.account_type === 'firma' ? form.company_name : null,
        cui: form.account_type === 'firma' ? form.cui : null,
      },
    },
  });
  if (error) {
    if (/already registered|already exists/i.test(error.message)) errors.email = 'Există deja un cont cu acest email. Încearcă să te autentifici.';
    else if (/password/i.test(error.message)) errors.password = 'Parola este prea slabă. Folosește cel puțin 8 caractere, cu litere și cifre.';
    else if (/rate limit|too many/i.test(error.message)) errors.email = 'Au fost trimise prea multe emailuri de confirmare. Încearcă din nou peste câteva minute.';
    else errors.email = 'Nu am putut crea contul: ' + error.message;
    return res.status(422).render('auth/register', { title: 'Creează cont', form, errors, next });
  }
  if (data.session) {
    req.session.csrf = null;
    flash(req, 'success', `Bine ai venit pe Constria, ${form.name.split(' ')[0]}! Contul tău este gata.`);
    return res.redirect(next);
  }
  // Confirmarea emailului este activă: utilizatorul primește un link
  res.render('auth/check-email', { title: 'Verifică emailul', email: form.email });
});

// Linkurile din emailuri (confirmare cont, resetare parolă) ajung aici.
// Variante acceptate:
//  - ?token_hash=...&type=email|recovery  (recomandat: funcționează din orice browser sau dispozitiv)
//  - ?code=...                            (fluxul PKCE implicit: merge doar în browserul unde s-a creat contul)
//  - ?error=...&error_code=...            (Supabase a respins linkul: expirat sau deja folosit)
const OTP_TYPES = ['email', 'signup', 'recovery', 'invite', 'magiclink', 'email_change'];
r.get('/auth/confirm', async (req, res) => {
  const next = safeNext(req.query.next);
  const isRecovery = next === '/cont/parola-noua' || req.query.type === 'recovery';

  if (req.query.error || req.query.error_code) {
    flash(req, 'error', isRecovery
      ? 'Linkul de resetare a expirat sau a fost deja folosit. Cere unul nou mai jos.'
      : 'Linkul de confirmare a fost deja folosit sau a expirat. Dacă ți-ai confirmat deja contul, intră în cont. Altfel, cere un email nou de confirmare.');
    return res.redirect(isRecovery ? '/parola-uitata' : '/autentificare?confirmare=retrimite');
  }

  let error = null;
  if (req.query.token_hash) {
    const type = OTP_TYPES.includes(String(req.query.type)) ? String(req.query.type) : 'email';
    ({ error } = await req.sb.auth.verifyOtp({ token_hash: String(req.query.token_hash), type }));
  } else if (req.query.code) {
    ({ error } = await req.sb.auth.exchangeCodeForSession(String(req.query.code)));
    // Linkul a fost deschis în alt browser / altă aplicație decât cel în care s-a creat contul.
    // Supabase a confirmat deja emailul înainte de redirecționare; doar sesiunea nu poate fi pornită aici.
    if (error && /verifier|pkce/i.test(`${error.code || ''} ${error.message || ''}`)) {
      if (isRecovery) {
        flash(req, 'error', 'Deschide linkul de resetare în același browser în care l-ai cerut, sau cere un link nou de aici.');
        return res.redirect('/parola-uitata');
      }
      flash(req, 'success', 'Adresa de email a fost confirmată! Intră în cont cu emailul și parola alese.');
      return res.redirect('/autentificare?next=' + encodeURIComponent(next));
    }
  } else {
    error = new Error('missing code');
  }

  if (error) {
    flash(req, 'error', isRecovery
      ? 'Linkul de resetare a expirat sau a fost deja folosit. Cere unul nou.'
      : 'Linkul de confirmare a expirat sau a fost deja folosit. Dacă ți-ai confirmat deja contul, intră în cont.');
    return res.redirect(isRecovery ? '/parola-uitata' : '/autentificare?confirmare=retrimite');
  }
  req.session.csrf = null;
  flash(req, 'success', isRecovery ? 'Alege o parolă nouă pentru contul tău.' : 'Adresa de email a fost confirmată. Bine ai venit pe Constria!');
  res.redirect(isRecovery ? '/cont/parola-noua' : next);
});

// Retrimite emailul de confirmare
r.post('/confirmare/retrimite', limiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await req.sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${siteUrl(req)}/auth/confirm?next=/cont` } });
  }
  // Răspuns generic: nu dezvăluim dacă emailul are cont
  res.render('auth/check-email', { title: 'Verifică emailul', email });
});

r.post('/deconectare', async (req, res) => {
  await req.sb.auth.signOut();
  req.session = null;
  res.redirect('/');
});

r.get('/parola-uitata', (req, res) => res.render('auth/forgot', { title: 'Ai uitat parola?', sent: false }));
r.post('/parola-uitata', limiter, async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    // Răspuns generic, fără a dezvălui dacă emailul există
    await req.sb.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl(req)}/auth/confirm?next=/cont/parola-noua` });
  }
  res.render('auth/forgot', { title: 'Ai uitat parola?', sent: true });
});

r.get('/cont/parola-noua', requireAuth, (req, res) => res.render('auth/new-password', { title: 'Parolă nouă', error: null }));
r.post('/cont/parola-noua', requireAuth, async (req, res) => {
  const p = req.body.password || '';
  if (p.length < 8 || p !== req.body.password2) {
    return res.status(422).render('auth/new-password', { title: 'Parolă nouă', error: p.length < 8 ? 'Parola trebuie să aibă cel puțin 8 caractere.' : 'Parolele nu coincid.' });
  }
  const { error } = await req.sb.auth.updateUser({ password: p });
  if (error) return res.status(422).render('auth/new-password', { title: 'Parolă nouă', error: 'Parola nu a putut fi schimbată: ' + error.message });
  flash(req, 'success', 'Parola a fost schimbată.');
  res.redirect('/cont');
});

module.exports = r;
