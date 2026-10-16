// Servidor local del sorteo: sirve la API (server/app.mjs) y la web compilada.
// Arranque:  IG_TOKEN=tu_token node server/index.mjs      (sin IG_TOKEN arranca en modo demo)
// Opcional:  APP_PASSWORD=...  para pedir contraseña también en local
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { crearApp } from "./app.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "client", "dist");
const PORT = Number(process.env.PORT) || 3001;

const manejar = crearApp({ dirResultados: path.join(ROOT, "resultados") });

// Sirve la web compilada (npm run build) si existe
const tipos = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
function estatico(req, res) {
  if (!fs.existsSync(DIST)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Abre la web con 'npm run dev' (puerto 5173) o compílala con 'npm run build'.");
  }
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(DIST, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    file = path.join(DIST, "index.html");
  }
  res.writeHead(200, { "Content-Type": tipos[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => (req.url.startsWith("/api/") ? manejar(req, res) : estatico(req, res)))
  .listen(PORT, () => {
    const modo = process.env.IG_TOKEN ? "instagram" : "demo";
    console.log(`Servidor del sorteo en http://localhost:${PORT}  ·  modo ${modo.toUpperCase()}`);
    if (modo === "demo") console.log("Sin IG_TOKEN: usando participantes inventados para ensayar.");
    if (process.env.APP_PASSWORD) console.log("Con contraseña de acceso (APP_PASSWORD).");
  });
