// Contul utilizatorului: anunțuri, favorite, mesaje, setări
const express = require('express');
const bcrypt = require('bcryptjs');
const { get, all, run, tx } = require('../db');
const m = require('../models');
const { catMap, counties, unitMap, conditionMap, deliveryMap, rentableGroups } = require('../data');
const { flash, requireAuth, checkCsrf } = require('../middleware');
const { handleUpload, removeFile } = require('../upload');
const { listingUrl } = require('../helpers');

const r = express.Router();
const MAX_IMAGES = 8;

function csrfFail(req, res) {
  (req.files || []).forEach((f) => removeFile(f.filename));
  if (req.file) removeFile(req.file.filename);
  return res.status(403).render('error', { title: 'Sesiune expirată', code: 403, message: 'Formularul a expirat. Reîncarcă pagina și încearcă din nou.' });
}

// ---------- Panou ----------
r.get('/cont', requireAuth, (req, res) => {
  const uid = req.user.id;
  const counts = Object.fromEntries(all('SELECT status, COUNT(*) AS n FROM listings WHERE user_id = ? GROUP BY status', uid).map((x) => [x.status, x.n]));
  const views = get('SELECT COALESCE(SUM(views),0) AS n FROM listings WHERE user_id = ?', uid).n;
  const favs = get('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?', uid).n;
  const listings = all(
    `SELECT l.*, (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover,
       (SELECT COUNT(*) FROM favorites f WHERE f.listing_id = l.id) AS fav_count,
       (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS conv_count
     FROM listings l WHERE l.user_id = ? ORDER BY l.updated_at DESC LIMIT 5`, uid,
  );
  const convs = conversationList(uid).slice(0, 4);
  res.render('account/dashboard', { title: 'Contul meu', counts, views, favs, listings, convs, tab: 'panou' });
});

r.get('/cont/anunturi', requireAuth, (req, res) => {
  const status = ['activ', 'vandut', 'inactiv', 'blocat'].includes(req.query.status) ? req.query.status : 'activ';
  const listings = all(
    `SELECT l.*, (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover,
       (SELECT COUNT(*) FROM favorites f WHERE f.listing_id = l.id) AS fav_count,
       (SELECT COUNT(*) FROM conversations c WHERE c.listing_id = l.id) AS conv_count
     FROM listings l WHERE l.user_id = ? AND l.status = ? ORDER BY l.updated_at DESC`, req.user.id, status,
  );
  const counts = Object.fromEntries(all('SELECT status, COUNT(*) AS n FROM listings WHERE user_id = ? GROUP BY status', req.user.id).map((x) => [x.status, x.n]));
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
    price_type: ['fix', 'negociabil', 'gratuit'].includes(body.price_type) ? body.price_type : 'fix',
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
  const isMachine = rentableGroups.includes(grp);
  const errors = {};
  if (isMachine) {
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
  if (d.price_type === 'gratuit') d.price = 0;
  if (d.title.length < 8) errors.title = 'Titlul trebuie să aibă cel puțin 8 caractere. Ex: „BCA 25 cm Ytong – 2 paleți”.';
  if (!d.category) errors.category = 'Alege categoria potrivită.';
  if (d.description.length < 30) errors.description = 'Descrierea trebuie să aibă cel puțin 30 de caractere. Spune starea, dimensiunile și cantitatea.';
  if (d.price_type !== 'gratuit' && !(d.price > 0)) errors.price = 'Scrie un preț mai mare de 0 sau alege „Gratuit”.';
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

r.post('/adauga-anunt', requireAuth, handleUpload('images', MAX_IMAGES), (req, res) => {
  if (!checkCsrf(req)) return csrfFail(req, res);
  const { d, errors } = parseListing(req.body);
  const files = req.files || [];
  if (req.uploadError) errors.images = req.uploadError;
  else if (!files.length) errors.images = 'Adaugă cel puțin o fotografie. Anunțurile cu poze primesc de 5 ori mai multe mesaje.';
  if (Object.keys(errors).length) {
    files.forEach((f) => removeFile(f.filename));
    return res.status(422).render('account/listing-form', { title: 'Adaugă anunț', form: { ...req.body, ...d }, errors, imgs: [], editing: null, maxImages: MAX_IMAGES });
  }
  const id = tx(() => {
    const newId = m.saveListing(req.user.id, d);
    m.addImages(newId, files.map((f) => '/uploads/' + f.filename));
    return newId;
  });
  const l = m.getListing(id);
  flash(req, 'success', 'Anunțul tău a fost publicat! Îl găsești mai jos, exact cum îl văd cumpărătorii.');
  res.redirect(listingUrl(l));
});

function ownListing(req, res, next) {
  const l = get('SELECT * FROM listings WHERE id = ?', Number(req.params.id));
  if (!l || (l.user_id !== req.user.id && req.user.role !== 'admin')) {
    return res.status(404).render('error', { title: 'Anunț inexistent', code: 404, message: 'Anunțul nu există sau nu îți aparține.' });
  }
  req.listing = l;
  next();
}

r.get('/cont/anunturi/:id/editeaza', requireAuth, ownListing, (req, res) => {
  res.render('account/listing-form', { title: 'Editează anunțul', form: req.listing, errors: {}, imgs: m.listingImages(req.listing.id), editing: req.listing, maxImages: MAX_IMAGES });
});

r.post('/cont/anunturi/:id/editeaza', requireAuth, ownListing, handleUpload('images', MAX_IMAGES), (req, res) => {
  if (!checkCsrf(req)) return csrfFail(req, res);
  const l = req.listing;
  const { d, errors } = parseListing(req.body);
  const files = req.files || [];
  const current = m.listingImages(l.id);
  const remove = [].concat(req.body.remove_images || []).map(Number);
  const remaining = current.filter((i) => !remove.includes(i.id));
  if (req.uploadError) errors.images = req.uploadError;
  if (remaining.length + files.length === 0) errors.images = 'Anunțul trebuie să aibă cel puțin o fotografie.';
  if (remaining.length + files.length > MAX_IMAGES) errors.images = `Poți avea maximum ${MAX_IMAGES} fotografii. Șterge câteva înainte să adaugi altele.`;
  if (Object.keys(errors).length) {
    files.forEach((f) => removeFile(f.filename));
    return res.status(422).render('account/listing-form', { title: 'Editează anunțul', form: { ...l, ...d }, errors, imgs: current, editing: l, maxImages: MAX_IMAGES });
  }
  tx(() => {
    m.saveListing(l.user_id, d, l.id);
    for (const img of current.filter((i) => remove.includes(i.id))) {
      run('DELETE FROM listing_images WHERE id = ?', img.id);
      removeFile(img.path);
    }
    m.addImages(l.id, files.map((f) => '/uploads/' + f.filename));
    const cover = Number(req.body.cover);
    if (cover && remaining.some((i) => i.id === cover)) {
      run('UPDATE listing_images SET position = position + 1 WHERE listing_id = ?', l.id);
      run('UPDATE listing_images SET position = 0 WHERE id = ?', cover);
    }
  });
  flash(req, 'success', 'Modificările au fost salvate.');
  res.redirect(listingUrl(m.getListing(l.id)));
});

r.post('/cont/anunturi/:id/status', requireAuth, ownListing, (req, res) => {
  const map = { activ: 'Anunțul este din nou activ.', vandut: 'Felicitări pentru vânzare! Anunțul a fost marcat ca vândut.', inactiv: 'Anunțul a fost dezactivat. Îl poți reactiva oricând.' };
  const s = req.body.status;
  if (!map[s] || req.listing.status === 'blocat') {
    flash(req, 'error', 'Starea anunțului nu poate fi schimbată.');
  } else {
    run("UPDATE listings SET status = ?, updated_at = datetime('now') WHERE id = ?", s, req.listing.id);
    flash(req, 'success', map[s]);
  }
  res.redirect(req.body.back === 'listing' ? listingUrl(req.listing) : `/cont/anunturi?status=${s === 'activ' ? 'activ' : s}`);
});

r.post('/cont/anunturi/:id/sterge', requireAuth, ownListing, (req, res) => {
  const imgs = m.listingImages(req.listing.id);
  run('DELETE FROM listings WHERE id = ?', req.listing.id);
  imgs.forEach((i) => removeFile(i.path));
  flash(req, 'success', 'Anunțul a fost șters definitiv.');
  res.redirect('/cont/anunturi');
});

// ---------- Favorite ----------
r.post('/favorite/:id', (req, res) => {
  const wantsJson = req.get('accept') && req.get('accept').includes('application/json');
  if (!req.user) {
    if (wantsJson) return res.status(401).json({ login: '/autentificare?next=' + encodeURIComponent(req.get('referer') ? new URL(req.get('referer')).pathname : '/') });
    return res.redirect('/autentificare');
  }
  const id = Number(req.params.id);
  if (!get('SELECT 1 FROM listings WHERE id = ?', id)) return res.status(404).json({ error: 'not found' });
  const exists = get('SELECT 1 FROM favorites WHERE user_id = ? AND listing_id = ?', req.user.id, id);
  if (exists) run('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?', req.user.id, id);
  else run('INSERT INTO favorites (user_id, listing_id) VALUES (?,?)', req.user.id, id);
  if (wantsJson) return res.json({ fav: !exists });
  res.redirect(req.get('referer') || '/cont/favorite');
});

r.get('/cont/favorite', requireAuth, (req, res) => {
  const rows = all(
    `SELECT l.*, u.name AS seller_name, u.company_name AS seller_company, u.account_type AS seller_type, 1 AS is_fav,
       (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover
     FROM favorites f JOIN listings l ON l.id = f.listing_id JOIN users u ON u.id = l.user_id
     WHERE f.user_id = ? AND l.status != 'blocat' ORDER BY f.created_at DESC`, req.user.id,
  );
  res.render('account/favorites', { title: 'Anunțuri salvate', rows, tab: 'favorite' });
});

// ---------- Mesaje ----------
function conversationList(uid) {
  return all(
    `SELECT c.*, l.title AS listing_title, l.slug AS listing_slug, l.price, l.price_type, l.unit, l.status AS listing_status,
       (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover,
       CASE WHEN c.buyer_id = ? THEN s.name ELSE b.name END AS other_name,
       CASE WHEN c.buyer_id = ? THEN s.company_name ELSE NULL END AS other_company,
       (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body,
       (SELECT sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_sender,
       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) AS unread
     FROM conversations c JOIN listings l ON l.id = c.listing_id
     JOIN users b ON b.id = c.buyer_id JOIN users s ON s.id = c.seller_id
     WHERE c.buyer_id = ? OR c.seller_id = ? ORDER BY c.updated_at DESC`,
    uid, uid, uid, uid, uid,
  );
}

r.post('/anunt/:id/mesaj', requireAuth, (req, res, next) => {
  const l = m.getListing(req.params.id);
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
  const convId = tx(() => {
    let c = get('SELECT id FROM conversations WHERE listing_id = ? AND buyer_id = ?', l.id, req.user.id);
    if (!c) {
      const info = run('INSERT INTO conversations (listing_id, buyer_id, seller_id) VALUES (?,?,?)', l.id, req.user.id, l.user_id);
      c = { id: Number(info.lastInsertRowid) };
    }
    run('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?,?,?)', c.id, req.user.id, body);
    run("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", c.id);
    return c.id;
  });
  flash(req, 'success', 'Mesajul a fost trimis. Vei primi răspunsul aici, în conversație.');
  res.redirect(`/cont/mesaje/${convId}`);
});

r.get('/cont/mesaje', requireAuth, (req, res) => {
  res.render('account/messages', { title: 'Mesaje', convs: conversationList(req.user.id), active: null, msgs: [], tab: 'mesaje' });
});

function loadConv(req, res, next) {
  const c = get(
    `SELECT c.*, l.title AS listing_title, l.slug AS listing_slug, l.id AS lid, l.price, l.price_type, l.unit, l.status AS listing_status,
       (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover,
       b.name AS buyer_name, s.name AS seller_name, s.company_name AS seller_company, s.phone AS seller_phone
     FROM conversations c JOIN listings l ON l.id = c.listing_id JOIN users b ON b.id = c.buyer_id JOIN users s ON s.id = c.seller_id
     WHERE c.id = ?`, Number(req.params.id),
  );
  if (!c || (c.buyer_id !== req.user.id && c.seller_id !== req.user.id)) {
    return res.status(404).render('error', { title: 'Conversație inexistentă', code: 404, message: 'Conversația nu există.' });
  }
  req.conv = c;
  next();
}

function markRead(convId, uid) {
  run("UPDATE messages SET read_at = datetime('now') WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL", convId, uid);
}

r.get('/cont/mesaje/:id', requireAuth, loadConv, (req, res) => {
  markRead(req.conv.id, req.user.id);
  res.locals.unread = m.unreadCount(req.user.id);
  const msgs = all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id', req.conv.id);
  res.render('account/messages', { title: 'Mesaje', convs: conversationList(req.user.id), active: req.conv, msgs, tab: 'mesaje' });
});

r.get('/cont/mesaje/:id/noi', requireAuth, loadConv, (req, res) => {
  const after = Number(req.query.dupa) || 0;
  const msgs = all('SELECT id, sender_id, body, created_at FROM messages WHERE conversation_id = ? AND id > ? ORDER BY id', req.conv.id, after);
  if (msgs.length) markRead(req.conv.id, req.user.id);
  res.json({ messages: msgs, me: req.user.id });
});

r.post('/cont/mesaje/:id', requireAuth, loadConv, (req, res) => {
  const body = (req.body.body || '').trim().slice(0, 2000);
  const wantsJson = (req.get('accept') || '').includes('application/json');
  if (body.length < 1) {
    if (wantsJson) return res.status(422).json({ error: 'Mesajul este gol.' });
    return res.redirect(`/cont/mesaje/${req.conv.id}`);
  }
  const info = run('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?,?,?)', req.conv.id, req.user.id, body);
  run("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?", req.conv.id);
  if (wantsJson) return res.json({ message: get('SELECT id, sender_id, body, created_at FROM messages WHERE id = ?', Number(info.lastInsertRowid)) });
  res.redirect(`/cont/mesaje/${req.conv.id}#ultimul`);
});

// ---------- Setări ----------
r.get('/cont/setari', requireAuth, (req, res) => {
  res.render('account/settings', { title: 'Setări cont', form: req.user, errors: {}, tab: 'setari' });
});

r.post('/cont/setari', requireAuth, handleUpload('avatar', 1), (req, res) => {
  if (!checkCsrf(req)) return csrfFail(req, res);
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
    if (req.file) removeFile(req.file.filename);
    return res.status(422).render('account/settings', { title: 'Setări cont', form, errors, tab: 'setari' });
  }
  let avatar = req.user.avatar;
  if (req.file) {
    removeFile(avatar);
    avatar = '/uploads/' + req.file.filename;
  }
  if (b.remove_avatar && !req.file) {
    removeFile(avatar);
    avatar = null;
  }
  run(`UPDATE users SET name=?, phone=?, county=?, city=?, account_type=?, company_name=?, cui=?, about=?, avatar=? WHERE id=?`,
    form.name, form.phone, form.county, form.city, form.account_type,
    form.account_type === 'firma' ? form.company_name : null, form.account_type === 'firma' ? form.cui : null,
    form.about, avatar, req.user.id);
  flash(req, 'success', 'Profilul a fost actualizat.');
  res.redirect('/cont/setari');
});

r.post('/cont/parola', requireAuth, (req, res) => {
  const u = get('SELECT password_hash FROM users WHERE id = ?', req.user.id);
  if (!bcrypt.compareSync(req.body.current || '', u.password_hash)) {
    flash(req, 'error', 'Parola actuală nu este corectă.');
  } else if ((req.body.password || '').length < 8) {
    flash(req, 'error', 'Parola nouă trebuie să aibă cel puțin 8 caractere.');
  } else if (req.body.password !== req.body.password2) {
    flash(req, 'error', 'Parolele noi nu coincid.');
  } else {
    run('UPDATE users SET password_hash = ? WHERE id = ?', bcrypt.hashSync(req.body.password, 10), req.user.id);
    flash(req, 'success', 'Parola a fost schimbată.');
  }
  res.redirect('/cont/setari#parola');
});

r.post('/cont/sterge-cont', requireAuth, (req, res) => {
  const u = get('SELECT password_hash, role FROM users WHERE id = ?', req.user.id);
  if (u.role === 'admin') {
    flash(req, 'error', 'Contul de administrator nu poate fi șters de aici.');
    return res.redirect('/cont/setari');
  }
  if (!bcrypt.compareSync(req.body.password || '', u.password_hash)) {
    flash(req, 'error', 'Parola nu este corectă. Contul nu a fost șters.');
    return res.redirect('/cont/setari#sterge');
  }
  const imgs = all('SELECT i.path FROM listing_images i JOIN listings l ON l.id = i.listing_id WHERE l.user_id = ?', req.user.id);
  run('DELETE FROM users WHERE id = ?', req.user.id);
  imgs.forEach((i) => removeFile(i.path));
  removeFile(req.user.avatar);
  req.session = null;
  res.redirect('/?cont=sters');
});

module.exports = r;
