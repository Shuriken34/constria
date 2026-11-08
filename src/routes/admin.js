// Panou de administrare (moderare)
const express = require('express');
const { get, all, run } = require('../db');
const { requireAdmin, flash } = require('../middleware');
const { removeFile } = require('../upload');

const r = express.Router();
r.use(requireAdmin);

r.get('/', (req, res) => {
  const stats = {
    users: get('SELECT COUNT(*) AS n FROM users').n,
    listings: get("SELECT COUNT(*) AS n FROM listings WHERE status='activ'").n,
    reports: get('SELECT COUNT(*) AS n FROM reports WHERE resolved = 0').n,
    contacts: get('SELECT COUNT(*) AS n FROM contact_messages WHERE handled = 0').n,
    messages: get('SELECT COUNT(*) AS n FROM messages').n,
    today: get("SELECT COUNT(*) AS n FROM listings WHERE created_at >= datetime('now','-1 day')").n,
  };
  const reports = all(`SELECT r.*, l.title, l.slug, l.status AS listing_status, u.name AS reporter
    FROM reports r JOIN listings l ON l.id = r.listing_id LEFT JOIN users u ON u.id = r.user_id
    WHERE r.resolved = 0 ORDER BY r.created_at DESC LIMIT 50`);
  const contacts = all('SELECT * FROM contact_messages WHERE handled = 0 ORDER BY created_at DESC LIMIT 30');
  res.render('admin/index', { title: 'Administrare', stats, reports, contacts, section: 'panou' });
});

r.get('/anunturi', (req, res) => {
  const qq = (req.query.q || '').toString().trim();
  const rows = all(`SELECT l.*, u.name AS seller_name, u.email AS seller_email FROM listings l JOIN users u ON u.id = l.user_id
    ${qq ? 'WHERE l.title LIKE ? OR u.email LIKE ?' : ''} ORDER BY l.created_at DESC LIMIT 200`, ...(qq ? [`%${qq}%`, `%${qq}%`] : []));
  res.render('admin/listings', { title: 'Administrare anunțuri', rows, q: qq, section: 'anunturi' });
});

r.post('/anunturi/:id', (req, res) => {
  const id = Number(req.params.id);
  const a = req.body.action;
  if (a === 'blocheaza') run("UPDATE listings SET status='blocat' WHERE id=?", id);
  else if (a === 'activeaza') run("UPDATE listings SET status='activ' WHERE id=?", id);
  else if (a === 'promoveaza') run('UPDATE listings SET featured = 1 - featured WHERE id=?', id);
  else if (a === 'sterge') {
    const imgs = all('SELECT path FROM listing_images WHERE listing_id = ?', id);
    run('DELETE FROM listings WHERE id=?', id);
    imgs.forEach((i) => removeFile(i.path));
  }
  flash(req, 'success', 'Acțiunea a fost aplicată.');
  res.redirect(req.get('referer') || '/admin/anunturi');
});

r.get('/utilizatori', (req, res) => {
  const qq = (req.query.q || '').toString().trim();
  const rows = all(`SELECT u.*, (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id) AS listing_count FROM users u
    ${qq ? 'WHERE u.name LIKE ? OR u.email LIKE ? OR u.company_name LIKE ?' : ''} ORDER BY u.created_at DESC LIMIT 200`, ...(qq ? [`%${qq}%`, `%${qq}%`, `%${qq}%`] : []));
  res.render('admin/users', { title: 'Administrare utilizatori', rows, q: qq, section: 'utilizatori' });
});

r.post('/utilizatori/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) {
    flash(req, 'error', 'Nu poți aplica această acțiune propriului cont.');
    return res.redirect('/admin/utilizatori');
  }
  const a = req.body.action;
  if (a === 'suspenda') run('UPDATE users SET banned = 1 WHERE id = ?', id);
  else if (a === 'reactiveaza') run('UPDATE users SET banned = 0 WHERE id = ?', id);
  else if (a === 'verifica') run('UPDATE users SET verified = 1 - verified WHERE id = ?', id);
  flash(req, 'success', 'Utilizatorul a fost actualizat.');
  res.redirect(req.get('referer') || '/admin/utilizatori');
});

r.post('/rapoarte/:id', (req, res) => {
  run('UPDATE reports SET resolved = 1 WHERE id = ?', Number(req.params.id));
  flash(req, 'success', 'Raportarea a fost marcată ca rezolvată.');
  res.redirect('/admin');
});

r.post('/contact/:id', (req, res) => {
  run('UPDATE contact_messages SET handled = 1 WHERE id = ?', Number(req.params.id));
  flash(req, 'success', 'Mesajul a fost marcat ca rezolvat.');
  res.redirect('/admin');
});

module.exports = r;
