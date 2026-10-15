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

// Sorteo empezado y sin terminar. Se guarda en disco tras cada decisión para poder
// reanudarlo con el mismo orden si se recarga la web o se reinicia el servidor.
const EN_CURSO = path.join(RESULTADOS, "en-curso.json");

function leerEnCurso() {
  try {
    return JSON.parse(fs.readFileSync(EN_CURSO, "utf8"));
  } catch {
    return null;
  }
}

function guardarEnCurso(c) {
  // Escribir aparte y renombrar: si se corta a mitad, el archivo anterior sigue entero
  fs.writeFileSync(`${EN_CURSO}.tmp`, JSON.stringify(c, null, 2));
  fs.renameSync(`${EN_CURSO}.tmp`, EN_CURSO);
}

function enCursoConId(id) {
  const c = leerEnCurso();
  if (!c || c.sorteo.id !== id) throw Object.assign(new Error("Sorteo no encontrado"), { status: 404 });
  return c;
}

// Ganadores y descartados tienen que ser exactamente los primeros del orden fijado, sin saltarse a nadie
function validarProgreso(sorteo, body) {
  const ganadores = (body.ganadores || []).map(String);
  const descartados = (body.descartados || []).map((d) => ({ username: String(d.username), motivo: String(d.motivo || "") }));
  const esGanador = new Set(ganadores);
  const esDescartado = new Set(descartados.map((d) => d.username));
  const revisados = sorteo.orden.slice(0, ganadores.length + descartados.length).map((o) => o.username);
  const valido =
    ganadores.length <= sorteo.ganadores &&
    revisados.length === ganadores.length + descartados.length &&
    revisados.every((u) => esGanador.has(u) !== esDescartado.has(u)) &&
    revisados.filter((u) => esGanador.has(u)).join() === ganadores.join();
  if (!valido) throw Object.assign(new Error("El progreso no sigue el orden del sorteo"), { status: 400 });
  return { ganadores, descartados, revisados: revisados.length };
}

function cerrarSorteo(c, progreso, estado) {
  const resultado = {
    ...c.datos,
    estado,
    fechaCierreSorteo: new Date().toISOString(),
    ganadores: progreso.ganadores,
    descartadosEnVerificacion: progreso.descartados,
    suplentes: c.sorteo.orden.slice(progreso.revisados, progreso.revisados + 3).map((o) => o.username),
  };
  const archivo = `${c.sorteo.id}-resultado.json`;
  fs.writeFileSync(path.join(RESULTADOS, archivo), JSON.stringify(resultado, null, 2));
  fs.rmSync(EN_CURSO, { force: true });
  return { ok: true, archivo: `resultados/${archivo}` };
}

// Comentarios ya descargados de cada publicación. Así, cambiar las bases solo vuelve a filtrar;
// la descarga se repite al pulsar "Actualizar" y siempre al sortear.
const cache = new Map(); // "postId|respuestas" -> Promise<{ post, comentarios, leidoEn }>
let cuenta = null; // Promise<{ username }>

function miCuenta() {
  cuenta ??= ig.me().catch((e) => {
    cuenta = null;
    throw e;
  });
  return cuenta;
}

function descargar(postId, incluirRespuestas, refrescar) {
  const clave = `${postId}|${incluirRespuestas ? 1 : 0}`;
  if (refrescar || !cache.has(clave)) {
    const p = Promise.all([ig.post(postId), ig.comments(postId, incluirRespuestas)]).then(([post, comentarios]) => ({
      post,
      comentarios,
      leidoEn: new Date().toISOString(),
    }));
    p.catch(() => cache.get(clave) === p && cache.delete(clave));
    cache.set(clave, p);
  }
  return cache.get(clave);
}

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

async function participantes(postId, config, refrescar = false) {
  const cfg = normalizarConfig(config);
  const [yo, { post, comentarios, leidoEn }] = await Promise.all([
    miCuenta(),
    descargar(postId, cfg.incluirRespuestas, refrescar),
  ]);
  const { participantes, registro } = filtrar(comentarios, yo.username.toLowerCase(), cfg);
  return { cfg, post, comentarios, leidoEn, participantes, registro };
}

const rutas = {
  "GET /api/status": async () => {
    const yo = await miCuenta();
    return { modo, cuenta: yo.username };
  },

  "GET /api/posts": async () => ({ posts: await ig.posts() }),

  // Vista previa: cuántos participan con la configuración elegida
  "POST /api/preview": async (body) => {
    const { participantes: p, comentarios, registro, leidoEn } = await participantes(
      body.postId,
      body.config,
      Boolean(body.refrescar)
    );
    const descartes = {};
    for (const r of registro) if (!r.valido) descartes[r.motivo] = (descartes[r.motivo] || 0) + 1;
    return {
      totalComentarios: comentarios.length,
      participantes: p.length,
      nombres: p.map((x) => x.username),
      descartes,
      leidoEn,
    };
  },

  // Sorteo empezado y sin terminar, si lo hay
  "GET /api/draw/current": async () => {
    const c = leerEnCurso();
    return { sorteo: c ? { ...c.sorteo, progreso: c.progreso } : null };
  },

  // El sorteo de verdad: descarga los comentarios en este momento y fija el orden al azar
  "POST /api/draw": async (body) => {
    if (leerEnCurso()) {
      throw Object.assign(new Error("Hay un sorteo sin terminar. Continúalo o ciérralo antes de empezar otro."), {
        status: 409,
      });
    }
    const { cfg, post, comentarios, participantes: p, registro } = await participantes(body.postId, body.config, true);
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
    fs.writeFileSync(path.join(RESULTADOS, `${id}-orden.json`), JSON.stringify(datos, null, 2));
    fs.writeFileSync(path.join(RESULTADOS, `${id}-comentarios.csv`), csv(registro));

    const sorteo = {
      id,
      fechaSorteo: datos.fechaSorteo,
      post: { id: body.postId, permalink: post.permalink, caption: post.caption },
      ganadores: cfg.ganadores,
      totalComentarios: comentarios.length,
      orden: orden.map((x) => ({ username: x.username, text: x.text, timestamp: x.timestamp })),
    };
    const progreso = { ganadores: [], descartados: [] };
    guardarEnCurso({ datos, sorteo, progreso });
    return { ...sorteo, progreso };
  },

  // Guarda cada decisión de la verificación manual
  "POST /api/draw/progress": async (body) => {
    const c = enCursoConId(body.id);
    const { ganadores, descartados } = validarProgreso(c.sorteo, body);
    guardarEnCurso({ ...c, progreso: { ganadores, descartados } });
    return { ok: true };
  },

  // Guarda el resultado final tras la verificación manual
  "POST /api/draw/finish": async (body) => {
    const c = enCursoConId(body.id);
    return cerrarSorteo(c, validarProgreso(c.sorteo, body), "terminado");
  },

  // Cierra sin terminar un sorteo pendiente; queda registrado como cancelado con lo que se llegó a revisar
  "POST /api/draw/cancel": async (body) => {
    const c = enCursoConId(body.id);
    return cerrarSorteo(c, validarProgreso(c.sorteo, c.progreso), "cancelado");
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
