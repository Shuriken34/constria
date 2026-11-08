// Constria - server principal
const path = require('node:path');
const fs = require('node:fs');

// Variabilele din .env (Node 21.7+ le citește nativ)
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const crypto = require('node:crypto');
const express = require('express');
const cookieSession = require('cookie-session');

const helpers = require('./src/helpers');
const data = require('./src/data');
const { loadUser, csrf, verifyCsrf, flashLocals } = require('./src/middleware');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Cheie de sesiune: din mediu sau generată și păstrată local
function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const f = path.join(__dirname, 'data', '.secret');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, crypto.randomBytes(32).toString('hex'));
  return fs.readFileSync(f, 'utf8').trim();
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));
app.use(express.urlencoded({ extended: false, limit: '200kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieSession({
  name: 'co_sess',
  keys: [sessionSecret()],
  maxAge: 30 * 24 * 3600 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  secure: isProd,
}));

// Variabile disponibile în toate șabloanele
app.use((req, res, next) => {
  Object.assign(res.locals, helpers, data, {
    path: req.path,
    query: req.query,
    title: null,
    description: 'Constria – piața online unde cumperi și vinzi materiale de construcții în toată România. Fără comisioane, direct de la vânzător.',
    year: new Date().getFullYear(),
    user: null,
    unread: 0,
    flash: [],
    csrf: '',
  });
  next();
});

app.use(loadUser);
app.use(csrf);
app.use(flashLocals);
app.use(verifyCsrf);

app.use(require('./src/routes/public'));
app.use(require('./src/routes/auth'));
app.use(require('./src/routes/account'));
app.use('/admin', require('./src/routes/admin'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Pagina nu există', code: 404, message: 'Se pare că pagina pe care o cauți a fost mutată sau nu a existat niciodată.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.supabase || err);
  if (res.headersSent) return next(err);
  res.status(500).render('error', { title: 'Eroare', code: 500, message: 'A apărut o eroare neașteptată. Încearcă din nou în câteva momente.' });
});

app.listen(PORT, () => console.log(`Constria rulează pe http://localhost:${PORT}`));
