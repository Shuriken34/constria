// Interogări reutilizabile
const { get, all, run, tx } = require('./db');
const { stripDiacritics, slugify } = require('./helpers');
const { catMap, catsByGroup, groupMap } = require('./data');

const LISTING_COLS = `l.*, u.name AS seller_name, u.account_type AS seller_type, u.company_name AS seller_company,
  u.verified AS seller_verified,
  (SELECT path FROM listing_images i WHERE i.listing_id = l.id ORDER BY position, id LIMIT 1) AS cover`;

function buildSearchText(l) {
  const cat = catMap[l.category];
  return stripDiacritics([l.title, l.description, cat ? cat.name : '', l.brand || '', l.model || '', l.listing_type === 'inchiriere' ? 'inchiriere inchiriez' : '', l.city, l.county].join(' '));
}

function searchListings(f = {}, { page = 1, perPage = 24, userId = null } = {}) {
  const where = ["l.status = 'activ'", 'u.banned = 0'];
  const params = [];
  if (f.q) {
    const words = stripDiacritics(f.q).split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    for (const w of words) {
      where.push('l.search_text LIKE ?');
      params.push(`%${w}%`);
    }
  }
  if (f.category && catMap[f.category]) { where.push('l.category = ?'); params.push(f.category); }
  else if (f.group && groupMap[f.group]) {
    const slugs = catsByGroup(f.group).map((c) => c.slug);
    where.push(`l.category IN (${slugs.map(() => '?').join(',')})`);
    params.push(...slugs);
  }
  if (f.type === 'vanzare' || f.type === 'inchiriere') { where.push('l.listing_type = ?'); params.push(f.type); }
  if (f.year_min) { where.push('l.year >= ?'); params.push(Number(f.year_min)); }
  if (f.county) { where.push('l.county = ?'); params.push(f.county); }
  if (f.city) { where.push('l.city LIKE ?'); params.push(`%${f.city}%`); }
  if (f.condition) { where.push('l.condition = ?'); params.push(f.condition); }
  if (f.seller_type) { where.push('u.account_type = ?'); params.push(f.seller_type); }
  if (f.delivery === 'livrare') where.push("l.delivery IN ('livrare','ambele')");
  if (f.min) { where.push('l.price >= ?'); params.push(Number(f.min)); }
  if (f.max) { where.push('l.price <= ?'); params.push(Number(f.max)); }
  if (f.free) where.push("l.price_type = 'gratuit'");
  if (f.seller) { where.push('l.user_id = ?'); params.push(Number(f.seller)); }

  const sorts = {
    recente: 'l.featured DESC, l.created_at DESC',
    noi: 'l.created_at DESC',
    pret_asc: "CASE WHEN l.price_type='gratuit' THEN 0 ELSE l.price END ASC, l.created_at DESC",
    pret_desc: 'l.price DESC, l.created_at DESC',
    populare: 'l.views DESC',
  };
  const order = sorts[f.sort] || sorts.recente;
  const whereSql = where.join(' AND ');
  const total = get(`SELECT COUNT(*) AS n FROM listings l JOIN users u ON u.id = l.user_id WHERE ${whereSql}`, ...params).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  page = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = all(
    `SELECT ${LISTING_COLS}${userId ? ', EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id = l.id AND f.user_id = ?) AS is_fav' : ''}
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE ${whereSql} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...(userId ? [userId] : []), ...params, perPage, (page - 1) * perPage,
  );
  return { rows, total, page, pages };
}

function getListing(id) {
  return get(
    `SELECT ${LISTING_COLS}, u.phone AS seller_phone, u.county AS seller_county, u.city AS seller_city,
       u.created_at AS seller_since, u.avatar AS seller_avatar, u.banned AS seller_banned
     FROM listings l JOIN users u ON u.id = l.user_id WHERE l.id = ?`,
    Number(id),
  );
}

function listingImages(id) {
  return all('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY position, id', Number(id));
}

function featuredListings(limit = 8, userId = null, group = null) {
  const slugs = group ? catsByGroup(group).map((c) => c.slug) : [];
  return all(
    `SELECT ${LISTING_COLS}${userId ? ', EXISTS(SELECT 1 FROM favorites f WHERE f.listing_id = l.id AND f.user_id = ?) AS is_fav' : ''}
     FROM listings l JOIN users u ON u.id = l.user_id
     WHERE l.status = 'activ' AND u.banned = 0 ${group ? `AND l.category IN (${slugs.map(() => '?').join(',')})` : ''}
     ORDER BY l.featured DESC, l.created_at DESC LIMIT ?`,
    ...(userId ? [userId] : []), ...slugs, limit,
  );
}

function similarListings(l, limit = 4) {
  return all(
    `SELECT ${LISTING_COLS} FROM listings l JOIN users u ON u.id = l.user_id
     WHERE l.status = 'activ' AND u.banned = 0 AND l.category = ? AND l.id != ?
     ORDER BY (l.county = ?) DESC, l.created_at DESC LIMIT ?`,
    l.category, l.id, l.county, limit,
  );
}

function categoryCounts() {
  const rows = all(`SELECT l.category, COUNT(*) AS n FROM listings l JOIN users u ON u.id = l.user_id
    WHERE l.status = 'activ' AND u.banned = 0 GROUP BY l.category`);
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}

function sellerStats(userId) {
  const r = get('SELECT COUNT(*) AS n, ROUND(AVG(rating), 1) AS avg FROM reviews WHERE seller_id = ?', userId);
  const active = get("SELECT COUNT(*) AS n FROM listings WHERE user_id = ? AND status = 'activ'", userId).n;
  return { reviews: r.n, rating: r.avg || 0, active };
}

function topSellers(limit = 5) {
  return all(
    `SELECT u.id, u.name, u.company_name, u.account_type, u.county, u.city, u.avatar, u.verified,
       (SELECT COUNT(*) FROM listings l WHERE l.user_id = u.id AND l.status = 'activ') AS active,
       (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.seller_id = u.id) AS rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.seller_id = u.id) AS reviews
     FROM users u WHERE u.banned = 0 AND u.role = 'user'
     ORDER BY reviews DESC, active DESC LIMIT ?`,
    limit,
  );
}

function saveListing(userId, data, id = null) {
  const row = {
    category: data.category, title: data.title, description: data.description,
    price: data.price, price_type: data.price_type, unit: data.unit, quantity: data.quantity,
    condition: data.condition, county: data.county, city: data.city, delivery: data.delivery,
    delivery_note: data.delivery_note || null,
    listing_type: data.listing_type || 'vanzare',
    brand: data.brand || null, model: data.model || null, year: data.year || null, hours: data.hours ?? null,
  };
  const slug = slugify(row.title);
  const st = buildSearchText(row);
  if (id) {
    run(
      `UPDATE listings SET category=?, title=?, slug=?, description=?, price=?, price_type=?, unit=?, quantity=?,
        condition=?, county=?, city=?, delivery=?, delivery_note=?, listing_type=?, brand=?, model=?, year=?, hours=?,
        search_text=?, updated_at=datetime('now')
       WHERE id=? AND user_id=?`,
      row.category, row.title, slug, row.description, row.price, row.price_type, row.unit, row.quantity,
      row.condition, row.county, row.city, row.delivery, row.delivery_note, row.listing_type, row.brand, row.model,
      row.year, row.hours, st, id, userId,
    );
    return id;
  }
  const r = run(
    `INSERT INTO listings (user_id, category, title, slug, description, price, price_type, unit, quantity,
      condition, county, city, delivery, delivery_note, listing_type, brand, model, year, hours, search_text)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    userId, row.category, row.title, slug, row.description, row.price, row.price_type, row.unit, row.quantity,
    row.condition, row.county, row.city, row.delivery, row.delivery_note, row.listing_type, row.brand, row.model,
    row.year, row.hours, st,
  );
  return Number(r.lastInsertRowid);
}

function addImages(listingId, paths) {
  const max = get('SELECT COALESCE(MAX(position), -1) AS m FROM listing_images WHERE listing_id = ?', listingId).m;
  paths.forEach((p, i) => run('INSERT INTO listing_images (listing_id, path, position) VALUES (?,?,?)', listingId, p, max + 1 + i));
}

function unreadCount(userId) {
  return get(
    `SELECT COUNT(*) AS n FROM messages m JOIN conversations c ON c.id = m.conversation_id
     WHERE (c.buyer_id = ? OR c.seller_id = ?) AND m.sender_id != ? AND m.read_at IS NULL`,
    userId, userId, userId,
  ).n;
}

function siteStats() {
  return {
    listings: get("SELECT COUNT(*) AS n FROM listings WHERE status='activ'").n,
    users: get('SELECT COUNT(*) AS n FROM users').n,
    sold: get("SELECT COUNT(*) AS n FROM listings WHERE status='vandut'").n,
  };
}

module.exports = {
  searchListings, getListing, listingImages, featuredListings, similarListings, categoryCounts,
  sellerStats, topSellers, saveListing, addImages, unreadCount, siteStats, buildSearchText, tx,
};
