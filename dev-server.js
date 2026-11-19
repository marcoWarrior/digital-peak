// ─────────────────────────────────────────────────────────────────────────
//  dev-server.js — Server statico locale zero-dipendenze per Digital Peak
//  Avvio: node dev-server.js
// ─────────────────────────────────────────────────────────────────────────
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const reqUrl = (req.url || '/').split('?')[0];
  let safePath = '/';

  try {
    safePath = decodeURIComponent(reqUrl);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  if (safePath === '/') {
    safePath = '/index.html';
  }

  const relativePath = safePath.replace(/^\/+/, '');
  const resolvedPath = path.resolve(ROOT, relativePath);

  // Protezione contro path traversal fuori dalla root del progetto
  if (resolvedPath !== ROOT && !resolvedPath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(resolvedPath, (statErr, stats) => {
    if (statErr) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const filePath = stats.isDirectory()
      ? path.join(resolvedPath, 'index.html')
      : resolvedPath;

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log('\n  Digital Peak — Server locale attivo');
  console.log('  ──────────────────────────────────────────────────────────');
  console.log(`  Versione A (Premium Corporate): http://localhost:${PORT}/?design=A`);
  console.log(`  Versione B (Modern Digital):    http://localhost:${PORT}/?design=B`);
  console.log(`  Versione C (Editorial Luxury):  http://localhost:${PORT}/?design=C`);
  console.log(`  Versione D (Peak Run 3D Surf):  http://localhost:${PORT}/?design=D`);
  console.log(`  Selettore varianti (opzionale): http://localhost:${PORT}/selector.html`);
  console.log('  Premi Ctrl+C per fermare il server.\n');
});
