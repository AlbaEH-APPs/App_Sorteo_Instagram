import { MARCA } from "../marca.js";

// Logo de la marca: el archivo original si existe; si no, la nota de papel rasgada sobre el círculo.
// En tamaño pequeño (barra superior) la nota solo lleva la inicial, porque el texto no se leería.
export default function Logo({ grande = false }) {
  const nombre = `${MARCA.nombre} by ${MARCA.firma}`;
  if (MARCA.logo) {
    return <img className={`logo logo--img ${grande ? "logo--grande" : ""}`} src={MARCA.logo} alt={nombre} />;
  }
  return (
    <span className={`logo ${grande ? "logo--grande" : ""}`} role="img" aria-label={nombre}>
      <span className="logo__papel">
        {grande ? (
          <>
            <span>{MARCA.nombre}</span>
            <span className="logo__by">By</span>
            <span>{MARCA.firma}</span>
          </>
        ) : (
          <span>{MARCA.nombre[0]}</span>
        )}
        <span className="logo__corazon" aria-hidden>♥</span>
      </span>
    </span>
  );
}
