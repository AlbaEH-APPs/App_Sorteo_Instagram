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

  const posts = [
    {
      id: "demo-post-1",
      caption: "🎁 SORTEO (demo) · Sígueme, dale like y menciona a dos amigos",
      permalink: "https://www.instagram.com/",
      timestamp: new Date().toISOString(),
      comments: comments.length,
      likes: 412,
      image: null,
    },
  ];

  return {
    async me() {
      return { username: "tu_cuenta_demo" };
    },
    async posts() {
      return posts;
    },
    async post(id) {
      return posts.find((p) => p.id === id) || posts[0];
    },
    async comments() {
      return comments;
    },
  };
}
