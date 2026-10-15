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

  useEffect(() => {
    api.status().then(setStatus).catch((e) => setError(e.message));
  }, []);

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

      {status && vista === "setup" && (
        <Setup
          post={post}
          setPost={setPost}
          config={config}
          setConfig={setConfig}
          configParaServidor={configParaServidor}
          preview={preview}
          setPreview={setPreview}
          onStart={() => setVista("stage")}
        />
      )}

      {vista === "stage" && post && (
        <Stage
          post={post}
          config={configParaServidor}
          pool={preview?.nombres || []}
          totalParticipantes={preview?.participantes || 0}
          onExit={() => {
            setVista("setup");
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}
