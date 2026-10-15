import { useEffect, useState } from "react";
import { api } from "./api.js";
import Setup from "./components/Setup.jsx";
import Stage from "./components/Stage.jsx";

const CONFIG_INICIAL = {
  ganadores: 1,
  minimoMenciones: 2,
  incluirRespuestas: false,
  fechaCierre: "",
  excluirUsuarios: "",
};

export default function App() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [vista, setVista] = useState("setup");
  const [post, setPost] = useState(null);
  const [config, setConfig] = useState(CONFIG_INICIAL);
  const [preview, setPreview] = useState(null);
  const [pendiente, setPendiente] = useState(null); // sorteo empezado y sin terminar, guardado en el servidor
  const [reanudando, setReanudando] = useState(null);

  const cargarPendiente = () =>
    api
      .current()
      .then((d) => setPendiente(d.sorteo))
      .catch((e) => setError(e.message));

  useEffect(() => {
    api.status().then(setStatus).catch((e) => setError(e.message));
    cargarPendiente();
  }, []);

  const cerrarPendiente = () => {
    if (!confirm("El sorteo quedará guardado como cancelado y no se podrá continuar. ¿Cerrarlo?")) return;
    api
      .cancel(pendiente.id)
      .then(() => setPendiente(null))
      .catch((e) => setError(e.message));
  };

  // datetime-local no lleva zona horaria: la convertimos a ISO con la del navegador
  const configParaServidor = {
    ...config,
    fechaCierre: config.fechaCierre ? new Date(config.fechaCierre).toISOString() : "",
  };

  return (
    <div className={`app ${vista === "stage" ? "app--stage" : ""}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden>✦</span>
          <span>Sorteo en directo</span>
        </div>
        {status && (
          <div className={`chip ${status.modo === "demo" ? "chip--demo" : ""}`}>
            {status.modo === "demo" ? "Modo demo" : `@${status.cuenta}`}
          </div>
        )}
      </header>

      {error && <div className="alert">{error}</div>}

      {status && vista === "setup" && pendiente && (
        <div className="pendiente">
          <div>
            <strong>Hay un sorteo sin terminar</strong>
            <p className="hint">
              Empezado el {new Date(pendiente.fechaSorteo).toLocaleString("es-ES")} ·{" "}
              {pendiente.progreso.ganadores.length}/{pendiente.ganadores} ganadores ·{" "}
              {pendiente.progreso.ganadores.length + pendiente.progreso.descartados.length} candidatos revisados
            </p>
          </div>
          <div className="pendiente__btns">
            <button className="btn btn--ghost" onClick={cerrarPendiente}>Cerrar sin terminar</button>
            <button
              className="btn btn--primary"
              onClick={() => {
                setReanudando(pendiente);
                setVista("stage");
              }}
            >
              Continuar sorteo
            </button>
          </div>
        </div>
      )}

      {status && vista === "setup" && (
        <Setup
          post={post}
          setPost={setPost}
          config={config}
          setConfig={setConfig}
          configParaServidor={configParaServidor}
          preview={preview}
          setPreview={setPreview}
          hayPendiente={Boolean(pendiente)}
          onStart={() => setVista("stage")}
        />
      )}

      {vista === "stage" && (reanudando || post) && (
        <Stage
          sorteoInicial={reanudando}
          post={reanudando ? reanudando.post : post}
          config={configParaServidor}
          pool={preview?.nombres || []}
          totalParticipantes={preview?.participantes || 0}
          onExit={() => {
            setVista("setup");
            setPreview(null);
            setReanudando(null);
            cargarPendiente();
          }}
        />
      )}
    </div>
  );
}
