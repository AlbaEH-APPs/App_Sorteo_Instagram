import { useState } from "react";
import { instagram } from "../api.js";
import { confirmar } from "./Confirmar.jsx";

function fecha(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// Cuenta de Instagram conectada y enlace para conectarla desde el móvil de quien la tiene
export default function Instagram({ status, onCambio, onVolver }) {
  const [enlace, setEnlace] = useState(null);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [yendo, setYendo] = useState(false);
  const ig = status.instagram;

  // Conectar aquí mismo: va a Instagram en esta pestaña y, al dar permiso, la página ofrece volver a la app
  const conectarAqui = () => {
    setError("");
    setYendo(true);
    instagram
      .crearEnlace(true)
      .then((e) => location.assign(e.url))
      .catch((e) => {
        setError(e.message);
        setYendo(false);
      });
  };

  const crear = () => {
    setError("");
    instagram
      .crearEnlace()
      .then(setEnlace)
      .catch((e) => setError(e.message));
  };

  const compartir = async () => {
    const texto = "Abre este enlace para conectar tu cuenta de Instagram a la app del sorteo:";
    try {
      if (navigator.share) return await navigator.share({ title: "Conectar Instagram", text: texto, url: enlace.url });
      await navigator.clipboard.writeText(enlace.url);
      setAviso("Enlace copiado");
    } catch {
      // Compartir cancelado: no pasa nada
    }
  };

  const copiar = () =>
    navigator.clipboard
      .writeText(enlace.url)
      .then(() => setAviso("Enlace copiado"))
      .catch(() => setAviso("No se pudo copiar: mantén pulsado el enlace para copiarlo"));

  const desconectar = async () => {
    const ok = await confirmar({
      titulo: `¿Desconectar @${ig.conectada.usuario}?`,
      texto: "La app dejará de poder leer sus comentarios hasta que se vuelva a conectar con un enlace.",
      aceptar: "Sí, desconectar",
      peligro: true,
    });
    if (!ok) return;
    instagram
      .desconectar()
      .then(onCambio)
      .catch((e) => setError(e.message));
  };

  return (
    <main className="historial">
      <div className="historial__head">
        <h2 className="panel__title">Cuenta de Instagram</h2>
        <button className="btn btn--ghost" onClick={onVolver}>← Volver</button>
      </div>

      <section className="panel sorteo">
        <strong>Ahora mismo</strong>
        {status.modo === "demo" && <p className="hint">Modo demo: no hay ninguna cuenta conectada.</p>}
        {ig.origen === "enlace" && (
          <p className="hint">
            Conectada <strong>@{ig.conectada.usuario}</strong> con enlace. El permiso dura hasta el{" "}
            {fecha(ig.conectada.caduca)}{ig.conectada.errorRenovacion ? "." : " y se renueva solo."}
          </p>
        )}
        {ig.origen === "enlace" && ig.conectada.errorRenovacion && (
          <div className="alert">
            El último intento de renovarlo ha fallado: {ig.conectada.errorRenovacion}.{" "}
            {ig.conectada.diasRestantes <= 10
              ? "Quedan pocos días: crea un enlace nuevo para volver a conectarla."
              : "Se volverá a intentar solo; si sigue fallando, la app avisará antes de que caduque."}
          </div>
        )}
        {ig.origen === "variable" && (
          <p className="hint">
            Conectada {status.cuenta ? <strong>@{status.cuenta}</strong> : "una cuenta"} con la variable IG_TOKEN.
            Ese permiso no se renueva solo.
          </p>
        )}
        {ig.conectada?.caducada && (
          <div className="alert">
            El permiso de @{ig.conectada.usuario} caducó el {fecha(ig.conectada.caduca)}. Crea un enlace nuevo para
            volver a conectarla.
          </div>
        )}
        {ig.error && <div className="alert">{ig.error}</div>}
        <div className="sorteo__files">
          <button className="btn btn--small" onClick={onCambio}>Comprobar de nuevo</button>
          {ig.origen === "enlace" && (
            <button className="btn btn--small btn--ghost" onClick={desconectar}>Desconectar</button>
          )}
        </div>
      </section>

      <section className="panel sorteo">
        <strong>Conectar una cuenta</strong>
        {!ig.puedeConectar ? (
          <p className="hint">
            Para usar enlaces faltan las variables <code>IG_APP_ID</code> e <code>IG_APP_SECRET</code>. Mira la Guía de
            lanzamiento, sección 8.
          </p>
        ) : (
          <>
            <div className="conectar">
              <p className="conectar__titulo">Desde este dispositivo</p>
              <p className="hint">
                Si quien tiene la cuenta del sorteo está usando la app ahora: te lleva a Instagram, inicias sesión con
                esa cuenta, pulsas <em>Permitir</em> y vuelves aquí.
              </p>
              <button className="btn btn--primary" onClick={conectarAqui} disabled={yendo}>
                {yendo ? "Abriendo Instagram…" : "Conectar una cuenta desde este dispositivo"}
              </button>
            </div>
            <div className="conectar">
              <p className="conectar__titulo">Mandando un enlace a otra persona</p>
              <p className="hint">
                Lo abre en su móvil, inicia sesión en Instagram y pulsa <em>Permitir</em>. No tiene que darte su
                contraseña ni entrar en la app. El enlace vale para un solo uso y caduca en 24 horas.
              </p>
            </div>
            {!enlace ? (
              <button className="btn" onClick={crear}>Crear enlace de conexión</button>
            ) : (
              <>
                <input className="enlace" readOnly value={enlace.url} onFocus={(e) => e.target.select()} />
                <div className="sorteo__files">
                  <button className="btn btn--primary btn--small" onClick={compartir}>Compartir</button>
                  <button className="btn btn--small" onClick={copiar}>Copiar</button>
                </div>
                {aviso && <p className="hint">{aviso}</p>}
                <p className="hint">Cuando te diga que ya lo ha hecho, pulsa <strong>Comprobar de nuevo</strong>.</p>
              </>
            )}
          </>
        )}
        {error && <div className="alert">{error}</div>}
      </section>
    </main>
  );
}
