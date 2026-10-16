// API del sorteo: habla con Instagram, hace el sorteo y guarda los resultados.
// La usan igual el servidor local (server/index.mjs) y Vercel (api/index.mjs).
import crypto from "node:crypto";
import { createInstagram, urlAutorizacion, obtenerToken, renovarToken } from "./instagram.mjs";
import { createDemo } from "./demo.mjs";
import { filtrar, barajar, normalizarConfig } from "./sorteo.mjs";
import { crearAlmacen, TIPOS } from "./almacen.mjs";

const error = (msg, status) => Object.assign(new Error(msg), { status });
const EN_VERCEL = Boolean(process.env.VERCEL);
const DIA = 24 * 3600e3;

// Respuesta que no es JSON: una descarga, una página o una redirección
class Respuesta {
  constructor(status, cabeceras, contenido = "") {
    Object.assign(this, { status, cabeceras, contenido });
  }
}

const descarga = (nombre, tipo, contenido) =>
  new Respuesta(200, { "Content-Type": tipo, "Content-Disposition": `attachment; filename="${nombre}"` }, contenido);

const redireccion = (url) => new Respuesta(302, { Location: url });

const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Página sencilla para quien abre el enlace de conexión (no tiene la app abierta)
function pagina(titulo, texto, ok) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapar(titulo)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0b16;color:#f6f1ff;
font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:16px;box-sizing:border-box}
main{max-width:420px;text-align:center;background:#1b1529;border:1px solid #2d2540;border-radius:18px;padding:28px 22px}
.i{font-size:52px}h1{font-size:22px;margin:10px 0}p{color:#a69cbd;line-height:1.5;margin:0}</style></head>
<body><main><div class="i">${ok ? "✅" : "⚠️"}</div><h1>${escapar(titulo)}</h1><p>${escapar(texto)}</p></main></body></html>`;
  return new Respuesta(ok ? 200 : 400, { "Content-Type": "text/html; charset=utf-8" }, html);
}

// Dirección pública de la app (https://….vercel.app), tal como la ha abierto quien crea el enlace
function origen(req) {
  const proto = String(req.headers["x-forwarded-proto"] || (EN_VERCEL ? "https" : "http")).split(",")[0];
  return `${proto}://${req.headers["x-forwarded-host"] || req.headers.host}`;
}

function json(res, status, data, cabeceras = {}) {
  res.writeHead(status, { ...cabeceras, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

async function leerBody(req) {
  // En Vercel el cuerpo ya viene leído; en local hay que leerlo
  if (req.body !== undefined) return typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1e6) throw error("Petición demasiado grande", 413);
  }
  return raw ? JSON.parse(raw) : {};
}

function marca() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csv(filas) {
  const cab = ["usuario", "fecha", "comentario", "valido", "motivo"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  // La marca BOM del principio hace que Excel lea bien los acentos y emojis
  return (
    "﻿" +
    [
      cab.join(","),
      ...filas.map((f) => [f.username, f.timestamp, f.text, f.valido ? "sí" : "no", f.motivo].map(esc).join(",")),
    ].join("\n")
  );
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
  if (!valido) throw error("El progreso no sigue el orden del sorteo", 400);
  return { ganadores, descartados, revisados: revisados.length };
}

// ── Contraseña de acceso ─────────────────────────────
// Si existe APP_PASSWORD, toda la API (salvo iniciar sesión) exige una sesión firmada en una cookie.
// En Vercel es obligatoria: sin ella la app no funciona, para que nunca quede abierta a cualquiera.
const PASSWORD = process.env.APP_PASSWORD || "";
const SESION_HORAS = 12;
// Las de /api/ig/ son para quien abre el enlace de conexión y para la renovación diaria de Vercel
const PUBLICAS = new Set([
  "/api/session",
  "/api/login",
  "/api/logout",
  "/api/ig/conectar",
  "/api/ig/callback",
  "/api/ig/refresh",
]);
const sha = (t) => crypto.createHash("sha256").update(t).digest();
const claveSesion = sha(`sesion|${PASSWORD}`); // cambiar la contraseña cierra todas las sesiones

const firmar = (texto) => crypto.createHmac("sha256", claveSesion).update(texto).digest("base64url");

function sesionValida(req) {
  const valor = (req.headers.cookie || "").split(";").map((p) => p.trim()).find((p) => p.startsWith("sesion="));
  const [hasta, firma] = (valor?.slice(7) || "").split(".");
  if (!hasta || !firma || !(Number(hasta) > Date.now())) return false;
  const a = Buffer.from(firma);
  const b = Buffer.from(firmar(hasta));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function cookieSesion(req, valor, segundos) {
  const segura = EN_VERCEL || req.headers["x-forwarded-proto"] === "https";
  return `sesion=${valor}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${segundos}${segura ? "; Secure" : ""}`;
}

// Para conectar una cuenta con enlace (Meta → Instagram → API setup with Instagram login)
const IG_APP_ID = process.env.IG_APP_ID || "";
const IG_APP_SECRET = process.env.IG_APP_SECRET || "";

export function crearApp({ dirResultados }) {
  const almacen = crearAlmacen(dirResultados);

  // ── Cuenta de Instagram ─────────────────────────────
  // Por orden: la conectada con el enlace (guardada como "ig-token"), la variable IG_TOKEN o el modo demo.
  // Se mira en cada petición: al conectar o desconectar una cuenta no hace falta volver a publicar.
  let actual = { token: undefined, ig: null };
  let cuenta = null; // Promise<{ username }> de la cuenta actual
  let renovando = null;

  const caducada = (c) => Date.parse(c.caduca) <= Date.now();

  // Pide otros 60 días a Instagram cuando al token le quedan menos de 50
  // (ocurre al usar la app o, si no se usa, en la comprobación diaria de Vercel)
  function renovarSiToca(c) {
    const edad = Date.now() - Date.parse(c.obtenido);
    const quedan = Date.parse(c.caduca) - Date.now();
    if (quedan <= 0 || edad < DIA || quedan > 50 * DIA) return c;
    renovando ??= renovarToken(c.token)
      .then(async (r) => {
        const nueva = { ...c, token: r.token, obtenido: new Date().toISOString(), caduca: new Date(Date.now() + r.segundos * 1000).toISOString() };
        await almacen.guardar("ig-token", nueva);
        console.log(`Permiso de Instagram de @${c.usuario} renovado hasta ${nueva.caduca}`);
        return nueva;
      })
      .catch((e) => {
        console.warn(`No se pudo renovar el permiso de Instagram: ${e.message}`);
        return c;
      })
      .finally(() => (renovando = null));
    return renovando;
  }

  async function cliente() {
    let conexion = await almacen.leer("ig-token");
    if (conexion) conexion = await renovarSiToca(conexion);
    const token = conexion && !caducada(conexion) ? conexion.token : process.env.IG_TOKEN || "";
    if (token !== actual.token) {
      actual = { token, ig: token ? createInstagram(token) : createDemo() };
      cuenta = null;
    }
    return { ig: actual.ig, modo: token ? "instagram" : "demo", conexion };
  }

  async function enCursoConId(id) {
    const c = await almacen.leerEnCurso();
    if (!c || c.sorteo.id !== id) throw error("Sorteo no encontrado", 404);
    return c;
  }

  async function cerrarSorteo(c, progreso, estado) {
    const resultado = {
      ...c.datos,
      estado,
      fechaCierreSorteo: new Date().toISOString(),
      ganadores: progreso.ganadores,
      descartadosEnVerificacion: progreso.descartados,
      suplentes: c.sorteo.orden.slice(progreso.revisados, progreso.revisados + 3).map((o) => o.username),
    };
    await almacen.guardarArchivo(c.sorteo.id, "resultado.json", JSON.stringify(resultado, null, 2));
    await almacen.borrarEnCurso();
    return { ok: true, archivo: `${c.sorteo.id}-resultado.json` };
  }

  // Comentarios ya descargados de cada publicación. Así, cambiar las bases solo vuelve a filtrar;
  // la descarga se repite al pulsar "Actualizar" y siempre al sortear.
  const enVuelo = new Map(); // descargas en marcha, para no repetir la misma a la vez

  function miCuenta(ig) {
    cuenta ??= ig.me().catch((e) => {
      cuenta = null;
      throw e;
    });
    return cuenta;
  }

  async function descargar(ig, postId, incluirRespuestas, refrescar) {
    const clave = `${postId}|${incluirRespuestas ? 1 : 0}`;
    if (!refrescar && !enVuelo.has(clave)) {
      const guardado = await almacen.cacheLeer(clave);
      if (guardado) return guardado;
    }
    if (!enVuelo.has(clave)) {
      const p = Promise.all([ig.post(postId), ig.comments(postId, incluirRespuestas)])
        .then(async ([post, comentarios]) => {
          const v = { post, comentarios, leidoEn: new Date().toISOString() };
          // Si la caché falla no pasa nada: solo se descargará otra vez la próxima vez
          await almacen.cacheGuardar(clave, v).catch((e) => console.warn(`Caché: ${e.message}`));
          return v;
        })
        .finally(() => enVuelo.delete(clave));
      enVuelo.set(clave, p);
    }
    return enVuelo.get(clave);
  }

  async function participantes(postId, config, refrescar = false) {
    const cfg = normalizarConfig(config);
    const { ig, modo } = await cliente();
    const [yo, { post, comentarios, leidoEn }] = await Promise.all([
      miCuenta(ig),
      descargar(ig, postId, cfg.incluirRespuestas, refrescar),
    ]);
    const { participantes, registro } = filtrar(comentarios, yo.username.toLowerCase(), cfg);
    return { cfg, modo, post, comentarios, leidoEn, participantes, registro };
  }

  const rutas = {
    // ── Sesión ──
    "GET /api/session": async ({ req }) => ({
      necesitaLogin: Boolean(PASSWORD),
      autenticado: !PASSWORD || sesionValida(req),
    }),

    "POST /api/login": async ({ req, body, cabeceras }) => {
      const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
      const [porIp, total] = await Promise.all([almacen.contar(`login:${ip}`, 900), almacen.contar("login:total", 900)]);
      if (porIp > 10 || total > 50) throw error("Demasiados intentos. Espera 15 minutos.", 429);
      const correcta = PASSWORD && crypto.timingSafeEqual(sha(String(body.password || "")), sha(PASSWORD));
      if (!correcta) throw error("Contraseña incorrecta", 401);
      const hasta = String(Date.now() + SESION_HORAS * 3600e3);
      cabeceras["Set-Cookie"] = cookieSesion(req, `${hasta}.${firmar(hasta)}`, SESION_HORAS * 3600);
      return { ok: true };
    },

    "POST /api/logout": async ({ req, cabeceras }) => {
      cabeceras["Set-Cookie"] = cookieSesion(req, "", 0);
      return { ok: true };
    },

    // ── Sorteo ──
    // Si Instagram falla (permiso caducado o retirado) se informa sin romper la app,
    // para poder llegar a la pantalla de Instagram y conectar de nuevo
    "GET /api/status": async () => {
      const { ig, modo, conexion } = await cliente();
      let usuario = null;
      let errorInstagram = null;
      try {
        usuario = (await miCuenta(ig)).username;
      } catch (e) {
        errorInstagram = e.message;
      }
      return {
        modo,
        cuenta: usuario,
        almacen: almacen.tipo,
        sesion: Boolean(PASSWORD),
        instagram: {
          puedeConectar: Boolean(IG_APP_ID && IG_APP_SECRET),
          origen: conexion && !caducada(conexion) ? "enlace" : process.env.IG_TOKEN ? "variable" : null,
          conectada: conexion ? { usuario: conexion.usuario, caduca: conexion.caduca, caducada: caducada(conexion) } : null,
          error: errorInstagram,
        },
      };
    },

    "GET /api/posts": async () => ({ posts: await (await cliente()).ig.posts() }),

    // Vista previa: cuántos participan con la configuración elegida
    "POST /api/preview": async ({ body }) => {
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
      const c = await almacen.leerEnCurso();
      return { sorteo: c ? { ...c.sorteo, progreso: c.progreso } : null };
    },

    // El sorteo de verdad: descarga los comentarios en este momento y fija el orden al azar
    "POST /api/draw": async ({ body }) => {
      const pendiente = error("Hay un sorteo sin terminar. Continúalo o ciérralo antes de empezar otro.", 409);
      if (await almacen.leerEnCurso()) throw pendiente;
      const { cfg, modo, post, comentarios, participantes: p, registro } = await participantes(body.postId, body.config, true);
      if (p.length === 0) throw error("No hay participantes válidos", 400);

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
      const sorteo = {
        id,
        fechaSorteo: datos.fechaSorteo,
        post: { id: body.postId, permalink: post.permalink, caption: post.caption },
        ganadores: cfg.ganadores,
        totalComentarios: comentarios.length,
        orden: orden.map((x) => ({ username: x.username, text: x.text, timestamp: x.timestamp })),
      };
      const progreso = { ganadores: [], descartados: [] };
      // Solo se crea si no hay otro: evita dos sorteos a la vez aunque se pulse en dos sitios
      if (!(await almacen.crearEnCurso({ datos, sorteo, progreso }))) throw pendiente;
      await almacen.guardarArchivo(id, "orden.json", JSON.stringify(datos, null, 2));
      await almacen.guardarArchivo(id, "comentarios.csv", csv(registro));
      return { ...sorteo, progreso };
    },

    // Guarda cada decisión de la verificación manual
    "POST /api/draw/progress": async ({ body }) => {
      const c = await enCursoConId(body.id);
      const { ganadores, descartados } = validarProgreso(c.sorteo, body);
      await almacen.guardarEnCurso({ ...c, progreso: { ganadores, descartados } });
      return { ok: true };
    },

    // Guarda el resultado final tras la verificación manual
    "POST /api/draw/finish": async ({ body }) => {
      const c = await enCursoConId(body.id);
      return cerrarSorteo(c, validarProgreso(c.sorteo, body), "terminado");
    },

    // Cierra sin terminar un sorteo pendiente; queda registrado como cancelado con lo que se llegó a revisar
    "POST /api/draw/cancel": async ({ body }) => {
      const c = await enCursoConId(body.id);
      return cerrarSorteo(c, validarProgreso(c.sorteo, c.progreso), "cancelado");
    },

    // ── Historial ──
    "GET /api/historial": async () => {
      const [ids, enCurso] = await Promise.all([almacen.listarIds(), almacen.leerEnCurso()]);
      const sorteos = await Promise.all(
        ids.slice(0, 50).map(async (id) => {
          const resultado = await almacen.leerArchivo(id, "resultado.json");
          const datos = JSON.parse(resultado || (await almacen.leerArchivo(id, "orden.json")) || "{}");
          return {
            id,
            fecha: datos.fechaSorteo,
            modo: datos.modo,
            publicacion: datos.publicacion,
            participantes: datos.participantesValidos,
            estado: resultado ? datos.estado || "terminado" : enCurso?.sorteo.id === id ? "en curso" : "sin terminar",
            ganadores: datos.ganadores && Array.isArray(datos.ganadores) ? datos.ganadores : [],
            archivos: resultado ? TIPOS : TIPOS.filter((t) => t !== "resultado.json"),
          };
        })
      );
      return { sorteos };
    },

    "GET /api/archivo": async ({ query }) => {
      const id = query.get("id") || "";
      const tipo = query.get("tipo") || "";
      if (!/^[\w-]+$/.test(id) || !TIPOS.includes(tipo)) throw error("Archivo no válido", 400);
      const contenido = await almacen.leerArchivo(id, tipo);
      if (contenido == null) throw error("Archivo no encontrado", 404);
      const mime = tipo.endsWith(".csv") ? "text/csv; charset=utf-8" : "application/json; charset=utf-8";
      return descarga(`${id}-${tipo}`, mime, contenido);
    },

    // ── Conectar la cuenta de Instagram con un enlace ──
    // 1. Quien organiza crea un enlace de un solo uso (24 h) y se lo manda a quien tiene la cuenta.
    "POST /api/ig/enlace": async ({ req }) => {
      if (!IG_APP_ID || !IG_APP_SECRET) {
        throw error("Faltan IG_APP_ID e IG_APP_SECRET en la configuración. Mira la Guía de lanzamiento.", 400);
      }
      const estado = crypto.randomBytes(24).toString("base64url");
      const base = origen(req);
      await almacen.guardar(`ig-estado:${estado}`, { redirectUri: `${base}/api/ig/callback` }, 24 * 3600);
      return { url: `${base}/api/ig/conectar?e=${estado}`, caduca: new Date(Date.now() + DIA).toISOString() };
    },

    // 2. Quien tiene la cuenta abre el enlace y va a Instagram a iniciar sesión y dar permiso
    "GET /api/ig/conectar": async ({ query }) => {
      const estado = query.get("e") || "";
      const datos = /^[\w-]{20,}$/.test(estado) && (await almacen.leer(`ig-estado:${estado}`));
      if (!datos) return pagina("Enlace caducado", "Este enlace ya se ha usado o ha caducado. Pide uno nuevo.", false);
      return redireccion(urlAutorizacion({ appId: IG_APP_ID, redirectUri: datos.redirectUri, estado }));
    },

    // 3. Instagram vuelve aquí con un código, que se cambia por un permiso de 60 días y se guarda
    "GET /api/ig/callback": async ({ query }) => {
      const estado = query.get("state") || "";
      const datos = /^[\w-]{20,}$/.test(estado) && (await almacen.tomar(`ig-estado:${estado}`));
      if (!datos) return pagina("Enlace caducado", "Este enlace ya se ha usado o ha caducado. Pide uno nuevo.", false);
      if (query.get("error") || !query.get("code")) {
        return pagina("No se ha conectado", "No se ha dado permiso en Instagram. Pide un enlace nuevo para intentarlo otra vez.", false);
      }
      try {
        const { token, segundos } = await obtenerToken({
          appId: IG_APP_ID,
          appSecret: IG_APP_SECRET,
          redirectUri: datos.redirectUri,
          codigo: query.get("code"),
        });
        const { username } = await createInstagram(token).me();
        await almacen.guardar("ig-token", {
          token,
          usuario: username,
          obtenido: new Date().toISOString(),
          caduca: new Date(Date.now() + segundos * 1000).toISOString(),
        });
        console.log(`Cuenta de Instagram conectada: @${username}`);
        return pagina("¡Cuenta conectada!", `La cuenta @${username} ya está conectada a la app del sorteo. Puedes cerrar esta página.`, true);
      } catch (e) {
        console.error(e.message);
        return pagina("No se ha podido conectar", `${e.message}. Pide un enlace nuevo para intentarlo otra vez.`, false);
      }
    },

    // Renovación diaria (Vercel Cron, ver vercel.json). Solo renueva si toca; si no, no hace nada.
    "GET /api/ig/refresh": async ({ req }) => {
      if (process.env.CRON_SECRET && req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        throw error("No autorizado", 401);
      }
      const conexion = await almacen.leer("ig-token");
      if (!conexion) return { ok: true, renovado: false };
      const nueva = await renovarSiToca(conexion);
      return { ok: true, renovado: nueva !== conexion };
    },

    "POST /api/ig/desconectar": async () => {
      await almacen.borrar("ig-token");
      return { ok: true };
    },
  };

  // Atiende una petición a /api/...
  return async function manejar(req, res) {
    const url = new URL(req.url, "http://x");
    // En Vercel todas las rutas llegan a la misma función; la ruta original viene en __ruta
    const ruta = url.searchParams.get("__ruta");
    const pathname = ruta != null ? `/api/${ruta}` : url.pathname;
    const handler = rutas[`${req.method} ${pathname}`];
    if (!handler) return json(res, 404, { error: "Ruta no encontrada" });

    const cabeceras = {};
    try {
      if (EN_VERCEL && !PASSWORD) throw error("Falta configurar la contraseña (APP_PASSWORD) en Vercel", 500);
      if (PASSWORD && !PUBLICAS.has(pathname) && !sesionValida(req)) throw error("Inicia sesión", 401);
      // Exigir JSON impide que otra web envíe peticiones con un formulario usando tu sesión
      if (req.method === "POST" && !String(req.headers["content-type"] || "").startsWith("application/json")) {
        throw error("Formato no válido", 415);
      }
      const body = req.method === "POST" ? await leerBody(req) : {};
      const r = await handler({ req, body, query: url.searchParams, cabeceras });
      if (r instanceof Respuesta) {
        res.writeHead(r.status, { ...r.cabeceras, "Cache-Control": "no-store" });
        return res.end(r.contenido);
      }
      json(res, 200, r, cabeceras);
    } catch (e) {
      if (e.status !== 401) console.error(e.message);
      json(res, e.status || 500, { error: e.message }, cabeceras);
    }
  };
}
