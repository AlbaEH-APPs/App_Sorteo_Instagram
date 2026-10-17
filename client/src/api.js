// Se avisa a la App cuando la sesión caduca, para volver a pedir la contraseña
let alCaducarSesion = () => {};
export const onSesionCaducada = (fn) => (alCaducarSesion = fn);

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
    body: method === "POST" ? JSON.stringify(body || {}) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está arrancado (npm run server)?");
  }
  if (res.status === 401 && url !== "/api/login") alCaducarSesion();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  session: () => request("GET", "/api/session"),
  login: (password) => request("POST", "/api/login", { password }),
  logout: () => request("POST", "/api/logout"),
  status: () => request("GET", "/api/status"),
  posts: (despues) => request("GET", `/api/posts${despues ? `?despues=${encodeURIComponent(despues)}` : ""}`),
  buscarPost: (enlace) => request("GET", `/api/posts/buscar?enlace=${encodeURIComponent(enlace)}`),
  preview: (postId, config, refrescar = false) => request("POST", "/api/preview", { postId, config, refrescar }),
  current: () => request("GET", "/api/draw/current"),
  draw: (postId, config) => request("POST", "/api/draw", { postId, config }),
  progress: (payload) => request("POST", "/api/draw/progress", payload),
  finish: (payload) => request("POST", "/api/draw/finish", payload),
  cancel: (id) => request("POST", "/api/draw/cancel", { id }),
  historial: () => request("GET", "/api/historial"),
  borrarSorteo: (id) => request("POST", "/api/historial/borrar", { id }),
  archivoUrl: (id, tipo) => `/api/archivo?id=${encodeURIComponent(id)}&tipo=${encodeURIComponent(tipo)}`,
};

export const instagram = {
  crearEnlace: (directo = false) => request("POST", "/api/ig/enlace", { directo }),
  desconectar: () => request("POST", "/api/ig/desconectar"),
};
