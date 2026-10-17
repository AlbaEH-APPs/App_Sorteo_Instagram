import { useEffect, useRef } from "react";

// Tonos de la marca: topo, papel, rosa empolvado y un verde salvia suave
const COLORES = ["#b8a08c", "#826856", "#d9cabb", "#e8c9c1", "#c99a8e", "#a9b9a0", "#f3e3d3"];

export default function Confetti({ fireId }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!fireId) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const piezas = Array.from({ length: 220 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 18,
      vy: -Math.random() * 18 - 6,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
    }));

    let raf;
    const inicio = performance.now();
    const frame = (t) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const vida = (t - inicio) / 1000;
      for (const p of piezas) {
        p.vy += 0.42;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - vida / 4.5);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        ctx.restore();
      }
      if (vida < 4.5) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(frame);
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [fireId]);

  return <canvas ref={ref} className="confetti" aria-hidden />;
}
