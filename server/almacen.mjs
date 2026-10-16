// Dónde se guardan el sorteo en curso, los resultados y la caché de comentarios.
//  - En tu ordenador: archivos en resultados/ (la caché, en memoria).
//  - En Vercel: Upstash Redis (el disco de Vercel no guarda nada entre peticiones).
import fs from "node:fs";
import path from "node:path";

export const TIPOS = ["orden.json", "comentarios.csv", "resultado.json"];

const error = (msg, status = 500) => Object.assign(new Error(msg), { status });

export function crearAlmacen(dirResultados) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return almacenRedis(url, token);
  if (process.env.VERCEL) return almacenSinConfigurar();
  return almacenArchivos(dirResultados);
}

// ── Archivos locales ─────────────────────────────
function almacenArchivos(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const enCurso = path.join(dir, "en-curso.json");
  const cache = new Map();
  const contadores = new Map();
  const dirValores = path.join(dir, ".datos");
  const archivoValor = (clave) => path.join(dirValores, `${clave.replace(/[^\w-]/g, "_")}.json`);

  return {
    tipo: "archivos",

    async leerEnCurso() {
      try {
        return JSON.parse(fs.readFileSync(enCurso, "utf8"));
      } catch {
        return null;
      }
    },
    // Solo lo crea si no hay otro: devuelve false si ya existía
    async crearEnCurso(c) {
      try {
        fs.writeFileSync(enCurso, JSON.stringify(c, null, 2), { flag: "wx" });
        return true;
      } catch (e) {
        if (e.code === "EEXIST") return false;
        throw e;
      }
    },
    async guardarEnCurso(c) {
      // Escribir aparte y renombrar: si se corta a mitad, el archivo anterior sigue entero
      fs.writeFileSync(`${enCurso}.tmp`, JSON.stringify(c, null, 2));
      fs.renameSync(`${enCurso}.tmp`, enCurso);
    },
    async borrarEnCurso() {
      fs.rmSync(enCurso, { force: true });
    },

    async guardarArchivo(id, tipo, contenido) {
      fs.writeFileSync(path.join(dir, `${id}-${tipo}`), contenido);
    },
    async leerArchivo(id, tipo) {
      try {
        return fs.readFileSync(path.join(dir, `${id}-${tipo}`), "utf8");
      } catch {
        return null;
      }
    },
    async listarIds() {
      const ids = new Set();
      for (const f of fs.readdirSync(dir)) {
        const tipo = TIPOS.find((t) => f.endsWith(`-${t}`));
        if (tipo) ids.add(f.slice(0, -tipo.length - 1));
      }
      return [...ids].sort().reverse();
    },

    async cacheLeer(clave) {
      return cache.get(clave) ?? null;
    },
    async cacheGuardar(clave, valor) {
      cache.set(clave, valor);
    },

    // Cuenta peticiones en una ventana de tiempo (para limitar intentos de contraseña)
    async contar(clave, segundos) {
      const ahora = Date.now();
      const c = contadores.get(clave);
      if (!c || c.hasta < ahora) {
        contadores.set(clave, { n: 1, hasta: ahora + segundos * 1000 });
        return 1;
      }
      return ++c.n;
    },

    // Valores sueltos (token de Instagram, enlaces de conexión), con caducidad opcional
    leer: leerValor,
    async guardar(clave, valor, segundos) {
      fs.mkdirSync(dirValores, { recursive: true });
      const hasta = segundos ? Date.now() + segundos * 1000 : null;
      fs.writeFileSync(archivoValor(clave), JSON.stringify({ valor, hasta }));
    },
    // Lee y borra a la vez: para lo que solo se puede usar una vez
    async tomar(clave) {
      const v = await leerValor(clave);
      fs.rmSync(archivoValor(clave), { force: true });
      return v;
    },
    async borrar(clave) {
      fs.rmSync(archivoValor(clave), { force: true });
    },
  };

  async function leerValor(clave) {
    try {
      const { valor, hasta } = JSON.parse(fs.readFileSync(archivoValor(clave), "utf8"));
      return hasta && hasta < Date.now() ? null : valor;
    } catch {
      return null;
    }
  }
}

// ── Upstash Redis (API REST, sin librerías) ─────────────────────────────
function almacenRedis(url, token) {
  const P = "sorteo:";

  async function redis(...comando) {
    let res, data;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(comando.map(String)),
        signal: AbortSignal.timeout(10000),
      });
      data = await res.json();
    } catch {
      throw error("No se pudo conectar con la base de datos");
    }
    if (data.error) throw error(`Base de datos: ${data.error}`);
    return data.result;
  }

  const leerJSON = async (clave) => {
    const v = await redis("GET", clave);
    return v == null ? null : JSON.parse(v);
  };

  return {
    tipo: "redis",

    leerEnCurso: () => leerJSON(`${P}en-curso`),
    async crearEnCurso(c) {
      return (await redis("SET", `${P}en-curso`, JSON.stringify(c), "NX")) === "OK";
    },
    async guardarEnCurso(c) {
      await redis("SET", `${P}en-curso`, JSON.stringify(c));
    },
    async borrarEnCurso() {
      await redis("DEL", `${P}en-curso`);
    },

    async guardarArchivo(id, tipo, contenido) {
      await redis("SET", `${P}archivo:${id}:${tipo}`, contenido);
      // Los ids empiezan por la fecha, así que ordenarlos alfabéticamente es ordenarlos por fecha
      await redis("ZADD", `${P}ids`, 0, id);
    },
    leerArchivo: (id, tipo) => redis("GET", `${P}archivo:${id}:${tipo}`),
    async listarIds() {
      return redis("ZREVRANGEBYLEX", `${P}ids`, "+", "-");
    },

    cacheLeer: (clave) => leerJSON(`${P}cache:${clave}`),
    async cacheGuardar(clave, valor) {
      await redis("SET", `${P}cache:${clave}`, JSON.stringify(valor), "EX", 6 * 3600);
    },

    async contar(clave, segundos) {
      const n = await redis("INCR", `${P}contador:${clave}`);
      if (n === 1) await redis("EXPIRE", `${P}contador:${clave}`, segundos);
      return n;
    },

    leer: (clave) => leerJSON(`${P}valor:${clave}`),
    async guardar(clave, valor, segundos) {
      const extra = segundos ? ["EX", segundos] : [];
      await redis("SET", `${P}valor:${clave}`, JSON.stringify(valor), ...extra);
    },
    async tomar(clave) {
      const v = await redis("GETDEL", `${P}valor:${clave}`);
      return v == null ? null : JSON.parse(v);
    },
    async borrar(clave) {
      await redis("DEL", `${P}valor:${clave}`);
    },
  };
}

// ── En Vercel sin base de datos: mejor fallar claro que perder un sorteo ──
function almacenSinConfigurar() {
  const falla = async () => {
    throw error("Falta conectar la base de datos (Upstash Redis) en Vercel. Mira la Guía de lanzamiento.");
  };
  return new Proxy({ tipo: "sin configurar" }, { get: (o, k) => (k in o || k === "then" ? o[k] : falla) });
}
