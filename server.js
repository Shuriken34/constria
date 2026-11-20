// Server minim pentru Hostinger (Node.js hosting): servește site-ul static din `out/`.
// `out/` se generează cu `npm run build` și este inclus în Git, ca site-ul să pornească
// și dacă Hostinger nu rulează pasul de build. Nu are dependențe externe.

"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "out");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
};

// Caută fișierul pentru o adresă: /cale -> /cale, /cale.html, /cale/index.html
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  const safe = path.normalize(decoded).replace(/^([/\\])+/, "");
  const base = path.join(ROOT, safe);
  if (base !== ROOT && !base.startsWith(ROOT + path.sep)) return null; // fără ieșiri din out/

  for (const candidate of [base, base + ".html", path.join(base, "index.html")]) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      /* nu există, încercăm următorul */
    }
  }
  return null;
}

function send(res, status, file, method) {
  const ext = path.extname(file).toLowerCase();
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Cache-Control": file.includes(`${path.sep}_next${path.sep}static${path.sep}`)
      ? "public, max-age=31536000, immutable"
      : ext === ".html"
        ? "no-cache"
        : "public, max-age=3600",
  };
  res.writeHead(status, headers);
  if (method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  const urlPath = new URL(req.url, "http://localhost").pathname;
  const file = resolveFile(urlPath);
  if (file) return send(res, 200, file, req.method);

  // Adresele vechi ale marketplace-ului (anunțuri, cont, categorii) ajung pe pagina 404 a site-ului nou
  const notFound = path.join(ROOT, "404.html");
  if (fs.existsSync(notFound)) return send(res, 404, notFound, req.method);

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Pagina nu există.");
});

if (!fs.existsSync(path.join(ROOT, "index.html"))) {
  console.error("Lipsește out/index.html. Rulează `npm run build` înainte de `npm start`.");
}

server.listen(PORT, () => {
  console.log(`Constria rulează pe http://localhost:${PORT}`);
});
