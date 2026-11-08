// Baza de date SQLite (modulul nativ node:sqlite)
const path = require('node:path');
const fs = require('node:fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbFile = process.env.DB_FILE || path.join(dataDir, 'constria.db');

const db = new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  county TEXT,
  city TEXT,
  account_type TEXT NOT NULL DEFAULT 'persoana',
  company_name TEXT,
  cui TEXT,
  about TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  banned INTEGER NOT NULL DEFAULT 0,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'fix',
  unit TEXT NOT NULL DEFAULT 'buc',
  quantity REAL,
  condition TEXT NOT NULL DEFAULT 'nou',
  county TEXT NOT NULL,
  city TEXT NOT NULL,
  delivery TEXT NOT NULL DEFAULT 'ridicare',
  delivery_note TEXT,
  status TEXT NOT NULL DEFAULT 'activ',
  featured INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  search_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status, created_at);
CREATE INDEX IF NOT EXISTS idx_listings_cat ON listings(category, status);
CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);

CREATE TABLE IF NOT EXISTS listing_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_images_listing ON listing_images(listing_id, position);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (seller_id, author_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  handled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  image TEXT,
  tag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migrare: câmpuri pentru utilaje și închiriere
const listingCols = db.prepare('PRAGMA table_info(listings)').all().map((c) => c.name);
const addCol = (name, def) => { if (!listingCols.includes(name)) db.exec(`ALTER TABLE listings ADD COLUMN ${name} ${def}`); };
addCol('listing_type', "TEXT NOT NULL DEFAULT 'vanzare'");
addCol('brand', 'TEXT');
addCol('model', 'TEXT');
addCol('year', 'INTEGER');
addCol('hours', 'INTEGER');
db.exec("UPDATE listings SET category = 'scule-electrice' WHERE category = 'scule-utilaje'");

// Ajutor pentru tranzacții
function tx(fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

const q = {
  get: (sql, ...p) => db.prepare(sql).get(...p),
  all: (sql, ...p) => db.prepare(sql).all(...p),
  run: (sql, ...p) => db.prepare(sql).run(...p),
};

module.exports = { db, tx, ...q };
