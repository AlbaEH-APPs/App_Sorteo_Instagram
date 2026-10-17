import { useEffect, useState } from "react";
import { api } from "../api.js";

function fecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function hora(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function Setup({
  post,
  setPost,
  config,
  setConfig,
  configParaServidor,
  preview,
  setPreview,
  hayPendiente,
  onStart,
}) {
  const [posts, setPosts] = useState(null);
  const [siguiente, setSiguiente] = useState(null); // marca de la página siguiente, o null si no hay más
  const [cargandoMas, setCargandoMas] = useState(false);
  const [enlace, setEnlace] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [errorPosts, setErrorPosts] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .posts()
      .then((d) => {
        setPosts(d.posts);
        setSiguiente(d.siguiente);
      })
      .catch((e) => setErrorPosts(e.message));
  }, []);

  const cargarMas = () => {
    setCargandoMas(true);
    setErrorPosts("");
    api
      .posts(siguiente)
      .then((d) => {
        setPosts((actuales) => [...actuales, ...d.posts.filter((p) => !actuales.some((a) => a.id === p.id))]);
        setSiguiente(d.siguiente);
      })
      .catch((e) => setErrorPosts(e.message))
      .finally(() => setCargandoMas(false));
  };

  // Busca la publicación del enlace, la pone la primera de la lista y la deja elegida
  const buscar = (e) => {
    e.preventDefault();
    setBuscando(true);
    setErrorPosts("");
    api
      .buscarPost(enlace)
      .then(({ post: p }) => {
        setPosts((actuales) => [p, ...(actuales || []).filter((a) => a.id !== p.id)]);
        setPost(p);
        setEnlace("");
      })
      .catch((e) => setErrorPosts(e.message))
      .finally(() => setBuscando(false));
  };

  // El servidor guarda los comentarios descargados: recalcular solo vuelve a filtrar,
  // salvo con "Actualizar", que los descarga de nuevo
  const cargar = (refrescar) => {
    setCargando(true);
    setError("");
    return api
      .preview(post.id, configParaServidor, refrescar)
      .then(setPreview)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };

  // Recalcular participantes cuando cambia la publicación o la configuración
  const clave = JSON.stringify([post?.id, configParaServidor]);
  useEffect(() => {
    if (!post) return;
    setCargando(true);
    const t = setTimeout(() => cargar(false), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  const set = (k) => (e) =>
    setConfig({ ...config, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <main className="setup">
      <section className="panel">
        <h2 className="panel__title"><span>1</span> Elige la publicación</h2>
        <form className="buscar" onSubmit={buscar}>
          <input
            className="enlace"
            type="url"
            inputMode="url"
            placeholder="Pega el enlace del post"
            aria-label="Enlace de la publicación"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
          />
          <button className="btn btn--small" disabled={!enlace.trim() || buscando}>
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </form>
        {buscando && <p className="hint">Si la publicación es antigua, puede tardar unos segundos.</p>}
        {errorPosts && <div className="alert">{errorPosts}</div>}
        <p className="hint buscar__o">o elígela de la lista</p>
        {!posts && !errorPosts && <p className="muted">Cargando publicaciones…</p>}
        <div className="posts">
          {posts?.map((p) => (
            <button
              key={p.id}
              className={`post ${post?.id === p.id ? "post--active" : ""}`}
              onClick={() => setPost(p)}
            >
              <div className="post__img">
                {p.image ? <img src={p.image} alt="" loading="lazy" /> : <span aria-hidden>🎁</span>}
              </div>
              <div className="post__body">
                <p className="post__caption">{p.caption || "(sin texto)"}</p>
                <p className="post__meta">
                  {fecha(p.timestamp)} · {p.comments ?? "?"} comentarios · {p.likes ?? "?"} likes
                </p>
              </div>
            </button>
          ))}
          {siguiente && (
            <button className="btn btn--small" onClick={cargarMas} disabled={cargandoMas}>
              {cargandoMas ? "Cargando…" : "Cargar más publicaciones"}
            </button>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__title"><span>2</span> Bases del sorteo</h2>
        <div className="form">
          <label className="field">
            <span>Ganadores</span>
            <input type="number" min="1" max="50" value={config.ganadores} onChange={set("ganadores")} />
          </label>
          <label className="field">
            <span>Menciones mínimas por comentario</span>
            <input type="number" min="0" max="10" value={config.minimoMenciones} onChange={set("minimoMenciones")} />
          </label>
          <label className="field">
            <span>Cierre de participación <em>(opcional)</em></span>
            <input type="datetime-local" value={config.fechaCierre} onChange={set("fechaCierre")} />
          </label>
          <p className="hint">
            Seguir la cuenta y dar like se comprueban a mano, solo con quien salga elegido.
          </p>
        </div>
      </section>

      <section className="panel panel--summary">
        <h2 className="panel__title"><span>3</span> Participantes</h2>
        {!post && <p className="muted">Elige una publicación para ver cuántos participan.</p>}
        {post && (cargando || !preview) && !error && <p className="muted">Leyendo comentarios…</p>}
        {error && <div className="alert">{error}</div>}
        {post && preview && !cargando && (
          <>
            <div className="stats">
              <div className="stat">
                <strong>{preview.totalComentarios}</strong>
                <span>comentarios</span>
              </div>
              <div className="stat stat--hi">
                <strong>{preview.participantes}</strong>
                <span>participantes válidos</span>
              </div>
            </div>
            {Object.keys(preview.descartes).length > 0 && (
              <ul className="descartes">
                {Object.entries(preview.descartes).map(([m, n]) => (
                  <li key={m}>
                    <span>{m}</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="hint">Una participación por persona, aunque comente varias veces.</p>
            <p className="hint">
              Comentarios leídos a las {hora(preview.leidoEn)} ·{" "}
              <button className="linkbtn" onClick={() => cargar(true)}>Actualizar</button>
              <br />
              Al pulsar ¡Sortear! se vuelven a leer en ese momento.
            </p>
            <button
              className="btn btn--primary btn--block"
              disabled={!preview.participantes || hayPendiente}
              onClick={onStart}
            >
              Ir a la pantalla del sorteo →
            </button>
            {hayPendiente && <p className="hint">Termina o cierra el sorteo pendiente antes de empezar otro.</p>}
          </>
        )}
      </section>
    </main>
  );
}
