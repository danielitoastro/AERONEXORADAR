import fs from 'node:fs';
import path from 'node:path';
const assets = {};
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml' };
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) { if (item.name !== 'server') walk(full); continue; }
    const key = '/' + path.relative('dist', full).split(path.sep).join('/');
    assets[key] = { body: fs.readFileSync(full, 'utf8'), type: types[path.extname(full)] || 'text/plain; charset=utf-8' };
  }
}
walk('dist');
const proxy = fs.readFileSync('src/server/aircraft.js', 'utf8');
const photoProxy = fs.readFileSync('src/server/photos.js', 'utf8');
const worker = `${proxy}\n${photoProxy}\nconst assets=${JSON.stringify(assets)};
export default { async fetch(request, env, ctx) {
  const url = new URL(request.url);
  if (url.pathname === '/api/aircraft') return handleAircraft(request, ctx);
  if (url.pathname === '/api/photos') return handlePhotos(request, caches.default);
  const asset = assets[url.pathname === '/' ? '/index.html' : url.pathname];
  const page = asset || assets['/404.html'];
  if (!page) return new Response('Not found', { status: 404 });
  return new Response(request.method === 'HEAD' ? null : page.body, { status: asset ? 200 : 404, headers: { 'Content-Type': page.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=60' } });
} };`;
fs.mkdirSync('dist/server', { recursive: true });
fs.writeFileSync('dist/server/index.js', worker);
console.log('Astro output prepared for the hosted preview.');
