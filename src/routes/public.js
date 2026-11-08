// Rute publice: acasă, anunțuri, vânzători, pagini informative, blog
const express = require('express');
const m = require('../models');
const { must } = require('../supabase');
const { categories, catMap, groupMap, counties, reportReasons } = require('../data');
const { faq, safetyTips } = require('../content');
const { flash, requireAuth } = require('../middleware');
const { listingUrl } = require('../helpers');

const r = express.Router();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

r.get('/', async (req, res, next) => {
  // Dacă adresa de întoarcere nu e în lista Supabase, linkul din email ajunge pe pagina principală
  if (req.query.code || req.query.token_hash || req.query.error_code) {
    const qs = new URLSearchParams(req.query);
    if (!qs.has('next')) qs.set('next', '/cont');
    return res.redirect('/auth/confirm?' + qs.toString());
  }
  const sb = req.sb;
  const uid = req.user ? req.user.id : null;
  const [featured, machines, tools, counts, sellers, stats, posts] = await Promise.all([
    m.featuredListings(sb, 8, uid, 'materiale'),
    m.featuredListings(sb, 4, uid, 'utilaje'),
    m.featuredListings(sb, 4, uid, 'scule'),
    m.categoryCounts(sb),
    m.topSellers(sb, 5),
    m.siteStats(sb),
    sb.from('posts').select('*').order('created_at', { ascending: false }).limit(3).then(must),
  ]);
  res.render('home', { featured, machines, tools, counts, sellers, stats, posts, faq: faq.slice(0, 5), home: true });
});

async function renderSearch(req, res, extra = {}) {
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
  const [result, counts] = await Promise.all([
    m.searchListings(req.sb, f, { page: req.query.pagina, userId: req.user ? req.user.id : null }),
    m.categoryCounts(req.sb),
  ]);
  const cat = catMap[f.category];
  if (cat) f.group = cat.group;
  const grp = groupMap[f.group] || null;
  res.render('listings', {
    title: cat ? cat.name : grp && !f.q ? grp.name : f.q ? `Rezultate pentru „${f.q}”` : 'Toate anunțurile',
    description: cat ? `Anunțuri ${cat.name.toLowerCase()} – cumpără, vinde sau închiriază pe Constria.` : undefined,
    f, cat, grp, ...result, counts,
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
  return renderSearch(req, res, { category: req.params.slug });
});
r.get('/categorii', async (req, res) => {
  res.render('categories', { title: 'Toate categoriile', counts: await m.categoryCounts(req.sb) });
});

r.get('/anunt/:idslug', async (req, res, next) => {
  const sb = req.sb;
  const id = parseInt(req.params.idslug, 10);
  const l = id ? await m.getListing(sb, id) : null;
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
      req.session.viewed.push(l.id);
      l.views += 1;
      sb.rpc('increment_listing_views', { p_listing_id: l.id }).then(() => {}, () => {});
    }
  }
  const [imgs, similar, seller, phone, fav, conv] = await Promise.all([
    m.listingImages(sb, l.id),
    m.similarListings(sb, l),
    m.sellerStats(sb, l.user_id),
    l.status === 'activ' && !isOwner ? m.listingPhone(sb, l.id) : Promise.resolve(null),
    req.user ? sb.from('favorites').select('listing_id').eq('listing_id', l.id).maybeSingle().then(must) : null,
    req.user && !isOwner ? sb.from('conversations').select('id').eq('listing_id', l.id).eq('buyer_id', req.user.id).maybeSingle().then(must) : null,
  ]);
  l.seller_phone = phone;
  res.render('listing', {
    title: l.title,
    description: l.description.slice(0, 155),
    l, isOwner, isFav: !!fav, conv, imgs, similar, seller, reportReasons,
    ogImage: l.cover,
  });
});

// Telefonul se afișează doar la cerere (pentru oricine vizitează anunțul)
r.get('/api/anunt/:id/telefon', async (req, res) => {
  const phone = await m.listingPhone(req.sb, req.params.id);
  if (!phone) return res.status(404).json({ error: 'Telefon indisponibil' });
  res.json({ phone });
});

r.post('/anunt/:id/raporteaza', requireAuth, async (req, res, next) => {
  const l = await m.getListing(req.sb, req.params.id);
  if (!l) return next();
  const reason = reportReasons.includes(req.body.reason) ? req.body.reason : null;
  if (!reason) {
    flash(req, 'error', 'Alege un motiv pentru raportare.');
  } else {
    must(await req.sb.from('reports').insert({
      listing_id: l.id, user_id: req.user.id, reason, details: (req.body.details || '').toString().slice(0, 1000) || null,
    }));
    flash(req, 'success', 'Mulțumim! Am primit raportarea și o vom verifica în cel mai scurt timp.');
  }
  res.redirect(listingUrl(l));
});

r.get('/vanzator/:id', async (req, res, next) => {
  if (!UUID.test(req.params.id)) return next();
  const sb = req.sb;
  const s = must(await sb.from('seller_stats').select('*').eq('id', req.params.id).maybeSingle());
  if (!s || s.banned) return next();
  const [result, reviews] = await Promise.all([
    m.searchListings(sb, { seller: s.id, sort: req.query.sortare }, { page: req.query.pagina, perPage: 12, userId: req.user ? req.user.id : null }),
    sb.from('reviews').select('*, author:profiles!reviews_author_id_fkey(name)').eq('seller_id', s.id)
      .order('created_at', { ascending: false }).limit(30).then(must),
  ]);
  reviews.forEach((rv) => { rv.author_name = rv.author ? rv.author.name : 'Utilizator'; });
  let canReview = false;
  let myReview = null;
  if (req.user && req.user.id !== s.id) {
    const [c, mine] = await Promise.all([
      sb.from('conversations').select('id').eq('seller_id', s.id).eq('buyer_id', req.user.id).limit(1).then(must),
      sb.from('reviews').select('*').eq('seller_id', s.id).eq('author_id', req.user.id).maybeSingle().then(must),
    ]);
    canReview = c.length > 0;
    myReview = mine;
  }
  res.render('seller', {
    title: s.company_name || s.name, s, ...result, reviews,
    stats: { rating: s.rating ? Number(s.rating) : 0, reviews: s.reviews, active: s.active },
    canReview, myReview,
  });
});

r.post('/vanzator/:id/recenzie', requireAuth, async (req, res, next) => {
  const sid = req.params.id;
  if (!UUID.test(sid)) return next();
  const rating = parseInt(req.body.rating, 10);
  if (sid === req.user.id) {
    flash(req, 'error', 'Nu îți poți lăsa singur o recenzie.');
  } else if (!(rating >= 1 && rating <= 5)) {
    flash(req, 'error', 'Alege un număr de stele între 1 și 5.');
  } else {
    const body = (req.body.body || '').toString().trim().slice(0, 800) || null;
    const existing = must(await req.sb.from('reviews').select('id').eq('seller_id', sid).eq('author_id', req.user.id).maybeSingle());
    const { error } = existing
      ? await req.sb.from('reviews').update({ rating, body, created_at: new Date().toISOString() }).eq('id', existing.id)
      : await req.sb.from('reviews').insert({ seller_id: sid, author_id: req.user.id, rating, body });
    // RLS permite recenzia doar dacă ai discutat cu vânzătorul
    if (error) flash(req, 'error', 'Poți lăsa o recenzie doar vânzătorilor cu care ai discutat.');
    else flash(req, 'success', 'Recenzia a fost salvată. Mulțumim!');
  }
  res.redirect(`/vanzator/${sid}#recenzii`);
});

r.get('/calculator', (req, res) => res.render('calculator', { title: 'Calculator materiale de construcții', description: 'Calculează rapid câte materiale îți trebuie pentru zidărie, beton, tencuială, gresie, vopsit sau izolație.' }));
r.get('/cum-functioneaza', (req, res) => res.render('how', { title: 'Cum funcționează', safetyTips }));
r.get('/despre-noi', async (req, res) => res.render('about', { title: 'Despre noi', stats: await m.siteStats(req.sb) }));
r.get('/siguranta', (req, res) => res.render('safety', { title: 'Sfaturi de siguranță', safetyTips }));
r.get('/intrebari-frecvente', (req, res) => res.render('faq', { title: 'Întrebări frecvente', faq }));
r.get('/termeni', (req, res) => res.render('legal', { title: 'Termeni și condiții', doc: 'termeni' }));
r.get('/confidentialitate', (req, res) => res.render('legal', { title: 'Politica de confidențialitate', doc: 'confidentialitate' }));

r.get('/contact', (req, res) => res.render('contact', { title: 'Contact', form: {}, errors: {} }));
r.post('/contact', requireAuth, async (req, res) => {
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
  must(await req.sb.from('contact_messages').insert({ ...form, subject: form.subject || null, user_id: req.user.id }));
  flash(req, 'success', 'Mesajul a fost trimis. Îți răspundem în maximum o zi lucrătoare.');
  res.redirect('/contact');
});

r.get('/blog', async (req, res) => {
  res.render('blog', { title: 'Ghiduri și noutăți', posts: must(await req.sb.from('posts').select('*').order('created_at', { ascending: false })) });
});
r.get('/blog/:slug', async (req, res, next) => {
  const post = must(await req.sb.from('posts').select('*').eq('slug', req.params.slug).maybeSingle());
  if (!post) return next();
  const more = must(await req.sb.from('posts').select('*').neq('id', post.id).order('created_at', { ascending: false }).limit(3));
  res.render('post', { title: post.title, description: post.excerpt, post, ogImage: post.image, more });
});

r.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /cont\nDisallow: /admin\nSitemap: /sitemap.xml\n');
});

r.get('/sitemap.xml', async (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  const [posts, listings] = await Promise.all([
    req.sb.from('posts').select('slug').then(must),
    req.sb.from('listings').select('id, slug').eq('status', 'activ').order('id', { ascending: false }).limit(5000).then(must),
  ]);
  const urls = ['/', '/anunturi', '/materiale', '/utilaje', '/scule', '/categorii', '/calculator', '/cum-functioneaza', '/despre-noi', '/blog', '/contact', '/intrebari-frecvente']
    .concat(categories.map((c) => `/categorie/${c.slug}`))
    .concat(posts.map((p) => `/blog/${p.slug}`))
    .concat(listings.map(listingUrl));
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join('')}</urlset>`);
});

module.exports = r;
