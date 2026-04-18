const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const FRONTEND_DIR = path.join(__dirname);
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 3000;
const PORT = process.env.PORT || 5500;
function proxyRequest(req, res) {
  const parsed = url.parse(req.url);
  const options = { hostname: BACKEND_HOST, port: BACKEND_PORT, path: parsed.path, method: req.method, headers: Object.assign({}, req.headers) };
  const proxy = http.request(options, (pres) => { res.writeHead(pres.statusCode, pres.headers); pres.pipe(res, { end: true }); });
  proxy.on('error', (err) => { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end('Bad Gateway: ' + err.message); });
  req.pipe(proxy, { end: true });
}
function serveStatic(req, res) {
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(FRONTEND_DIR, pathname);
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not Found'); }
    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.json':'application/json' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    stream.pipe(res);
  });
}
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) return proxyRequest(req, res);
  serveStatic(req, res);
});
server.listen(PORT, () => console.log('Simple proxy listening on port', PORT));
