// Acces la date prin Supabase. Toate funcțiile primesc clientul cererii (sb),
// deci respectă automat regulile RLS ale utilizatorului curent.
const { must } = require('./supabase');
const { stripDiacritics, slugify } = require('./helpers');
const { catMap, catsByGroup, groupMap } = require('./data');

function buildSearchText(l) {
  const cat = catMap[l.category];
  return stripDiacritics([l.title, l.description, cat ? cat.name : '', l.brand || '', l.model || '',
    l.listing_type === 'inchiriere' ? 'inchiriere inchiriez' : '', l.city, l.county].join(' ')).slice(0, 6000);
}

// Elimină caracterele speciale ale lui LIKE/PostgREST din cuvintele căutate
const cleanWord = (w) => w.replace(/[%_\\,()*:"']/g, '');

async function markFavorites(sb, userId, rows) {
  if (!userId || !rows.length) return rows;
  const favs = must(await sb.from('favorites').select('listing_id').in('listing_id', rows.map((r) => r.id)));
  const set = new Set(favs.map((f) => f.listing_id));
  rows.forEach((r) => { r.is_fav = set.has(r.id); });
  return rows;
}

async function searchListings(sb, f = {}, { page = 1, perPage = 24, userId = null } = {}) {
  const build = () => {
    let q = sb.from('listing_cards').select('*', { count: 'exact' }).eq('status', 'activ').eq('seller_banned', false);
    if (f.q) {
      stripDiacritics(f.q).split(/\s+/).map(cleanWord).filter((w) => w.length > 1).slice(0, 6)
        .forEach((w) => { q = q.ilike('search_text', `%${w}%`); });
    }
    if (f.category && catMap[f.category]) q = q.eq('category', f.category);
    else if (f.group && groupMap[f.group]) q = q.in('category', catsByGroup(f.group).map((c) => c.slug));
    if (f.county) q = q.eq('county', f.county);
    if (f.city) { const c = cleanWord(f.city); if (c) q = q.ilike('city', `%${c}%`); }
    if (f.condition) q = q.eq('condition', f.condition);
    if (f.seller_type) q = q.eq('seller_type', f.seller_type);
    if (f.delivery === 'livrare') q = q.in('delivery', ['livrare', 'ambele']);
    if (f.min) q = q.gte('price', Number(f.min));
    if (f.max) q = q.lte('price', Number(f.max));
    // „Preț la cerere” are price = 0, deci nu trebuie să apară la filtrele de preț
    if (f.min || f.max) q = q.neq('price_type', 'cerere');
    if (f.free) q = q.eq('price_type', 'gratuit');
    if (f.seller) q = q.eq('user_id', f.seller);
    if (f.type === 'vanzare' || f.type === 'inchiriere') q = q.eq('listing_type', f.type);
    if (f.year_min) q = q.gte('year', Number(f.year_min));
    switch (f.sort) {
      case 'noi': q = q.order('created_at', { ascending: false }); break;
      case 'pret_asc': q = q.order('price', { ascending: true }).order('created_at', { ascending: false }); break;
      case 'pret_desc': q = q.order('price', { ascending: false }).order('created_at', { ascending: false }); break;
      case 'populare': q = q.order('views', { ascending: false }); break;
      default: q = q.order('featured', { ascending: false }).order('created_at', { ascending: false });
    }
    return q;
  };
  page = Math.max(1, Number(page) || 1);
  let res = await build().range((page - 1) * perPage, page * perPage - 1);
  if (res.error && res.error.code === 'PGRST103') { // pagină inexistentă → prima pagină
    page = 1;
    res = await build().range(0, perPage - 1);
  }
  const rows = must(res);
  const total = res.count || 0;
  const pages = Math.max(1, Math.ceil(total / perPage));
  await markFavorites(sb, userId, rows);
  return { rows, total, page: Math.min(page, pages), pages };
}

async function getListing(sb, id) {
  return must(await sb.from('listing_cards').select('*').eq('id', Number(id)).maybeSingle());
}

async function listingPhone(sb, id) {
  const { data } = await sb.rpc('get_listing_phone', { p_listing_id: Number(id) });
  return data || null;
}

async function listingImages(sb, id) {
  return must(await sb.from('listing_images').select('*').eq('listing_id', Number(id)).order('position').order('id'));
}

async function featuredListings(sb, limit = 8, userId = null, group = null) {
  let q = sb.from('listing_cards').select('*').eq('status', 'activ').eq('seller_banned', false);
  if (group) q = q.in('category', catsByGroup(group).map((c) => c.slug));
  const rows = must(await q.order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(limit));
  return markFavorites(sb, userId, rows);
}

async function similarListings(sb, l, limit = 4) {
  const rows = must(await sb.from('listing_cards').select('*').eq('status', 'activ').eq('seller_banned', false)
    .eq('category', l.category).neq('id', l.id).order('created_at', { ascending: false }).limit(12));
  rows.sort((a, b) => (b.county === l.county) - (a.county === l.county));
  return rows.slice(0, limit);
}

async function categoryCounts(sb) {
  const rows = must(await sb.from('category_counts').select('*'));
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}

async function sellerStats(sb, userId) {
  const s = must(await sb.from('seller_stats').select('active, rating, reviews').eq('id', userId).maybeSingle());
  return { reviews: s ? s.reviews : 0, rating: s && s.rating ? Number(s.rating) : 0, active: s ? s.active : 0 };
}

async function topSellers(sb, limit = 5) {
  const rows = must(await sb.from('seller_stats').select('*').eq('banned', false).gt('active', 0)
    .order('reviews', { ascending: false }).order('active', { ascending: false }).limit(limit));
  rows.forEach((r) => { r.rating = r.rating ? Number(r.rating) : 0; });
  return rows;
}

function listingRow(data) {
  return {
    category: data.category, title: data.title, slug: slugify(data.title), description: data.description,
    price: data.price, price_type: data.price_type, unit: data.unit, quantity: data.quantity,
    condition: data.condition, county: data.county, city: data.city, delivery: data.delivery,
    delivery_note: data.delivery_note || null, listing_type: data.listing_type || 'vanzare',
    brand: data.brand || null, model: data.model || null, year: data.year || null, hours: data.hours ?? null,
    search_text: buildSearchText(data),
  };
}

async function createListing(sb, userId, data) {
  const row = must(await sb.from('listings').insert({ ...listingRow(data), user_id: userId }).select('id').single());
  return row.id;
}

async function updateListing(sb, id, data) {
  must(await sb.from('listings').update({ ...listingRow(data), updated_at: new Date().toISOString() }).eq('id', id));
}

async function addImages(sb, listingId, items) {
  if (!items.length) return;
  const last = must(await sb.from('listing_images').select('position').eq('listing_id', listingId)
    .order('position', { ascending: false }).limit(1));
  const start = last.length ? last[0].position + 1 : 0;
  must(await sb.from('listing_images').insert(items.map((it, i) => ({
    listing_id: listingId, path: it.url, storage_path: it.storagePath, position: start + i,
  }))));
}

async function unreadCount(sb, userId) {
  const { count } = await sb.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).neq('sender_id', userId);
  return count || 0;
}

async function siteStats(sb) {
  const [a, u, s] = await Promise.all([
    sb.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'activ'),
    sb.from('profiles').select('id', { count: 'exact', head: true }),
    sb.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'vandut'),
  ]);
  return { listings: a.count || 0, users: u.count || 0, sold: s.count || 0 };
}

// Anunțurile proprii cu numărul de favorite și conversații
async function myListings(sb, userId, { status = null, limit = null } = {}) {
  let q = sb.from('listing_cards').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (status) q = q.eq('status', status);
  if (limit) q = q.limit(limit);
  const rows = must(await q);
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const [favs, convs] = await Promise.all([
    sb.rpc('my_listing_fav_counts', { p_ids: ids }),
    sb.from('conversations').select('listing_id').in('listing_id', ids),
  ]);
  const favMap = Object.fromEntries((favs.data || []).map((f) => [f.listing_id, f.n]));
  const convMap = {};
  (convs.data || []).forEach((c) => { convMap[c.listing_id] = (convMap[c.listing_id] || 0) + 1; });
  rows.forEach((r) => { r.fav_count = favMap[r.id] || 0; r.conv_count = convMap[r.id] || 0; });
  return rows;
}

async function myStatusCounts(sb, userId) {
  const rows = must(await sb.from('listings').select('status, views').eq('user_id', userId));
  const counts = {};
  let views = 0;
  rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; views += r.views; });
  return { counts, views };
}

async function conversationList(sb, userId) {
  const rows = must(await sb.from('conversation_overview').select('*').order('updated_at', { ascending: false }));
  rows.forEach((c) => {
    const iAmBuyer = c.buyer_id === userId;
    c.other_name = iAmBuyer ? c.seller_name : c.buyer_name;
    c.other_company = iAmBuyer ? c.seller_company : null;
  });
  return rows;
}

module.exports = {
  searchListings, getListing, listingPhone, listingImages, featuredListings, similarListings, categoryCounts,
  sellerStats, topSellers, createListing, updateListing, addImages, unreadCount, siteStats, buildSearchText,
  myListings, myStatusCounts, conversationList, markFavorites,
};
