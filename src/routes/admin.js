// Panou de administrare (moderare). Rolul de admin vine din app_metadata (Supabase Auth),
// iar regulile RLS permit aceste operații doar administratorului.
const express = require('express');
const { must } = require('../supabase');
const { requireAdmin, flash } = require('../middleware');
const { removeFiles } = require('../upload');

const r = express.Router();
r.use(requireAdmin);

const count = (q) => q.then((x) => x.count || 0);

r.get('/', async (req, res) => {
  const sb = req.sb;
  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const [users, listings, reportsN, contactsN, today, reports, contacts] = await Promise.all([
    count(sb.from('profiles').select('id', { count: 'exact', head: true })),
    count(sb.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'activ')),
    count(sb.from('reports').select('id', { count: 'exact', head: true }).eq('resolved', false)),
    count(sb.from('contact_messages').select('id', { count: 'exact', head: true }).eq('handled', false)),
    count(sb.from('listings').select('id', { count: 'exact', head: true }).gte('created_at', dayAgo)),
    sb.from('reports').select('*, listing:listings(title, slug, status), reporter:profiles!reports_user_id_fkey(name)')
      .eq('resolved', false).order('created_at', { ascending: false }).limit(50).then(must),
    sb.from('contact_messages').select('*').eq('handled', false).order('created_at', { ascending: false }).limit(30).then(must),
  ]);
  reports.forEach((x) => {
    x.title = x.listing ? x.listing.title : '(anunț șters)';
    x.slug = x.listing ? x.listing.slug : '';
    x.listing_status = x.listing ? x.listing.status : '';
    x.reporter = x.reporter ? x.reporter.name : 'Utilizator';
  });
  const stats = { users, listings, reports: reportsN, contacts: contactsN, today, messages: 0 };
  res.render('admin/index', { title: 'Administrare', stats, reports, contacts, section: 'panou' });
});

r.get('/anunturi', async (req, res) => {
  const qq = (req.query.q || '').toString().trim().replace(/[%_,()]/g, '');
  let q = req.sb.from('listing_cards').select('*').order('created_at', { ascending: false }).limit(200);
  if (qq) q = q.ilike('title', `%${qq}%`);
  const rows = must(await q);
  res.render('admin/listings', { title: 'Administrare anunțuri', rows, q: qq, section: 'anunturi' });
});

r.post('/anunturi/:id', async (req, res) => {
  const id = Number(req.params.id);
  const a = req.body.action;
  if (a === 'blocheaza') must(await req.sb.from('listings').update({ status: 'blocat' }).eq('id', id));
  else if (a === 'activeaza') must(await req.sb.from('listings').update({ status: 'activ' }).eq('id', id));
  else if (a === 'promoveaza') {
    const l = must(await req.sb.from('listings').select('featured').eq('id', id).single());
    must(await req.sb.rpc('admin_set_featured', { p_listing_id: id, p_featured: !l.featured }));
  } else if (a === 'sterge') {
    // Fișierele altor utilizatori nu pot fi șterse cu cheia publică; rămân în Storage până la curățare
    const imgs = must(await req.sb.from('listing_images').select('storage_path').eq('listing_id', id));
    must(await req.sb.from('listings').delete().eq('id', id));
    await removeFiles(req.sb, imgs.map((i) => i.storage_path));
  }
  flash(req, 'success', 'Acțiunea a fost aplicată.');
  res.redirect(req.get('referer') || '/admin/anunturi');
});

r.get('/utilizatori', async (req, res) => {
  const qq = (req.query.q || '').toString().trim().replace(/[%_,()]/g, '');
  let q = req.sb.from('seller_stats').select('*').order('created_at', { ascending: false }).limit(200);
  if (qq) q = q.or(`name.ilike.%${qq}%,company_name.ilike.%${qq}%`);
  const rows = must(await q);
  const contacts = rows.length ? must(await req.sb.from('profile_contacts').select('user_id, email').in('user_id', rows.map((x) => x.id))) : [];
  const emailMap = Object.fromEntries(contacts.map((c) => [c.user_id, c.email]));
  const counts = rows.length ? must(await req.sb.from('listings').select('user_id').in('user_id', rows.map((x) => x.id))) : [];
  const countMap = {};
  counts.forEach((c) => { countMap[c.user_id] = (countMap[c.user_id] || 0) + 1; });
  rows.forEach((x) => { x.email = emailMap[x.id] || ''; x.listing_count = countMap[x.id] || 0; x.role = x.id === req.user.id ? 'admin' : 'user'; });
  res.render('admin/users', { title: 'Administrare utilizatori', rows, q: qq, section: 'utilizatori' });
});

r.post('/utilizatori/:id', async (req, res) => {
  const id = req.params.id;
  if (id === req.user.id) {
    flash(req, 'error', 'Nu poți aplica această acțiune propriului cont.');
    return res.redirect('/admin/utilizatori');
  }
  const a = req.body.action;
  const u = must(await req.sb.from('profiles').select('verified').eq('id', id).maybeSingle());
  if (u) {
    const args = { p_user: id };
    if (a === 'suspenda') args.p_banned = true;
    else if (a === 'reactiveaza') args.p_banned = false;
    else if (a === 'verifica') args.p_verified = !u.verified;
    must(await req.sb.rpc('admin_set_profile_flags', args));
  }
  flash(req, 'success', 'Utilizatorul a fost actualizat.');
  res.redirect(req.get('referer') || '/admin/utilizatori');
});

r.post('/rapoarte/:id', async (req, res) => {
  must(await req.sb.from('reports').update({ resolved: true }).eq('id', Number(req.params.id)));
  flash(req, 'success', 'Raportarea a fost marcată ca rezolvată.');
  res.redirect('/admin');
});

r.post('/contact/:id', async (req, res) => {
  must(await req.sb.from('contact_messages').update({ handled: true }).eq('id', Number(req.params.id)));
  flash(req, 'success', 'Mesajul a fost marcat ca rezolvat.');
  res.redirect('/admin');
});

module.exports = r;
