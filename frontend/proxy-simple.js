// Simple static + API proxy for UNDERHEAT Studio (frontend version)

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

// Because this file lives INSIDE /frontend/, this is correct:
const FRONTEND_DIR = __dirname;

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = 4000;
const PORT = process.env.PORT || 5500;

// Proxy API requests to backend
function proxyRequest(req, res) {
  const parsed = url.parse(req.url);

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: parsed.path,
    method: req.method,
    headers: { ...req.headers }
  };

  const proxy = http.request(options, (pres) => {
    res.writeHead(pres.statusCode, pres.headers);
    pres.pipe(res, { end: true });
  });

  proxy.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Bad Gateway: " + err.message }));
  });

  req.pipe(proxy, { end: true });
}

// Serve static frontend files
function serveStatic(req, res) {
  let pathname = url.parse(req.url).pathname;

  // Default route
  if (pathname === "/") pathname = "/index.html";

  // Normalize path
  pathname = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");

  const filePath = path.join(FRONTEND_DIR, pathname);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime =
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".json": "application/json"
      }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": mime });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Main server
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) return proxyRequest(req, res);
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log("Simple proxy listening on port", PORT);
  console.log("Serving static from:", FRONTEND_DIR);
});
