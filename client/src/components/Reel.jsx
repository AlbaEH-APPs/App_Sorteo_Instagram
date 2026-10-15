import { useEffect, useRef, useState } from "react";

const PASOS = 46;

// Nombres que pasan cada vez más despacio hasta pararse en el elegido.
// El ganador ya está decidido en el servidor: esto es solo la animación.
export default function Reel({ pool, target, spinId, onDone }) {
  const [secuencia, setSecuencia] = useState([]);
  const [i, setI] = useState(-1);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!target) return;
    const nombres = pool.length ? pool : [target];
    const relleno = Array.from({ length: PASOS }, () => nombres[Math.floor(Math.random() * nombres.length)]);
    const seq = [...relleno, target, nombres[Math.floor(Math.random() * nombres.length)]];
    setSecuencia(seq);
    setI(0);

    let paso = 0;
    let t;
    const tick = () => {
      paso++;
      setI(paso);
      if (paso >= PASOS) {
        t = setTimeout(() => done.current?.(), 650);
        return;
      }
      const p = paso / PASOS;
      t = setTimeout(tick, 45 + Math.pow(p, 3.2) * 520);
    };
    t = setTimeout(tick, 45);
    return () => clearTimeout(t);
  }, [spinId]); // eslint-disable-line react-hooks/exhaustive-deps

  const parado = i >= PASOS;
  const nombre = (k) => (secuencia[k] ? `@${secuencia[k]}` : " ");

  return (
    <div className={`reel ${parado ? "reel--stopped" : "reel--moving"}`} aria-live="polite">
      <div className="reel__row reel__row--ghost">{nombre(i - 1)}</div>
      <div className="reel__row reel__row--main" key={i}>
        {nombre(i)}
      </div>
      <div className="reel__row reel__row--ghost">{nombre(i + 1)}</div>
    </div>
  );
}
