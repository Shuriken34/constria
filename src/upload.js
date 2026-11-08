// Încărcare imagini (multer)
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowed = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + allowed[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => {
    if (allowed[file.mimetype]) return cb(null, true);
    const err = new Error('Sunt acceptate doar imagini JPG, PNG sau WEBP.');
    err.code = 'BAD_TYPE';
    cb(err);
  },
});

// Verifică semnătura reală a fișierului (nu doar tipul declarat)
function looksLikeImage(file) {
  try {
    const fd = fs.openSync(file.path, 'r');
    const b = Buffer.alloc(12);
    fs.readSync(fd, b, 0, 12, 0);
    fs.closeSync(fd);
    const jpg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const png = b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const webp = b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP';
    return jpg || png || webp;
  } catch {
    return false;
  }
}

function removeFile(p) {
  if (!p || /^https?:/.test(p)) return;
  const full = path.join(uploadDir, path.basename(p));
  fs.promises.unlink(full).catch(() => {});
}

// Rulează multer și transformă erorile în mesaje prietenoase
function handleUpload(field, max) {
  const mw = max === 1 ? upload.single(field) : upload.array(field, max);
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'O imagine depășește 6 MB.'
          : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE' ? `Poți încărca maximum ${max} imagini.`
            : err.message || 'Încărcarea a eșuat.';
        req.uploadError = msg;
        req.files = [];
        req.file = null;
      }
      const files = req.files || (req.file ? [req.file] : []);
      const bad = files.filter((f) => !looksLikeImage(f));
      if (bad.length) {
        bad.forEach((f) => removeFile(f.filename));
        req.uploadError = 'Unul dintre fișiere nu este o imagine validă.';
        if (req.files) req.files = req.files.filter((f) => !bad.includes(f));
        if (req.file && bad.includes(req.file)) req.file = null;
      }
      next();
    });
  };
}

module.exports = { handleUpload, removeFile };
