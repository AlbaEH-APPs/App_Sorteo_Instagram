import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

// Ventana de confirmación con el diseño de la app, en lugar del confirm() del navegador.
// Uso: if (!(await confirmar({ titulo, texto, aceptar: "Sí, borrar", peligro: true }))) return;
export function confirmar(opciones) {
  return new Promise((resolver) => {
    const contenedor = document.createElement("div");
    document.body.appendChild(contenedor);
    const raiz = createRoot(contenedor);
    const cerrar = (respuesta) => {
      raiz.unmount();
      contenedor.remove();
      resolver(respuesta);
    };
    raiz.render(<Dialogo {...opciones} onCerrar={cerrar} />);
  });
}

function Dialogo({ titulo, texto, aceptar = "Aceptar", cancelar = "Cancelar", peligro = false, onCerrar }) {
  const botonCancelar = useRef(null);

  useEffect(() => {
    // El foco empieza en "Cancelar": pulsar Intro sin querer no borra nada
    botonCancelar.current?.focus();
    const tecla = (e) => e.key === "Escape" && onCerrar(false);
    addEventListener("keydown", tecla);
    return () => removeEventListener("keydown", tecla);
  }, [onCerrar]);

  return (
    <div className="dialogo__fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar(false)}>
      <div className="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogo-titulo" aria-describedby="dialogo-texto">
        <div className={`dialogo__icono ${peligro ? "dialogo__icono--peligro" : ""}`} aria-hidden>
          {peligro ? "!" : "?"}
        </div>
        <h2 id="dialogo-titulo" className="dialogo__titulo">{titulo}</h2>
        {texto && (
          <div id="dialogo-texto" className="dialogo__texto">
            {[].concat(texto).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        <div className="dialogo__botones">
          <button ref={botonCancelar} className="btn" onClick={() => onCerrar(false)}>
            {cancelar}
          </button>
          <button className={`btn ${peligro ? "btn--peligro" : "btn--primary"}`} onClick={() => onCerrar(true)}>
            {aceptar}
          </button>
        </div>
      </div>
    </div>
  );
}
