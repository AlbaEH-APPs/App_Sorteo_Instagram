// Datos inventados para ensayar el sorteo sin token de Instagram
const nombres = [
  "lucia", "martina", "hugo", "pablo", "sofia", "mateo", "valeria", "leo", "daniela", "alvaro",
  "carmen", "javi", "irene", "nerea", "dani", "marta", "sergio", "paula", "adrian", "elena",
  "noa", "marcos", "julia", "ines", "raul", "alba", "carla", "diego", "laura", "ruben",
];
const extras = ["_", ".", "__", "_oficial", ".bcn", ".mad", "_22", "99", "_art", ".photo", "_xx", "07"];

function rnd(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function createDemo() {
  const r = rnd(42);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const user = () => `${pick(nombres)}${pick(extras)}${Math.floor(r() * 90 + 10)}`;
  const textos = ["¡Me encanta! 😍", "Ojalá 🍀", "Participo!!", "Que bonito", "A por ello", ""];

  const comments = [];
  for (let i = 0; i < 260; i++) {
    const n = r() < 0.75 ? 2 + Math.floor(r() * 2) : Math.floor(r() * 2);
    const menciones = Array.from({ length: n }, () => `@${user()}`).join(" ");
    comments.push({
      id: `demo-${i}`,
      username: user(),
      text: `${menciones} ${pick(textos)}`.trim(),
      timestamp: new Date(Date.now() - (260 - i) * 600000).toISOString(),
    });
  }

  // 45 publicaciones (la primera es la del sorteo) para poder probar "Cargar más" y la búsqueda por enlace.
  // Todas devuelven los mismos comentarios inventados.
  const posts = Array.from({ length: 45 }, (_, i) => ({
    id: `demo-post-${i + 1}`,
    caption: i === 0 ? "🎁 SORTEO (demo) · Sígueme, dale like y menciona a dos amigos" : `Publicación de prueba nº ${i + 1}`,
    permalink: `https://www.instagram.com/p/DEMO${i + 1}/`,
    timestamp: new Date(Date.now() - i * 3 * 86400000).toISOString(),
    comments: comments.length,
    likes: 412 - i * 7,
    image: null,
  }));

  return {
    async me() {
      return { username: "tu_cuenta_demo" };
    },
    async posts(despues) {
      const desde = Number(despues) || 0;
      const siguiente = desde + 20 < posts.length ? String(desde + 20) : null;
      return { posts: posts.slice(desde, desde + 20), siguiente };
    },
    async buscarPost(codigo) {
      return posts.find((p) => p.permalink.includes(`/p/${codigo}/`)) || null;
    },
    async post(id) {
      return posts.find((p) => p.id === id) || posts[0];
    },
    async comments() {
      return comments;
    },
  };
}
