import crypto from "node:crypto";

export const DEFAULTS = {
  ganadores: 1,
  minimoMenciones: 2,
  incluirRespuestas: false,
  fechaCierre: "",
  excluirUsuarios: [],
};

export function normalizarConfig(input = {}) {
  const c = { ...DEFAULTS, ...input };
  c.ganadores = Math.max(1, Math.min(50, parseInt(c.ganadores, 10) || 1));
  c.minimoMenciones = Math.max(0, Math.min(10, parseInt(c.minimoMenciones, 10) || 0));
  c.incluirRespuestas = Boolean(c.incluirRespuestas);
  c.fechaCierre = typeof c.fechaCierre === "string" ? c.fechaCierre : "";
  c.excluirUsuarios = (Array.isArray(c.excluirUsuarios) ? c.excluirUsuarios : String(c.excluirUsuarios).split(/[\s,]+/))
    .map((u) => String(u).replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);
  return c;
}

function mencionesDistintas(texto, autor, cuentaPropia) {
  const encontradas = (texto || "").match(/@([a-z0-9._]+)/gi) || [];
  return new Set(
    encontradas
      .map((m) => m.slice(1).toLowerCase().replace(/\.+$/, ""))
      .filter((u) => u && u !== autor && u !== cuentaPropia)
  ).size;
}

function motivo(c, cuentaPropia, cfg) {
  if (!c.username) return "sin usuario";
  if (c.username === cuentaPropia) return "cuenta organizadora";
  if (cfg.excluirUsuarios.includes(c.username)) return "usuario excluido";
  if (cfg.fechaCierre && new Date(c.timestamp) > new Date(cfg.fechaCierre)) return "fuera de plazo";
  const n = mencionesDistintas(c.text, c.username, cuentaPropia);
  if (n < cfg.minimoMenciones) return n === 1 ? "1 mención" : `${n} menciones`;
  return null;
}

// Devuelve un participante por usuario (su primer comentario válido) y el registro completo
export function filtrar(comentarios, cuentaPropia, cfg) {
  const registro = [];
  const porUsuario = new Map();
  for (const c of comentarios) {
    const m = motivo(c, cuentaPropia, cfg);
    registro.push({ ...c, valido: !m, motivo: m || "" });
    if (!m && !porUsuario.has(c.username)) porUsuario.set(c.username, c);
  }
  return { participantes: [...porUsuario.values()], registro };
}

// Fisher-Yates con aleatoriedad criptográfica
export function barajar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
