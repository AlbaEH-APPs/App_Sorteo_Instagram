// Servidor del sorteo: guarda el token, habla con Instagram y hace el sorteo.
// Arranque:  IG_TOKEN=tu_token node server/index.mjs      (sin IG_TOKEN arranca en modo demo)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createInstagram } from "./instagram.mjs";
import { createDemo } from "./demo.mjs";
import { filtrar, barajar, normalizarConfig } from "./sorteo.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "client", "dist");
const RESULTADOS = path.join(ROOT, "resultados");
const PORT = Number(process.env.PORT) || 3001;

const TOKEN = process.env.IG_TOKEN;
const modo = TOKEN ? "instagram" : "demo";
const ig = TOKEN ? createInstagram(TOKEN) : createDemo();

fs.mkdirSync(RESULTADOS, { recursive: true });
const sorteos = new Map(); // drawId -> datos del sorteo en curso

function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

async function leerBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1e6) throw Object.assign(new Error("Petición demasiado grande"), { status: 413 });
  }
  return raw ? JSON.parse(raw) : {};
}

function marca() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csv(filas) {
  const cab = ["usuario", "fecha", "comentario", "valido", "motivo"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    cab.join(","),
    ...filas.map((f) => [f.username, f.timestamp, f.text, f.valido ? "sí" : "no", f.motivo].map(esc).join(",")),
  ].join("\n");
}

async function participantes(postId, config) {
  const cfg = normalizarConfig(config);
  const [yo, post, comentarios] = await Promise.all([
    ig.me(),
    ig.post(postId),
    ig.comments(postId, cfg.incluirRespuestas),
  ]);
  const { participantes, registro } = filtrar(comentarios, yo.username.toLowerCase(), cfg);
  return { cfg, yo, post, comentarios, participantes, registro };
}

const rutas = {
  "GET /api/status": async () => {
    const yo = await ig.me();
    return { modo, cuenta: yo.username };
  },

  "GET /api/posts": async () => ({ posts: await ig.posts() }),

  // Vista previa: cuántos participan con la configuración elegida
  "POST /api/preview": async (body) => {
    const { participantes: p, comentarios, registro } = await participantes(body.postId, body.config);
    const descartes = {};
    for (const r of registro) if (!r.valido) descartes[r.motivo] = (descartes[r.motivo] || 0) + 1;
    return {
      totalComentarios: comentarios.length,
      participantes: p.length,
      nombres: p.map((x) => x.username),
      descartes,
    };
  },

  // El sorteo de verdad: descarga los comentarios en este momento y fija el orden al azar
  "POST /api/draw": async (body) => {
    const { cfg, post, comentarios, participantes: p, registro } = await participantes(body.postId, body.config);
    if (p.length === 0) throw Object.assign(new Error("No hay participantes válidos"), { status: 400 });

    const orden = barajar(p);
    const id = `${marca()}-${crypto.randomBytes(3).toString("hex")}`;
    const datos = {
      id,
      fechaSorteo: new Date().toISOString(),
      modo,
      publicacion: post.permalink,
      configuracion: cfg,
      totalComentarios: comentarios.length,
      participantesValidos: p.length,
      orden: orden.map((x) => x.username),
    };
    sorteos.set(id, datos);
    fs.writeFileSync(path.join(RESULTADOS, `${id}-orden.json`), JSON.stringify(datos, null, 2));
    fs.writeFileSync(path.join(RESULTADOS, `${id}-comentarios.csv`), csv(registro));

    return {
      id,
      post: { permalink: post.permalink, caption: post.caption },
      ganadores: cfg.ganadores,
      totalComentarios: comentarios.length,
      orden: orden.map((x) => ({ username: x.username, text: x.text, timestamp: x.timestamp })),
    };
  },

  // Guarda el resultado final tras la verificación manual
  "POST /api/draw/finish": async (body) => {
    const base = sorteos.get(body.id);
    if (!base) throw Object.assign(new Error("Sorteo no encontrado"), { status: 404 });
    const resultado = {
      ...base,
      fechaCierreSorteo: new Date().toISOString(),
      ganadores: body.ganadores || [],
      descartadosEnVerificacion: body.descartados || [],
      suplentes: body.suplentes || [],
    };
    fs.writeFileSync(path.join(RESULTADOS, `${body.id}-resultado.json`), JSON.stringify(resultado, null, 2));
    return { ok: true, archivo: `resultados/${body.id}-resultado.json` };
  },
};

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
  .createServer(async (req, res) => {
    const ruta = `${req.method} ${new URL(req.url, "http://x").pathname}`;
    const handler = rutas[ruta];
    if (!handler) {
      if (req.url.startsWith("/api/")) return json(res, 404, { error: "Ruta no encontrada" });
      return estatico(req, res);
    }
    try {
      const body = req.method === "POST" ? await leerBody(req) : {};
      json(res, 200, await handler(body));
    } catch (e) {
      console.error(e.message);
      json(res, e.status || 500, { error: e.message });
    }
  })
  .listen(PORT, () => {
    console.log(`Servidor del sorteo en http://localhost:${PORT}  ·  modo ${modo.toUpperCase()}`);
    if (modo === "demo") console.log("Sin IG_TOKEN: usando participantes inventados para ensayar.");
  });
