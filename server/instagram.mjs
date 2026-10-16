// Acceso a la API oficial de Instagram (Instagram API with Instagram Login)
const API = "https://graph.instagram.com";

function url(path, params, token) {
  const u = new URL(path.startsWith("http") ? path : `${API}${path}`);
  for (const [k, v] of Object.entries(params || {})) u.searchParams.set(k, v);
  if (!u.searchParams.has("access_token")) u.searchParams.set("access_token", token);
  return u.toString();
}

const ESPERAS = [1000, 3000]; // ms antes de cada reintento
const TIEMPO_MAXIMO = 20000; // ms por petición
const CODIGOS_TEMPORALES = new Set([1, 2]); // error desconocido / servicio no disponible por un momento

async function pedir(u, opciones = {}) {
  let res, data;
  try {
    res = await fetch(u, { ...opciones, signal: AbortSignal.timeout(TIEMPO_MAXIMO) });
    data = await res.json();
  } catch {
    // Sin conexión, tiempo agotado o respuesta que no es JSON (no se incluye la URL: lleva el token)
    throw Object.assign(new Error("Instagram no responde"), { status: 502, reintentable: true });
  }
  if (data.error) {
    const e = new Error(`Instagram: ${data.error.message} (código ${data.error.code})`);
    e.status = 502;
    e.reintentable = res.status >= 500 || data.error.is_transient === true || CODIGOS_TEMPORALES.has(data.error.code);
    throw e;
  }
  // Los errores del inicio de sesión vienen con otra forma
  if (data.error_message) {
    throw Object.assign(new Error(`Instagram: ${data.error_message} (${data.error_type || data.code})`), { status: 502 });
  }
  return data;
}

// Reintenta los fallos pasajeros; los demás (token caducado, límite de llamadas…) fallan a la primera
async function get(u) {
  for (let intento = 0; ; intento++) {
    try {
      return await pedir(u);
    } catch (e) {
      if (!e.reintentable || intento >= ESPERAS.length) throw e;
      console.warn(`${e.message} · reintento ${intento + 1} de ${ESPERAS.length}`);
      await new Promise((r) => setTimeout(r, ESPERAS[intento]));
    }
  }
}

async function allPages(first) {
  const items = [];
  let next = first;
  while (next) {
    const data = await get(next);
    items.push(...(data.data || []));
    next = data.paging?.next || null;
  }
  return items;
}

export function createInstagram(token) {
  return {
    async me() {
      return get(url("/me", { fields: "username,profile_picture_url" }, token));
    },

    async posts() {
      const data = await get(
        url(
          "/me/media",
          {
            fields: "id,caption,permalink,timestamp,comments_count,like_count,media_type,media_url,thumbnail_url",
            limit: "20",
          },
          token
        )
      );
      return data.data.map((m) => ({
        id: m.id,
        caption: m.caption || "",
        permalink: m.permalink,
        timestamp: m.timestamp,
        comments: m.comments_count ?? null,
        likes: m.like_count ?? null,
        image: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
      }));
    },

    async post(id) {
      return get(url(`/${id}`, { fields: "id,caption,permalink,timestamp" }, token));
    },

    async comments(postId, includeReplies) {
      const base = "id,text,timestamp,username,from{id,username}";
      const fields = includeReplies ? `${base},replies{${base}}` : base;
      const top = await allPages(url(`/${postId}/comments`, { fields, limit: "50" }, token));
      const all = [];
      for (const c of top) {
        all.push(c);
        if (includeReplies && c.replies) {
          all.push(...(c.replies.data || []));
          if (c.replies.paging?.next) all.push(...(await allPages(c.replies.paging.next)));
        }
      }
      return all.map((c) => ({
        id: c.id,
        username: (c.from?.username || c.username || "").toLowerCase(),
        text: c.text || "",
        timestamp: c.timestamp,
      }));
    },
  };
}

// ── Conectar una cuenta con "Iniciar sesión con Instagram" ─────────────────────────────
// Documentación: Instagram API with Instagram Login > Business Login for Instagram
export const PERMISOS = ["instagram_business_basic", "instagram_business_manage_comments"];

export function urlAutorizacion({ appId, redirectUri, estado }) {
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", appId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", PERMISOS.join(","));
  u.searchParams.set("state", estado);
  return u.toString();
}

// Cambia el código que devuelve Instagram por un token de 60 días. El código solo vale una vez,
// así que este primer paso no se reintenta.
export async function obtenerToken({ appId, appSecret, redirectUri, codigo }) {
  const corto = await pedir("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code: codigo.replace(/#_$/, ""),
    }),
  });
  const tokenCorto = corto.data?.[0]?.access_token || corto.access_token;
  if (!tokenCorto) throw Object.assign(new Error("Instagram no ha devuelto el permiso"), { status: 502 });
  const largo = await get(
    url("/access_token", { grant_type: "ig_exchange_token", client_secret: appSecret }, tokenCorto)
  );
  return { token: largo.access_token, segundos: largo.expires_in };
}

// Da otros 60 días a un token que tenga más de 24 horas y no haya caducado
export async function renovarToken(token) {
  const r = await get(url("/refresh_access_token", { grant_type: "ig_refresh_token" }, token));
  return { token: r.access_token, segundos: r.expires_in };
}
