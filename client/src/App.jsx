import { useEffect, useState } from "react";
import { api, onSesionCaducada } from "./api.js";
import Setup from "./components/Setup.jsx";
import Stage from "./components/Stage.jsx";
import Login from "./components/Login.jsx";
import Historial from "./components/Historial.jsx";
import Instagram from "./components/Instagram.jsx";
import Logo from "./components/Logo.jsx";
import { MARCA } from "./marca.js";
import { confirmar } from "./components/Confirmar.jsx";

const CONFIG_INICIAL = {
  ganadores: 1,
  minimoMenciones: 2,
  fechaCierre: "",
};

export default function App() {
  const [sesion, setSesion] = useState(null); // { necesitaLogin, autenticado }
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

  const cargar = () => {
    setError("");
    api.status().then(setStatus).catch((e) => setError(e.message));
    cargarPendiente();
  };

  useEffect(() => {
    // Si la sesión caduca (o se cambia la contraseña), se vuelve a pedir. Un sorteo a medias
    // no se pierde: al entrar de nuevo aparece como pendiente para continuarlo.
    onSesionCaducada(() => {
      setSesion((s) => ({ ...s, autenticado: false }));
      setVista("setup");
      setReanudando(null);
    });
    api
      .session()
      .then((s) => {
        setSesion(s);
        if (s.autenticado) cargar();
      })
      .catch((e) => setError(e.message));
  }, []);

  // Aviso si la cuenta de Instagram conectada con enlace ha caducado, va a caducar sin haberse podido
  // renovar (la app lo intenta cuando quedan menos de 50 días; con 10 o menos es que lleva tiempo fallando)
  // o Instagram ha retirado el permiso
  const avisoInstagram = (() => {
    const ig = status?.instagram;
    const c = ig?.conectada;
    if (!ig) return null;
    if (c?.caducada && ig.origen !== "variable") {
      return `El permiso de Instagram de @${c.usuario} ha caducado. La app está en modo demo hasta que vuelvas a conectar la cuenta.`;
    }
    if (ig.error && status.modo === "instagram") {
      return "Instagram no deja leer la cuenta: puede que se haya retirado el permiso. Conecta la cuenta de nuevo.";
    }
    if (c && !c.caducada && c.diasRestantes <= 10) {
      const cuando = c.diasRestantes === 0 ? "hoy" : c.diasRestantes === 1 ? "mañana" : `en ${c.diasRestantes} días`;
      return `El permiso de Instagram de @${c.usuario} caduca ${cuando} y no se ha podido renovar solo. Conecta la cuenta de nuevo para no perderlo.`;
    }
    return null;
  })();

  const salir = () => {
    api.logout().finally(() => {
      setSesion((s) => ({ ...s, autenticado: false }));
      setStatus(null);
    });
  };

  const cerrarPendiente = async () => {
    const ok = await confirmar({
      titulo: "¿Cerrar el sorteo sin terminar?",
      texto: "Quedará guardado como cancelado, con lo que se haya revisado hasta ahora, y ya no se podrá continuar.",
      aceptar: "Sí, cerrar",
      peligro: true,
    });
    if (!ok) return;
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
          <Logo />
          <div className="brand__texto">
            <span className="brand__nombre">{MARCA.nombre}</span>
            <span className="brand__firma">by {MARCA.firma} · sorteos</span>
          </div>
        </div>
        <div className="topbar__right">
          {status && (
            <div className={`chip ${status.modo === "demo" ? "chip--demo" : status.cuenta ? "" : "chip--cancelado"}`}>
              {status.modo === "demo" ? "Modo demo" : status.cuenta ? `@${status.cuenta}` : "Instagram: error"}
            </div>
          )}
          {sesion?.autenticado && status && vista === "setup" && (
            <>
              <button className="btn btn--ghost btn--small" onClick={() => setVista("instagram")}>Instagram</button>
              <button className="btn btn--ghost btn--small" onClick={() => setVista("historial")}>Historial</button>
            </>
          )}
          {sesion?.autenticado && sesion.necesitaLogin && vista !== "stage" && (
            <button className="btn btn--ghost btn--small" onClick={salir}>Salir</button>
          )}
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      {sesion && !sesion.autenticado && (
        <Login
          onLogin={() => {
            setSesion((s) => ({ ...s, autenticado: true }));
            cargar();
          }}
        />
      )}

      {sesion?.autenticado && vista === "historial" && <Historial onVolver={() => setVista("setup")} />}

      {sesion?.autenticado && status && vista === "instagram" && (
        <Instagram
          status={status}
          onVolver={() => setVista("setup")}
          onCambio={() => {
            // Otra cuenta: lo elegido de la anterior ya no vale
            setPost(null);
            setPreview(null);
            api.status().then(setStatus).catch((e) => setError(e.message));
          }}
        />
      )}

      {sesion?.autenticado && status && vista === "setup" && avisoInstagram && (
        <div className="aviso">
          <p>{avisoInstagram}</p>
          <button className="btn btn--primary btn--small" onClick={() => setVista("instagram")}>
            Conectar de nuevo
          </button>
        </div>
      )}

      {sesion?.autenticado && status && vista === "setup" && pendiente && (
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

      {sesion?.autenticado && status && vista === "setup" && (
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

      {sesion?.autenticado && vista === "stage" && (reanudando || post) && (
        <Stage
          sorteoInicial={reanudando}
          cuenta={status?.cuenta}
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
