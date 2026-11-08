// Rute publice: acasă, anunțuri, vânzători, pagini informative, blog
const express = require('express');
const { get, all, run } = require('../db');
const m = require('../models');
const { categories, catMap, groupMap, counties, reportReasons } = require('../data');
const { faq, testimonials, safetyTips } = require('../content');
const { flash, requireAuth } = require('../middleware');
const { listingUrl } = require('../helpers');

const r = express.Router();

r.get('/', (req, res) => {
  const uid = req.user ? req.user.id : null;
  res.render('home', {
    featured: m.featuredListings(8, uid, 'materiale'),
    machines: m.featuredListings(4, uid, 'utilaje'),
    tools: m.featuredListings(4, uid, 'scule'),
    counts: m.categoryCounts(),
    sellers: m.topSellers(5),
    stats: m.siteStats(),
    posts: all('SELECT * FROM posts ORDER BY created_at DESC LIMIT 3'),
    faq: faq.slice(0, 5),
    testimonials,
    home: true,
  });
});

function renderSearch(req, res, extra = {}) {
  const f = {
    q: (req.query.q || '').toString().slice(0, 100),
    category: extra.category || (req.query.categorie || '').toString(),
    group: extra.group || (req.query.grup || '').toString(),
    type: (req.query.tip || '').toString(),
    year_min: req.query.an_min ? Number(req.query.an_min) || '' : '',
    county: (req.query.judet || '').toString(),
    city: (req.query.oras || '').toString().slice(0, 60),
    condition: (req.query.stare || '').toString(),
    seller_type: (req.query.vanzator || '').toString(),
    delivery: (req.query.livrare || '').toString(),
    min: req.query.min ? Number(req.query.min) || '' : '',
    max: req.query.max ? Number(req.query.max) || '' : '',
    free: req.query.gratuit ? 1 : '',
    sort: (req.query.sortare || '').toString(),
  };
  if (f.county && !counties.includes(f.county)) f.county = '';
  const result = m.searchListings(f, { page: req.query.pagina, userId: req.user ? req.user.id : null });
  const cat = catMap[f.category];
  if (cat) f.group = cat.group;
  const grp = groupMap[f.group] || null;
  res.render('listings', {
    title: cat ? cat.name : grp && !f.q ? grp.name : f.q ? `Rezultate pentru „${f.q}”` : 'Toate anunțurile',
    description: cat ? `Anunțuri ${cat.name.toLowerCase()} – cumpără, vinde sau închiriază pe Constria.` : undefined,
    f, cat, grp, ...result, counts: m.categoryCounts(),
    baseUrl: cat ? `/categorie/${cat.slug}` : extra.group ? grp.path : '/anunturi',
  });
}

r.get('/anunturi', (req, res) => renderSearch(req, res));
r.get('/utilaje', (req, res) => renderSearch(req, res, { group: 'utilaje' }));
r.get('/materiale', (req, res) => renderSearch(req, res, { group: 'materiale' }));
r.get('/scule', (req, res) => renderSearch(req, res, { group: 'scule' }));
r.get('/categorie/scule-utilaje', (req, res) => res.redirect(301, '/categorie/scule-electrice'));
r.get('/categorie/:slug', (req, res, next) => {
  if (!catMap[req.params.slug]) return next();
  renderSearch(req, res, { category: req.params.slug });
});
r.get('/categorii', (req, res) => {
  res.render('categories', { title: 'Toate categoriile', counts: m.categoryCounts() });
});

r.get('/anunt/:idslug', (req, res, next) => {
  const id = parseInt(req.params.idslug, 10);
  const l = id && m.getListing(id);
  if (!l) return next();
  const isOwner = req.user && req.user.id === l.user_id;
  const isAdmin = req.user && req.user.role === 'admin';
  if ((l.status === 'blocat' || l.status === 'inactiv' || l.seller_banned) && !isOwner && !isAdmin) {
    return res.status(410).render('error', { title: 'Anunț indisponibil', code: 410, message: 'Acest anunț nu mai este disponibil. Caută alte oferte similare.' });
  }
  if (req.params.idslug !== `${l.id}-${l.slug}`) return res.redirect(301, listingUrl(l));
  if (!isOwner) {
    req.session.viewed = (req.session.viewed || []).slice(-50);
    if (!req.session.viewed.includes(l.id)) {
      run('UPDATE listings SET views = views + 1 WHERE id = ?', l.id);
      req.session.viewed.push(l.id);
      l.views += 1;
    }
  }
  const isFav = req.user ? !!get('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?', req.user.id, l.id) : false;
  const conv = req.user && !isOwner ? get('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?', l.id, req.user.id) : null;
  res.render('listing', {
    title: l.title,
    description: l.description.slice(0, 155),
    l, isOwner, isFav, conv,
    imgs: m.listingImages(l.id),
    similar: m.similarListings(l),
    seller: m.sellerStats(l.user_id),
    reportReasons,
    ogImage: l.cover,
  });
});

r.get('/api/anunt/:id/telefon', (req, res) => {
  const l = get(`SELECT u.phone FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ? AND l.status != 'blocat'`, Number(req.params.id));
  if (!l || !l.phone) return res.status(404).json({ error: 'Telefon indisponibil' });
  res.json({ phone: l.phone });
});

r.post('/anunt/:id/raporteaza', (req, res, next) => {
  const l = m.getListing(req.params.id);
  if (!l) return next();
  const reason = reportReasons.includes(req.body.reason) ? req.body.reason : null;
  if (!reason) {
    flash(req, 'error', 'Alege un motiv pentru raportare.');
  } else {
    run('INSERT INTO reports (listing_id, user_id, reason, details) VALUES (?,?,?,?)',
      l.id, req.user ? req.user.id : null, reason, (req.body.details || '').toString().slice(0, 1000));
    flash(req, 'success', 'Mulțumim! Am primit raportarea și o vom verifica în cel mai scurt timp.');
  }
  res.redirect(listingUrl(l));
});

r.get('/vanzator/:id', (req, res, next) => {
  const s = get('SELECT id, name, account_type, company_name, county, city, about, avatar, verified, created_at, last_seen, banned FROM users WHERE id = ?', Number(req.params.id));
  if (!s || s.banned) return next();
  const result = m.searchListings({ seller: s.id, sort: req.query.sortare }, { page: req.query.pagina, perPage: 12, userId: req.user ? req.user.id : null });
  const reviews = all(`SELECT r.*, u.name AS author_name FROM reviews r JOIN users u ON u.id = r.author_id WHERE r.seller_id = ? ORDER BY r.created_at DESC LIMIT 30`, s.id);
  let canReview = false;
  let myReview = null;
  if (req.user && req.user.id !== s.id) {
    canReview = !!get('SELECT 1 FROM conversations WHERE seller_id = ? AND buyer_id = ?', s.id, req.user.id);
    myReview = get('SELECT * FROM reviews WHERE seller_id = ? AND author_id = ?', s.id, req.user.id);
  }
  res.render('seller', {
    title: s.company_name || s.name, s, ...result, reviews, stats: m.sellerStats(s.id), canReview, myReview,
  });
});

r.post('/vanzator/:id/recenzie', requireAuth, (req, res, next) => {
  const sid = Number(req.params.id);
  const s = get('SELECT id FROM users WHERE id = ?', sid);
  if (!s) return next();
  const allowed = sid !== req.user.id && get('SELECT 1 FROM conversations WHERE seller_id = ? AND buyer_id = ?', sid, req.user.id);
  const rating = parseInt(req.body.rating, 10);
  if (!allowed) {
    flash(req, 'error', 'Poți lăsa o recenzie doar vânzătorilor cu care ai discutat.');
  } else if (!(rating >= 1 && rating <= 5)) {
    flash(req, 'error', 'Alege un număr de stele între 1 și 5.');
  } else {
    run(`INSERT INTO reviews (seller_id, author_id, rating, body) VALUES (?,?,?,?)
         ON CONFLICT(seller_id, author_id) DO UPDATE SET rating = excluded.rating, body = excluded.body, created_at = datetime('now')`,
    sid, req.user.id, rating, (req.body.body || '').toString().trim().slice(0, 800));
    flash(req, 'success', 'Recenzia a fost salvată. Mulțumim!');
  }
  res.redirect(`/vanzator/${sid}#recenzii`);
});

r.get('/calculator', (req, res) => res.render('calculator', { title: 'Calculator materiale de construcții', description: 'Calculează rapid câte materiale îți trebuie pentru zidărie, beton, tencuială, gresie, vopsit sau izolație.' }));
r.get('/cum-functioneaza', (req, res) => res.render('how', { title: 'Cum funcționează', safetyTips }));
r.get('/despre-noi', (req, res) => res.render('about', { title: 'Despre noi', stats: m.siteStats() }));
r.get('/siguranta', (req, res) => res.render('safety', { title: 'Sfaturi de siguranță', safetyTips }));
r.get('/intrebari-frecvente', (req, res) => res.render('faq', { title: 'Întrebări frecvente', faq }));
r.get('/termeni', (req, res) => res.render('legal', { title: 'Termeni și condiții', doc: 'termeni' }));
r.get('/confidentialitate', (req, res) => res.render('legal', { title: 'Politica de confidențialitate', doc: 'confidentialitate' }));

r.get('/contact', (req, res) => res.render('contact', { title: 'Contact', form: {}, errors: {} }));
r.post('/contact', (req, res) => {
  const form = {
    name: (req.body.name || '').trim().slice(0, 100),
    email: (req.body.email || '').trim().slice(0, 150),
    subject: (req.body.subject || '').trim().slice(0, 150),
    body: (req.body.body || '').trim().slice(0, 3000),
  };
  const errors = {};
  if (form.name.length < 2) errors.name = 'Scrie-ne numele tău.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Adresa de email nu pare corectă (ex: nume@exemplu.ro).';
  if (form.body.length < 10) errors.body = 'Mesajul trebuie să aibă cel puțin 10 caractere.';
  if (Object.keys(errors).length) return res.status(422).render('contact', { title: 'Contact', form, errors });
  run('INSERT INTO contact_messages (name, email, subject, body) VALUES (?,?,?,?)', form.name, form.email, form.subject, form.body);
  flash(req, 'success', 'Mesajul a fost trimis. Îți răspundem în maximum o zi lucrătoare.');
  res.redirect('/contact');
});

r.get('/blog', (req, res) => {
  res.render('blog', { title: 'Ghiduri și noutăți', posts: all('SELECT * FROM posts ORDER BY created_at DESC') });
});
r.get('/blog/:slug', (req, res, next) => {
  const post = get('SELECT * FROM posts WHERE slug = ?', req.params.slug);
  if (!post) return next();
  res.render('post', {
    title: post.title, description: post.excerpt, post, ogImage: post.image,
    more: all('SELECT * FROM posts WHERE id != ? ORDER BY created_at DESC LIMIT 3', post.id),
  });
});

r.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /cont\nDisallow: /admin\nSitemap: /sitemap.xml\n');
});

r.get('/sitemap.xml', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const urls = ['/', '/anunturi', '/materiale', '/utilaje', '/scule', '/categorii', '/calculator', '/cum-functioneaza', '/despre-noi', '/blog', '/contact', '/intrebari-frecvente']
    .concat(categories.map((c) => `/categorie/${c.slug}`))
    .concat(all('SELECT slug FROM posts').map((p) => `/blog/${p.slug}`))
    .concat(all("SELECT id, slug FROM listings WHERE status='activ' ORDER BY id DESC LIMIT 5000").map(listingUrl));
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`);
});

module.exports = r;
