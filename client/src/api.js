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
  preview: (postId, config) => request("POST", "/api/preview", { postId, config }),
  draw: (postId, config) => request("POST", "/api/draw", { postId, config }),
  finish: (payload) => request("POST", "/api/draw/finish", payload),
};
