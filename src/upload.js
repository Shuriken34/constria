// Încărcare imagini: multer în memorie → Supabase Storage (folderul utilizatorului)
const crypto = require('node:crypto');
const multer = require('multer');
const { BUCKET } = require('./supabase');

const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (allowed[file.mimetype]) return cb(null, true);
    const err = new Error('Sunt acceptate doar imagini JPG, PNG sau WEBP.');
    err.code = 'BAD_TYPE';
    cb(err);
  },
});

// Verifică semnătura reală a fișierului (nu doar tipul declarat)
function looksLikeImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

// Rulează multer și transformă erorile în mesaje prietenoase
function handleUpload(field, max) {
  const mw = max === 1 ? upload.single(field) : upload.array(field, max);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        req.uploadError = err.code === 'LIMIT_FILE_SIZE' ? 'O imagine depășește 6 MB.'
          : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `Poți încărca maximum ${max} imagini.`
            : err.message || 'Încărcarea a eșuat.';
        req.files = [];
        req.file = null;
      }
      const files = req.files || (req.file ? [req.file] : []);
      if (files.some((f) => !looksLikeImage(f.buffer))) {
        req.uploadError = 'Unul dintre fișiere nu este o imagine validă.';
        if (req.files) req.files = req.files.filter((f) => looksLikeImage(f.buffer));
        if (req.file && !looksLikeImage(req.file.buffer)) req.file = null;
      }
      next();
    });
  };
}

// Încarcă fișierele în Supabase Storage: <bucket>/<userId>/<aleator>.<ext>
async function storeFiles(sb, userId, files) {
  const out = [];
  for (const f of files) {
    const storagePath = `${userId}/${crypto.randomBytes(12).toString('hex')}${allowed[f.mimetype]}`;
    const { error } = await sb.storage.from(BUCKET).upload(storagePath, f.buffer, { contentType: f.mimetype, upsert: false });
    if (error) {
      await removeFiles(sb, out.map((o) => o.storagePath));
      throw Object.assign(new Error('Încărcarea imaginii a eșuat: ' + error.message), { supabase: error });
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    out.push({ storagePath, url: data.publicUrl });
  }
  return out;
}

async function removeFiles(sb, storagePaths) {
  const list = storagePaths.filter(Boolean);
  if (list.length) await sb.storage.from(BUCKET).remove(list).catch(() => {});
}

module.exports = { handleUpload, storeFiles, removeFiles };
