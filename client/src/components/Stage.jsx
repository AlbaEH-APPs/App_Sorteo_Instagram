import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import Reel from "./Reel.jsx";
import Confetti from "./Confetti.jsx";

// Estado de partida. Al reanudar un sorteo guardado se sigue justo después del último candidato
// ya decidido: el orden está fijado, así que el siguiente siempre es el mismo.
function estadoInicial(s) {
  if (!s) return { draw: null, idx: 0, fase: "idle", ganadores: [], descartados: [] };
  const porNombre = new Map(s.orden.map((o) => [o.username, o]));
  const ganadores = s.progreso.ganadores.map((u) => porNombre.get(u));
  const descartados = s.progreso.descartados;
  const revisados = ganadores.length + descartados.length;
  const terminado = ganadores.length >= s.ganadores || revisados >= s.orden.length;
  return { draw: s, idx: terminado ? revisados - 1 : revisados, fase: terminado ? "final" : "idle", ganadores, descartados };
}

// Fases: idle → spinning → verify → (winner | rejected) → ... → final
export default function Stage({ sorteoInicial, post, config, pool, totalParticipantes, onExit }) {
  const [inicio] = useState(() => estadoInicial(sorteoInicial));
  const [draw, setDraw] = useState(inicio.draw);
  const [idx, setIdx] = useState(inicio.idx);
  const [fase, setFase] = useState(inicio.fase);
  const [spinId, setSpinId] = useState(0);
  const [checks, setChecks] = useState({ sigue: null, like: null });
  const [ganadores, setGanadores] = useState(inicio.ganadores);
  const [descartados, setDescartados] = useState(inicio.descartados);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState("");
  const [confetti, setConfetti] = useState(0);
  const guardando = useRef(false);
  const ultimoGuardado = useRef(Promise.resolve());

  const candidato = draw?.orden[idx];
  const objetivo = draw ? draw.ganadores : Number(config.ganadores) || 1;
  const nombres = draw ? draw.orden.map((o) => o.username) : pool;

  const girar = useCallback(async () => {
    setError("");
    try {
      let d = draw;
      if (!d) {
        setFase("loading");
        d = await api.draw(post.id, config); // comentarios descargados AHORA y orden fijado
        setDraw(d);
      }
      setChecks({ sigue: null, like: null });
      setFase("spinning");
      setSpinId((n) => n + 1);
    } catch (e) {
      setError(e.message);
      setFase("idle");
    }
  }, [draw, post.id, config]);

  const responder = (k, v) => {
    const nuevo = { ...checks, [k]: v };
    setChecks(nuevo);
    if (k === "sigue" && v === false) return decidir({ sigue: false, like: null });
    if (nuevo.sigue !== null && nuevo.like !== null) decidir(nuevo);
  };

  const decidir = (c) => {
    let g = ganadores;
    let d = descartados;
    if (c.sigue && c.like) {
      g = [...ganadores, candidato];
      setGanadores(g);
      setFase("winner");
      setConfetti((n) => n + 1);
    } else {
      const motivo = c.sigue === false ? "no sigue la cuenta" : "no ha dado like";
      d = [...descartados, { username: candidato.username, motivo }];
      setDescartados(d);
      setFase("rejected");
    }
    // Cada decisión queda guardada en el servidor para poder reanudar el sorteo
    ultimoGuardado.current = api
      .progress({ id: draw.id, ganadores: g.map((x) => x.username), descartados: d })
      .catch((e) => setError(`No se pudo guardar el progreso: ${e.message}`));
  };

  const completo = ganadores.length >= objetivo;
  const agotado = draw && idx + 1 >= draw.orden.length;

  const siguiente = () => {
    if (completo || agotado) return setFase("final");
    setIdx((i) => i + 1);
    setTimeout(girar, 0);
  };

  // Guardar el resultado al terminar
  useEffect(() => {
    if (fase !== "final" || !draw || guardando.current) return;
    guardando.current = true;
    ultimoGuardado.current
      .then(() => api.finish({ id: draw.id, ganadores: ganadores.map((g) => g.username), descartados }))
      .then((r) => setGuardado(r.archivo))
      .catch((e) => setError(e.message));
  }, [fase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Barra espaciadora: girar / siguiente
  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== "Space" || e.target.tagName === "INPUT") return;
      e.preventDefault();
      if (fase === "idle") girar();
      else if (fase === "winner" || fase === "rejected") siguiente();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const suplentes = draw ? draw.orden.slice(idx + 1, idx + 4) : [];

  return (
    <main className="stage">
      <Confetti fireId={confetti} />

      <div className="stage__head">
        <p className="eyebrow">Sorteo en directo</p>
        <h1 className="stage__title">{post.caption?.split("\n")[0]?.slice(0, 90) || "Sorteo"}</h1>
        <div className="stage__meta">
          <span>{draw ? draw.orden.length : totalParticipantes} participantes</span>
          <span>·</span>
          <span>
            {ganadores.length}/{objetivo} ganador{objetivo > 1 ? "es" : ""}
          </span>
          {idx > 0 && (
            <>
              <span>·</span>
              <span>candidato nº {idx + 1}</span>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert">{error}</div>}

      {fase !== "final" && (
        <div className="stage__center">
          {(fase === "idle" || fase === "loading") && (
            <div className="ready">
              <div className="ready__orb" aria-hidden>🎁</div>
              <button className="btn btn--huge" onClick={girar} disabled={fase === "loading"}>
                {fase === "loading" ? "Leyendo comentarios…" : idx === 0 ? "¡Sortear!" : "Siguiente"}
              </button>
              <p className="muted small">Pulsa el botón o la barra espaciadora</p>
              {sorteoInicial && idx > 0 && (
                <p className="muted small">Sorteo reanudado: se sigue con el mismo orden que se fijó al sortear.</p>
              )}
            </div>
          )}

          {fase !== "idle" && fase !== "loading" && candidato && (
            <>
              <Reel pool={nombres} target={candidato.username} spinId={spinId} onDone={() => setFase("verify")} />

              {fase !== "spinning" && (
                <div className={`card card--${fase}`}>
                  {candidato.text && <p className="card__comment">“{candidato.text}”</p>}

                  {fase === "verify" && (
                    <>
                      <div className="verify">
                        <Pregunta label="¿Te sigue?" valor={checks.sigue} onChange={(v) => responder("sigue", v)} />
                        <Pregunta
                          label="¿Ha dado like?"
                          valor={checks.like}
                          disabled={checks.sigue !== true}
                          onChange={(v) => responder("like", v)}
                        />
                      </div>
                      <div className="links">
                        <a href={`https://www.instagram.com/${candidato.username}/`} target="_blank" rel="noreferrer">
                          Ver perfil ↗
                        </a>
                        <a href={draw.post.permalink} target="_blank" rel="noreferrer">
                          Ver publicación ↗
                        </a>
                      </div>
                    </>
                  )}

                  {fase === "winner" && (
                    <div className="verdict verdict--win">
                      <span className="verdict__badge">¡Ganador{objetivo > 1 ? ` nº ${ganadores.length}` : ""}!</span>
                      <button className="btn btn--primary" onClick={siguiente}>
                        {completo ? "Ver resultado final" : "Sortear el siguiente premio →"}
                      </button>
                    </div>
                  )}

                  {fase === "rejected" && (
                    <div className="verdict verdict--out">
                      <span className="verdict__badge">Descartado · {descartados.at(-1)?.motivo}</span>
                      <button className="btn btn--primary" onClick={siguiente}>
                        {agotado ? "No quedan participantes" : "Siguiente candidato →"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {fase === "final" && (
        <div className="final">
          <p className="eyebrow">Resultado</p>
          {ganadores.length === 0 && <p className="final__none">Ningún candidato cumplió todas las bases.</p>}
          <ol className="winners">
            {ganadores.map((g, i) => (
              <li key={g.username}>
                <span className="winners__n">{i + 1}</span>
                <span className="winners__name">@{g.username}</span>
              </li>
            ))}
          </ol>
          {ganadores.length > 0 && ganadores.length < objetivo && (
            <p className="muted">Solo {ganadores.length} de {objetivo} premios tienen ganador.</p>
          )}
          {suplentes.length > 0 && (
            <div className="subs">
              <p className="muted small">Suplentes (sin verificar todavía)</p>
              <p>{suplentes.map((s) => `@${s.username}`).join("  ·  ")}</p>
            </div>
          )}
          {descartados.length > 0 && (
            <p className="muted small">
              Descartados en la verificación: {descartados.map((d) => `@${d.username}`).join(", ")}
            </p>
          )}
          {guardado && <p className="muted small">Guardado en {guardado}</p>}
        </div>
      )}

      <footer className="stage__foot">
        <button className="btn btn--ghost" onClick={onExit}>← Volver</button>
        <button className="btn btn--ghost" onClick={pantallaCompleta}>Pantalla completa</button>
      </footer>
    </main>
  );
}

function Pregunta({ label, valor, onChange, disabled }) {
  return (
    <div className={`q ${disabled ? "q--disabled" : ""}`}>
      <span className="q__label">{label}</span>
      <div className="q__btns">
        <button className={`pill ${valor === true ? "pill--yes" : ""}`} disabled={disabled} onClick={() => onChange(true)}>
          Sí
        </button>
        <button className={`pill ${valor === false ? "pill--no" : ""}`} disabled={disabled} onClick={() => onChange(false)}>
          No
        </button>
      </div>
    </div>
  );
}
