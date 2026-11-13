// Contul utilizatorului: anunțuri, favorite, mesaje, setări (toate necesită cont)
const express = require('express');
const m = require('../models');
const { must } = require('../supabase');
const { catMap, counties, unitMap, conditionMap, deliveryMap, rentableGroups } = require('../data');
const { flash, requireAuth, checkCsrf } = require('../middleware');
const { handleUpload, storeFiles, removeFiles } = require('../upload');
const { listingUrl, slugify } = require('../helpers');

const r = express.Router();
const MAX_IMAGES = 8;
const csrfFail = (res) => res.status(403).render('error', { title: 'Sesiune expirată', code: 403, message: 'Formularul a expirat. Reîncarcă pagina și încearcă din nou.' });

// ---------- Panou ----------
r.get('/cont', requireAuth, async (req, res) => {
  const uid = req.user.id;
  const [{ counts, views }, favs, listings, convs] = await Promise.all([
    m.myStatusCounts(req.sb, uid),
    req.sb.from('favorites').select('listing_id', { count: 'exact', head: true }),
    m.myListings(req.sb, uid, { limit: 5 }),
    m.conversationList(req.sb, uid),
  ]);
  res.render('account/dashboard', { title: 'Contul meu', counts, views, favs: favs.count || 0, listings, convs: convs.slice(0, 4), tab: 'panou' });
});

r.get('/cont/anunturi', requireAuth, async (req, res) => {
  const status = ['activ', 'vandut', 'inactiv', 'blocat'].includes(req.query.status) ? req.query.status : 'activ';
  const [listings, { counts }] = await Promise.all([
    m.myListings(req.sb, req.user.id, { status }),
    m.myStatusCounts(req.sb, req.user.id),
  ]);
  res.render('account/listings', { title: 'Anunțurile mele', listings, status, counts, tab: 'anunturi' });
});

// ---------- Adăugare / editare anunț ----------
function parseListing(body) {
  const num = (v) => {
    const n = parseFloat(String(v || '').replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const d = {
    title: (body.title || '').trim().replace(/\s+/g, ' ').slice(0, 90),
    category: catMap[body.category] ? body.category : '',
    description: (body.description || '').trim().slice(0, 5000),
    price_type: ['fix', 'negociabil', 'gratuit', 'cerere'].includes(body.price_type) ? body.price_type : 'fix',
    price: num(body.price),
    unit: unitMap[body.unit] ? body.unit : 'buc',
    quantity: num(body.quantity),
    condition: conditionMap[body.condition] ? body.condition : 'nou',
    county: counties.includes(body.county) ? body.county : '',
    city: (body.city || '').trim().slice(0, 60),
    delivery: deliveryMap[body.delivery] ? body.delivery : 'ridicare',
    delivery_note: (body.delivery_note || '').trim().slice(0, 300),
    listing_type: body.listing_type === 'inchiriere' ? 'inchiriere' : 'vanzare',
    brand: null, model: null, year: null, hours: null,
  };
  const grp = catMap[d.category] ? catMap[d.category].group : null;
  const errors = {};
  if (rentableGroups.includes(grp)) {
    d.brand = (body.brand || '').trim().slice(0, 60) || null;
    d.model = (body.model || '').trim().slice(0, 60) || null;
    const y = parseInt(body.year, 10);
    const h = parseInt(String(body.hours || '').replace(/\D/g, ''), 10);
    const maxYear = new Date().getFullYear() + 1;
    if (body.year && !(y >= 1950 && y <= maxYear)) errors.year = `Anul fabricației trebuie să fie între 1950 și ${maxYear}.`;
    else d.year = Number.isFinite(y) ? y : null;
    d.hours = grp === 'utilaje' && Number.isFinite(h) ? h : null;
  } else {
    d.listing_type = 'vanzare';
  }
  if (d.price_type === 'gratuit' || d.price_type === 'cerere') d.price = 0;
  if (d.title.length < 8) errors.title = 'Titlul trebuie să aibă cel puțin 8 caractere. Ex: „BCA 25 cm Ytong – 2 paleți”.';
  if (!d.category) errors.category = 'Alege categoria potrivită.';
  if (d.description.length < 30) errors.description = 'Descrierea trebuie să aibă cel puțin 30 de caractere. Spune starea, dimensiunile și cantitatea.';
  if (d.price_type !== 'gratuit' && d.price_type !== 'cerere' && !(d.price > 0)) errors.price = 'Scrie un preț mai mare de 0 sau alege „Gratuit” ori „Preț la cerere”.';
  if (d.price > 10000000) errors.price = 'Prețul pare prea mare. Verifică valoarea.';
  if (d.quantity !== null && d.quantity < 0) errors.quantity = 'Cantitatea nu poate fi negativă.';
  if (!d.county) errors.county = 'Alege județul.';
  if (d.city.length < 2) errors.city = 'Scrie localitatea de unde se ridică marfa.';
  return { d, errors };
}

function formDefaults(user) {
  return { county: user.county, city: user.city, unit: 'buc', condition: 'nou', price_type: 'fix', delivery: 'ridicare', listing_type: 'vanzare' };
}

r.get('/adauga-anunt', requireAuth, (req, res) => {
  const form = formDefaults(req.user);
  if (catMap[req.query.categorie]) form.category = req.query.categorie;
  if (req.query.tip === 'inchiriere') { form.listing_type = 'inchiriere'; form.unit = 'zi'; }
  res.render('account/listing-form', { title: 'Adaugă anunț', form, errors: {}, imgs: [], editing: null, maxImages: MAX_IMAGES });
});

r.post('/adauga-anunt', requireAuth, handleUpload('images', MAX_IMAGES), async (req, res) => {
  if (!checkCsrf(req)) return csrfFail(res);
  const { d, errors } = parseListing(req.body);
  const files = req.files || [];
  if (req.uploadError) errors.images = req.uploadError;
  else if (!files.length) errors.images = 'Adaugă cel puțin o fotografie. Anunțurile cu poze primesc de 5 ori mai multe mesaje.';
  if (Object.keys(errors).length) {
    return res.status(422).render('account/listing-form', { title: 'Adaugă anunț', form: { ...req.body, ...d }, errors, imgs: [], editing: null, maxImages: MAX_IMAGES });
  }
  const stored = await storeFiles(req.sb, req.user.id, files);
  let id;
  try {
    id = await m.createListing(req.sb, req.user.id, d);
    await m.addImages(req.sb, id, stored);
  } catch (e) {
    await removeFiles(req.sb, stored.map((s) => s.storagePath));
    if (id) await req.sb.from('listings').delete().eq('id', id);
    throw e;
  }
  flash(req, 'success', 'Anunțul tău a fost publicat! Îl găsești mai jos, exact cum îl văd cumpărătorii.');
  res.redirect(listingUrl({ id, slug: slugify(d.title) }));
});

async function ownListing(req, res, next) {
  const l = must(await req.sb.from('listings').select('*').eq('id', Number(req.params.id)).maybeSingle());
  if (!l || (l.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).render('error', { title: 'Anunț inexistent', code: 404, message: 'Anunțul nu există sau nu îți aparține.' });
  }
  req.listing = l;
  next();
}

r.get('/cont/anunturi/:id/editeaza', requireAuth, ownListing, async (req, res) => {
  res.render('account/listing-form', { title: 'Editează anunțul', form: req.listing, errors: {}, imgs: await m.listingImages(req.sb, req.listing.id), editing: req.listing, maxImages: MAX_IMAGES });
});

r.post('/cont/anunturi/:id/editeaza', requireAuth, ownListing, handleUpload('images', MAX_IMAGES), async (req, res) => {
  if (!checkCsrf(req)) return csrfFail(res);
  const l = req.listing;
  const { d, errors } = parseListing(req.body);
  const files = req.files || [];
  const current = await m.listingImages(req.sb, l.id);
  const remove = [].concat(req.body.remove_images || []).map(Number);
  const remaining = current.filter((i) => !remove.includes(i.id));
  if (req.uploadError) errors.images = req.uploadError;
  if (remaining.length + files.length === 0) errors.images = 'Anunțul trebuie să aibă cel puțin o fotografie.';
  if (remaining.length + files.length > MAX_IMAGES) errors.images = `Poți avea maximum ${MAX_IMAGES} fotografii. Șterge câteva înainte să adaugi altele.`;
  if (Object.keys(errors).length) {
    return res.status(422).render('account/listing-form', { title: 'Editează anunțul', form: { ...l, ...d }, errors, imgs: current, editing: l, maxImages: MAX_IMAGES });
  }
  const stored = await storeFiles(req.sb, req.user.id, files);
  await m.updateListing(req.sb, l.id, d);
  const removed = current.filter((i) => remove.includes(i.id));
  if (removed.length) {
    must(await req.sb.from('listing_images').delete().in('id', removed.map((i) => i.id)));
    await removeFiles(req.sb, removed.map((i) => i.storage_path));
  }
  await m.addImages(req.sb, l.id, stored);
  const cover = Number(req.body.cover);
  if (cover && remaining.some((i) => i.id === cover)) {
    const ordered = [cover, ...remaining.filter((i) => i.id !== cover).map((i) => i.id)];
    await Promise.all(ordered.map((imgId, pos) => req.sb.from('listing_images').update({ position: pos }).eq('id', imgId)));
  }
  flash(req, 'success', 'Modificările au fost salvate.');
  res.redirect(listingUrl({ id: l.id, slug: slugify(d.title) }));
});

r.post('/cont/anunturi/:id/status', requireAuth, ownListing, async (req, res) => {
  const map = { activ: 'Anunțul este din nou activ.', vandut: 'Felicitări pentru vânzare! Anunțul a fost marcat ca vândut.', inactiv: 'Anunțul a fost dezactivat. Îl poți reactiva oricând.' };
  const s = req.body.status;
  if (!map[s] || req.listing.status === 'blocat') {
    flash(req, 'error', 'Starea anunțului nu poate fi schimbată.');
  } else {
    must(await req.sb.from('listings').update({ status: s, updated_at: new Date().toISOString() }).eq('id', req.listing.id));
    flash(req, 'success', map[s]);
  }
  res.redirect(req.body.back === 'listing' ? listingUrl(req.listing) : `/cont/anunturi?status=${s}`);
});

r.post('/cont/anunturi/:id/sterge', requireAuth, ownListing, async (req, res) => {
  const imgs = await m.listingImages(req.sb, req.listing.id);
  must(await req.sb.from('listings').delete().eq('id', req.listing.id));
  await removeFiles(req.sb, imgs.map((i) => i.storage_path));
  flash(req, 'success', 'Anunțul a fost șters definitiv.');
  res.redirect('/cont/anunturi');
});

// ---------- Favorite ----------
r.post('/favorite/:id', requireAuth, async (req, res) => {
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const id = Number(req.params.id);
  const exists = must(await req.sb.from('favorites').select('listing_id').eq('listing_id', id).maybeSingle());
  const { error } = exists
    ? await req.sb.from('favorites').delete().eq('listing_id', id).eq('user_id', req.user.id)
    : await req.sb.from('favorites').insert({ listing_id: id, user_id: req.user.id });
  if (error) return wantsJson ? res.status(400).json({ error: 'Nu am putut salva.' }) : res.redirect(req.get('referer') || '/');
  if (wantsJson) return res.json({ fav: !exists });
  res.redirect(req.get('referer') || '/cont/favorite');
});

r.get('/cont/favorite', requireAuth, async (req, res) => {
  const favs = must(await req.sb.from('favorites').select('listing_id').order('created_at', { ascending: false }));
  let rows = [];
  if (favs.length) {
    const ids = favs.map((f) => f.listing_id);
    rows = must(await req.sb.from('listing_cards').select('*').in('id', ids).neq('status', 'blocat'));
    rows.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    rows.forEach((x) => { x.is_fav = true; });
  }
  res.render('account/favorites', { title: 'Anunțuri salvate', rows, tab: 'favorite' });
});

// ---------- Mesaje ----------
r.post('/anunt/:id/mesaj', requireAuth, async (req, res, next) => {
  const l = await m.getListing(req.sb, req.params.id);
  if (!l) return next();
  const body = (req.body.body || '').trim().slice(0, 2000);
  if (l.user_id === req.user.id) {
    flash(req, 'error', 'Nu îți poți trimite mesaje la propriul anunț.');
    return res.redirect(listingUrl(l));
  }
  if (l.status !== 'activ') {
    flash(req, 'error', 'Anunțul nu mai este activ.');
    return res.redirect(listingUrl(l));
  }
  if (body.length < 2) {
    flash(req, 'error', 'Scrie un mesaj pentru vânzător.');
    return res.redirect(listingUrl(l) + '#contact');
  }
  let c = must(await req.sb.from('conversations').select('id').eq('listing_id', l.id).eq('buyer_id', req.user.id).maybeSingle());
  if (!c) c = must(await req.sb.from('conversations').insert({ listing_id: l.id, buyer_id: req.user.id, seller_id: l.user_id }).select('id').single());
  must(await req.sb.from('messages').insert({ conversation_id: c.id, sender_id: req.user.id, body }));
  flash(req, 'success', 'Mesajul a fost trimis. Vei primi răspunsul aici, în conversație.');
  res.redirect(`/cont/mesaje/${c.id}`);
});

r.get('/cont/mesaje', requireAuth, async (req, res) => {
  res.render('account/messages', { title: 'Mesaje', convs: await m.conversationList(req.sb, req.user.id), active: null, msgs: [], tab: 'mesaje' });
});

async function loadConv(req, res, next) {
  const c = must(await req.sb.from('conversation_overview').select('*').eq('id', Number(req.params.id)).maybeSingle());
  if (!c) return res.status(404).render('error', { title: 'Conversație inexistentă', code: 404, message: 'Conversația nu există.' });
  c.lid = c.listing_id;
  req.conv = c;
  next();
}

async function markRead(sb, convId, uid) {
  await sb.from('messages').update({ read_at: new Date().toISOString() })
    .eq('conversation_id', convId).neq('sender_id', uid).is('read_at', null);
}

r.get('/cont/mesaje/:id', requireAuth, loadConv, async (req, res) => {
  await markRead(req.sb, req.conv.id, req.user.id);
  const [msgs, convs, unread] = await Promise.all([
    req.sb.from('messages').select('*').eq('conversation_id', req.conv.id).order('id').then(must),
    m.conversationList(req.sb, req.user.id),
    m.unreadCount(req.sb, req.user.id),
  ]);
  res.locals.unread = unread;
  res.render('account/messages', { title: 'Mesaje', convs, active: req.conv, msgs, tab: 'mesaje' });
});

r.get('/cont/mesaje/:id/noi', requireAuth, loadConv, async (req, res) => {
  const after = Number(req.query.dupa) || 0;
  const msgs = must(await req.sb.from('messages').select('id, sender_id, body, created_at').eq('conversation_id', req.conv.id).gt('id', after).order('id'));
  if (msgs.length) await markRead(req.sb, req.conv.id, req.user.id);
  res.json({ messages: msgs, me: req.user.id });
});

r.post('/cont/mesaje/:id', requireAuth, loadConv, async (req, res) => {
  const body = (req.body.body || '').trim().slice(0, 2000);
  const wantsJson = (req.get('accept') || '').includes('application/json');
  if (body.length < 1) {
    if (wantsJson) return res.status(422).json({ error: 'Mesajul este gol.' });
    return res.redirect(`/cont/mesaje/${req.conv.id}`);
  }
  const msg = must(await req.sb.from('messages').insert({ conversation_id: req.conv.id, sender_id: req.user.id, body })
    .select('id, sender_id, body, created_at').single());
  if (wantsJson) return res.json({ message: msg });
  res.redirect(`/cont/mesaje/${req.conv.id}#ultimul`);
});

// ---------- Setări ----------
r.get('/cont/setari', requireAuth, (req, res) => {
  res.render('account/settings', { title: 'Setări cont', form: req.user, errors: {}, tab: 'setari' });
});

r.post('/cont/setari', requireAuth, handleUpload('avatar', 1), async (req, res) => {
  if (!checkCsrf(req)) return csrfFail(res);
  const b = req.body;
  const form = {
    ...req.user,
    name: (b.name || '').trim().slice(0, 80),
    phone: (b.phone || '').replace(/[^\d+ ]/g, '').trim().slice(0, 20),
    county: counties.includes(b.county) ? b.county : '',
    city: (b.city || '').trim().slice(0, 60),
    account_type: b.account_type === 'firma' ? 'firma' : 'persoana',
    company_name: (b.company_name || '').trim().slice(0, 120),
    cui: (b.cui || '').replace(/\s/g, '').toUpperCase().slice(0, 14),
    about: (b.about || '').trim().slice(0, 1000),
  };
  const errors = {};
  if (form.name.length < 2) errors.name = 'Scrie numele tău.';
  if (form.phone.replace(/\D/g, '').length < 9) errors.phone = 'Numărul de telefon trebuie să aibă cel puțin 9 cifre.';
  if (!form.county) errors.county = 'Alege județul.';
  if (form.city.length < 2) errors.city = 'Scrie localitatea.';
  if (form.account_type === 'firma') {
    if (form.company_name.length < 2) errors.company_name = 'Scrie denumirea firmei.';
    if (!/^(RO)?\d{2,10}$/.test(form.cui)) errors.cui = 'CUI-ul trebuie să conțină între 2 și 10 cifre.';
  }
  if (req.uploadError) errors.avatar = req.uploadError;
  if (Object.keys(errors).length) {
    return res.status(422).render('account/settings', { title: 'Setări cont', form, errors, tab: 'setari' });
  }
  let avatar = req.user.avatar_url;
  if (req.file) {
    const [stored] = await storeFiles(req.sb, req.user.id, [req.file]);
    avatar = stored.url;
  } else if (b.remove_avatar) {
    avatar = null;
  }
  must(await req.sb.from('profiles').update({
    name: form.name, county: form.county, city: form.city, account_type: form.account_type,
    company_name: form.account_type === 'firma' ? form.company_name : null,
    cui: form.account_type === 'firma' ? form.cui : null,
    about: form.about || null, avatar_url: avatar,
  }).eq('id', req.user.id));
  must(await req.sb.from('profile_contacts').update({ phone: form.phone }).eq('user_id', req.user.id));
  flash(req, 'success', 'Profilul a fost actualizat.');
  res.redirect('/cont/setari');
});

r.post('/cont/parola', requireAuth, async (req, res) => {
  const { error: badCurrent } = await req.sb.auth.signInWithPassword({ email: req.user.email, password: req.body.current || '' });
  if (badCurrent) {
    flash(req, 'error', 'Parola actuală nu este corectă.');
  } else if ((req.body.password || '').length < 8) {
    flash(req, 'error', 'Parola nouă trebuie să aibă cel puțin 8 caractere.');
  } else if (req.body.password !== req.body.password2) {
    flash(req, 'error', 'Parolele noi nu coincid.');
  } else {
    const { error } = await req.sb.auth.updateUser({ password: req.body.password });
    if (error) flash(req, 'error', 'Parola nu a putut fi schimbată: ' + error.message);
    else flash(req, 'success', 'Parola a fost schimbată.');
  }
  res.redirect('/cont/setari#parola');
});

r.post('/cont/sterge-cont', requireAuth, async (req, res) => {
  if (req.user.role === 'admin') {
    flash(req, 'error', 'Contul de administrator nu poate fi șters de aici.');
    return res.redirect('/cont/setari');
  }
  const { error: badPassword } = await req.sb.auth.signInWithPassword({ email: req.user.email, password: req.body.password || '' });
  if (badPassword) {
    flash(req, 'error', 'Parola nu este corectă. Contul nu a fost șters.');
    return res.redirect('/cont/setari#sterge');
  }
  // Fișierele din folderul utilizatorului, apoi contul (cascada șterge anunțurile, mesajele etc.)
  const { data: files } = await req.sb.storage.from('listing-images').list(req.user.id, { limit: 1000 });
  await removeFiles(req.sb, (files || []).map((f) => `${req.user.id}/${f.name}`));
  must(await req.sb.rpc('delete_my_account'));
  await req.sb.auth.signOut();
  req.session = null;
  res.redirect('/?cont=sters');
});

module.exports = r;
