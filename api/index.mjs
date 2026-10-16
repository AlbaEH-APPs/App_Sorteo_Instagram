// Punto de entrada en Vercel: todas las rutas /api/... llegan aquí (ver vercel.json).
// En Vercel no hay disco permanente: los datos se guardan en Upstash Redis (server/almacen.mjs).
import { crearApp } from "../server/app.mjs";

export default crearApp({ dirResultados: "/tmp/resultados" });
