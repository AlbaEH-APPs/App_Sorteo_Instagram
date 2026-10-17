import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import Reel from "./Reel.jsx";
import Confetti from "./Confetti.jsx";
import Logo from "./Logo.jsx";
import { MARCA } from "../marca.js";

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
// Pausa antes del veredicto, para que en la grabación se vean bien todos los requisitos marcados
const PAUSA = 1000;

export default function Stage({ sorteoInicial, cuenta, post, config, pool, totalParticipantes, onExit }) {
  const [inicio] = useState(() => estadoInicial(sorteoInicial));
  const [draw, setDraw] = useState(inicio.draw);
  const [idx, setIdx] = useState(inicio.idx);
  const [fase, setFase] = useState(inicio.fase);
  const [spinId, setSpinId] = useState(0);
  const [checks, setChecks] = useState({ sigue: null, like: null });
  const [ganadores, setGanadores] = useState(inicio.ganadores);
  const [descartados, setDescartados] = useState(inicio.descartados);
  const [error, setError] = useState("");
  const [confetti, setConfetti] = useState(0);
  const guardando = useRef(false);
  const ultimoGuardado = useRef(Promise.resolve());
  const decidiendo = useRef(false);

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

  // Cada requisito se responde una sola vez. Con el último (o con un "No") se espera un momento
  // y se da el veredicto.
  const responder = (k, v) => {
    if (decidiendo.current || checks[k] !== null) return;
    const nuevo = { ...checks, [k]: v };
    setChecks(nuevo);
    const fin = (k === "sigue" && v === false) || (nuevo.sigue !== null && nuevo.like !== null);
    if (!fin) return;
    decidiendo.current = true;
    setTimeout(() => {
      decidiendo.current = false;
      decidir(nuevo);
    }, PAUSA);
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
      const motivo = c.sigue === false ? "no sigue la cuenta" : "no ha dado me gusta";
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
      .catch((e) => setError(e.message));
  }, [fase]); // eslint-disable-line react-hooks/exhaustive-deps

  // La pantalla sigue sola lo que está pasando (el requisito que se comprueba y después el veredicto),
  // para que en una grabación se vea sin tener que desplazarse a mano
  const verificando = fase === "verify" || fase === "winner" || fase === "rejected";
  useEffect(() => {
    if (!verificando) return;
    const t = setTimeout(() => {
      const el = document.querySelector(fase === "verify" ? ".req--actual" : ".verdict");
      const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "center" });
    }, 400);
    return () => clearTimeout(t);
  }, [fase, checks.sigue, checks.like]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <main className={`stage ${verificando ? "stage--verificando" : ""}`}>
      <Confetti fireId={confetti} />

      <div className="stage__head">
        <p className="eyebrow">Sorteo de {MARCA.nombre}</p>
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
              <div className="ready__orb">
                <Logo grande />
              </div>
              <button className="btn btn--huge" onClick={girar} disabled={fase === "loading"}>
                {fase === "loading" ? "Leyendo comentarios…" : idx === 0 ? "¡Sortear!" : "Siguiente"}
              </button>
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
                  {candidato.text && <Comentario c={candidato} />}

                  <Requisitos
                    candidato={candidato}
                    cuenta={cuenta}
                    minimo={draw.minimoMenciones}
                    permalink={draw.post.permalink}
                    checks={checks}
                    activo={fase === "verify"}
                    onResponder={responder}
                  />

                  {fase === "winner" && (
                    <div className="verdict verdict--win">
                      <span className="verdict__badge">
                        ¡Enhorabuena!{objetivo > 1 ? ` · Premio ${ganadores.length}` : ""} ♥
                      </span>
                      <button className="btn btn--primary" onClick={siguiente}>
                        {completo ? "Ver resultado final" : "Sortear el siguiente premio →"}
                      </button>
                    </div>
                  )}

                  {fase === "rejected" && (
                    <div className="verdict verdict--out">
                      <span className="verdict__badge">No cumple las bases</span>
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
          <p className="eyebrow">{ganadores.length ? "¡Enhorabuena!" : "Resultado"}</p>
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
        </div>
      )}

      <footer className="stage__foot">
        <button className="btn btn--ghost" onClick={onExit}>← Volver</button>
        {document.fullscreenEnabled && (
          <button className="btn btn--ghost" onClick={pantallaCompleta}>Pantalla completa</button>
        )}
      </footer>
    </main>
  );
}

// Menciones distintas de un comentario, sin contar a quien comenta (como el filtro del sorteo)
function mencionesDe(c) {
  return new Set(
    (c.text.match(/@[\w.]+/g) || [])
      .map((m) => m.slice(1).toLowerCase().replace(/\.+$/, ""))
      .filter((u) => u && u !== c.username)
  );
}

// Requisitos de las bases, de uno en uno, pensados para que se entiendan en una grabación de pantalla.
// Las menciones las comprueba la app; seguir la cuenta y el "me gusta" se miran a mano en Instagram,
// porque la API de Instagram no permite consultarlos.
function Requisitos({ candidato, cuenta, minimo, permalink, checks, activo, onResponder }) {
  const n = mencionesDe(candidato).size;
  const pasos = [];
  if (minimo !== 0) {
    pasos.push({
      clave: "menciones",
      titulo: minimo ? `Menciona a ${minimo} ${minimo === 1 ? "amigo" : "amigos"}` : "Menciona a sus amigos",
      estado: "ok",
      ok: `Comprobado por la app: menciona a ${n} ${n === 1 ? "persona" : "personas"}`,
    });
  }
  pasos.push({
    clave: "sigue",
    titulo: `Sigue a @${cuenta || "la cuenta"}`,
    enlace: `https://www.instagram.com/${candidato.username}/`,
    textoEnlace: "Ver su perfil",
    ok: "Sí, sigue la cuenta",
    ko: "No sigue la cuenta",
  });
  pasos.push({
    clave: "like",
    titulo: "Ha dado me gusta a la publicación",
    enlace: permalink,
    textoEnlace: "Ver la publicación",
    ok: "Sí, ha dado me gusta",
    ko: "No ha dado me gusta",
  });

  const estadoDe = (p) => {
    if (p.estado) return p.estado;
    const v = checks[p.clave];
    if (v === true) return "ok";
    if (v === false) return "ko";
    if (p.clave === "like" && checks.sigue === false) return "omitido";
    const actual = p.clave === "sigue" ? checks.sigue === null : checks.sigue === true;
    return activo && actual ? "actual" : "espera";
  };
  const detalle = { actual: "Comprobando", espera: "Pendiente", omitido: "No hace falta comprobarlo" };

  return (
    <div className="requisitos" aria-live="polite">
      <p className="requisitos__titulo">¿Cumple las bases?</p>
      <ol className="req-lista">
        {pasos.map((p, i) => {
          const estado = estadoDe(p);
          return (
            <li key={p.clave} className={`req req--${estado}`} style={{ "--retraso": `${i * 150}ms` }}>
              <span className="req__icono" aria-hidden>
                {estado === "ok" ? (
                  <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                ) : estado === "ko" ? (
                  <svg viewBox="0 0 24 24"><path d="M7 7l10 10" /><path d="M17 7L7 17" /></svg>
                ) : (
                  i + 1
                )}
              </span>
              <div className="req__cuerpo">
                <p className="req__titulo">{p.titulo}</p>
                <p className={`req__detalle ${estado === "actual" ? "puntos" : ""}`}>
                  {estado === "ok" ? p.ok : estado === "ko" ? p.ko : detalle[estado]}
                </p>
              </div>
              {estado === "actual" && (
                <div className="req__acciones">
                  <a className="btn btn--small req__ver" href={p.enlace} target="_blank" rel="noreferrer">
                    {p.textoEnlace} ↗
                  </a>
                  <div className="req__botones">
                    <button className="req__si" onClick={() => onResponder(p.clave, true)}>✓ Sí</button>
                    <button className="req__no" onClick={() => onResponder(p.clave, false)}>✗ No</button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// El comentario con el que participa: cuándo lo escribió, el texto con las menciones resaltadas
// y a cuántas personas distintas menciona (lo que piden las bases)
function Comentario({ c }) {
  const partes = c.text.split(/(@[\w.]+)/g);
  const menciones = mencionesDe(c);
  const cuando = c.timestamp
    ? new Date(c.timestamp).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "";
  return (
    <div className="comentario">
      <p className="comentario__cab">
        Ha participado con este comentario{cuando && <span> · {cuando}</span>}
      </p>
      <p className="comentario__texto">
        {partes.map((t, i) => (t.startsWith("@") ? <span key={i} className="mencion">{t}</span> : t))}
      </p>
      {menciones.size > 0 && (
        <p className="comentario__pie">
          Menciona a {menciones.size} {menciones.size === 1 ? "persona" : "personas"}
        </p>
      )}
    </div>
  );
}
