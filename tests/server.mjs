// Kleiner statischer Server für die Tests: liefert dist/ aus, Groß-/Kleinschreibung exakt wie auf Linux-Hosting.
import http from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.pdf': 'application/pdf', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

// Prüft jedes Pfadsegment auf exakte Schreibweise (macOS würde Abweichungen verzeihen, Linux nicht).
async function existiertExakt(wurzel, rel) {
  let akt = wurzel;
  for (const teil of rel.split('/').filter(Boolean)) {
    const eintraege = await readdir(akt).catch(() => []);
    if (!eintraege.includes(teil)) return false;
    akt = path.join(akt, teil);
  }
  return true;
}

export function starteServer(wurzel = 'dist', port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (rel.endsWith('/')) rel += 'index.html';
      let datei = path.join(wurzel, rel);
      let ok = await existiertExakt(wurzel, rel);
      if (ok && (await stat(datei)).isDirectory()) { res.writeHead(301, { Location: req.url + '/' }); return res.end(); }
      if (!ok) {
        const fehler = path.join(wurzel, '404.html');
        const body = await readFile(fehler).catch(() => 'Not found');
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(body);
      }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] ?? 'application/octet-stream' });
      res.end(await readFile(datei));
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, basis: `http://127.0.0.1:${server.address().port}` })));
}
