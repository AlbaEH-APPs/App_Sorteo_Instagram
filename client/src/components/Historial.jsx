import { useEffect, useState } from "react";
import { api } from "../api.js";
import { confirmar } from "./Confirmar.jsx";

const NOMBRES = { "orden.json": "Orden", "comentarios.csv": "Comentarios (CSV)", "resultado.json": "Resultado" };

function fecha(iso) {
  return iso ? new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" }) : "";
}

export default function Historial({ onVolver }) {
  const [sorteos, setSorteos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .historial()
      .then((d) => setSorteos(d.sorteos))
      .catch((e) => setError(e.message));
  }, []);

  // Los sorteos reales piden una confirmación más clara: sus archivos son la prueba del sorteo
  const borrar = async (s) => {
    const real = s.modo !== "demo";
    const ok = await confirmar({
      titulo: real ? "¿Borrar este sorteo real?" : "¿Borrar este sorteo de prueba?",
      texto: real
        ? [
            `Sorteo del ${fecha(s.fecha)}. Sus archivos son la prueba de cómo se eligió al ganador.`,
            "Si quieres conservarlos, descárgalos antes. Esto no se puede deshacer.",
          ]
        : `Sorteo del ${fecha(s.fecha)}. Se borrarán sus archivos.`,
      aceptar: "Sí, borrar",
      peligro: true,
    });
    if (!ok) return;
    setError("");
    api
      .borrarSorteo(s.id)
      .then(() => setSorteos((lista) => lista.filter((x) => x.id !== s.id)))
      .catch((e) => setError(e.message));
  };

  return (
    <main className="historial">
      <div className="historial__head">
        <h2 className="panel__title">Historial de sorteos</h2>
        <button className="btn btn--ghost" onClick={onVolver}>← Volver</button>
      </div>
      {error && <div className="alert">{error}</div>}
      {!sorteos && !error && <p className="muted">Cargando…</p>}
      {sorteos?.length === 0 && <p className="muted">Todavía no hay sorteos.</p>}
      {sorteos?.map((s) => (
        <section key={s.id} className="panel sorteo">
          <div className="sorteo__top">
            <strong>{fecha(s.fecha)}</strong>
            <span className={`chip chip--${s.estado.replace(" ", "-")}`}>{s.estado}</span>
            {s.modo === "demo" && <span className="chip chip--demo">demo</span>}
          </div>
          <p className="hint">
            {s.participantes} participantes
            {s.ganadores.length > 0 && <> · Ganadores: {s.ganadores.map((g) => `@${g}`).join(", ")}</>}
          </p>
          {s.publicacion && (
            <p className="hint">
              <a href={s.publicacion} target="_blank" rel="noreferrer">Ver publicación ↗</a>
            </p>
          )}
          <div className="sorteo__files">
            {s.archivos.map((t) => (
              <a key={t} className="btn btn--small" href={api.archivoUrl(s.id, t)} download>
                ⬇ {NOMBRES[t]}
              </a>
            ))}
            {s.estado !== "en curso" && (
              <button className="btn btn--small btn--borrar" onClick={() => borrar(s)}>
                Borrar
              </button>
            )}
          </div>
          {s.estado === "en curso" && <p className="hint">Para borrarlo, primero termínalo o ciérralo.</p>}
        </section>
      ))}
    </main>
  );
}
