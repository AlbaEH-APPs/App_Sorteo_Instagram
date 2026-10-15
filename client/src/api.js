async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("No se pudo conectar con el servidor. ¿Está arrancado (npm run server)?");
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  status: () => request("GET", "/api/status"),
  posts: () => request("GET", "/api/posts"),
  preview: (postId, config, refrescar = false) => request("POST", "/api/preview", { postId, config, refrescar }),
  current: () => request("GET", "/api/draw/current"),
  draw: (postId, config) => request("POST", "/api/draw", { postId, config }),
  progress: (payload) => request("POST", "/api/draw/progress", payload),
  finish: (payload) => request("POST", "/api/draw/finish", payload),
  cancel: (id) => request("POST", "/api/draw/cancel", { id }),
};
