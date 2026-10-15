# Documentación · Sorteo en directo

App para hacer sorteos de Instagram en directo: lee los comentarios de una publicación con la API oficial, filtra los válidos según las bases, fija un orden al azar y muestra en pantalla la animación, la verificación manual y el resultado.

Repositorio: https://github.com/AlbaEH-APPs/App_Sorteo_Instagram (privado)

---

## 1. Requisitos

- **Node.js 18 o superior** (usa `fetch` nativo). Compruébalo con `node -v`.
- **Para usar datos reales** (no hace falta para el modo demo):
  - Cuenta de Instagram **profesional** (Creador o Empresa).
  - Un **token de acceso** de una app de Meta con *Instagram API with Instagram Login* y los permisos:
    - `instagram_business_basic`
    - `instagram_business_manage_comments`

## 2. Instalación (solo la primera vez)

En la carpeta del proyecto:

```powershell
npm install
```

## 3. Cómo lanzarlo

Hay dos modos, y el servidor elige uno solo según si existe la variable `IG_TOKEN`:

| Modo | Cuándo | Qué usa |
|---|---|---|
| **Demo** | Sin `IG_TOKEN` | 260 comentarios inventados en una publicación de prueba, para ensayar |
| **Instagram** | Con `IG_TOKEN` | Tu cuenta real y sus últimas 20 publicaciones |

En la esquina de arriba a la derecha de la web se ve el modo activo: "Modo demo" o `@tu_cuenta`.

### 3.1 Ensayar en modo demo

```powershell
npm run build
npm start
```

Abre http://localhost:3001

### 3.2 Usarlo con tu cuenta (Windows / PowerShell)

```powershell
npm run build
$env:IG_TOKEN="tu_token"; npm start
```

Abre http://localhost:3001

> La variable `$env:IG_TOKEN` solo dura mientras esa ventana de PowerShell esté abierta. Si abres otra terminal, tendrás que volver a ponerla.

En macOS / Linux: `IG_TOKEN=tu_token npm start`

### 3.3 Modo desarrollo (para cambiar el código)

En dos terminales:

```powershell
npm run server   # API en http://localhost:3001 (añade IG_TOKEN si quieres datos reales)
npm run dev      # web con recarga automática en http://localhost:5173
```

En desarrollo se abre **el puerto 5173**. Vite redirige las llamadas a `/api` hacia el servidor del 3001.

### 3.4 Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila la web en `client/dist/` |
| `npm start` / `npm run server` | Arranca el servidor en el puerto 3001 (sirve la API y la web compilada) |
| `npm run dev` | Web en modo desarrollo con recarga (puerto 5173) |

Para cambiar el puerto: `$env:PORT="4000"; npm start`

## 4. Cómo se usa (flujo del sorteo)

### Pantalla de preparación

1. **Elige la publicación**: aparecen tus últimas 20.
2. **Bases del sorteo**:
   - **Ganadores**: de 1 a 50.
   - **Menciones mínimas por comentario**: de 0 a 10 (por defecto 2).
   - **Cierre de participación** (opcional): los comentarios posteriores se descartan.
   - **Excluir usuarios**: separados por comas, con o sin `@`.
   - **Contar también las respuestas** a otros comentarios (por defecto no).
3. **Participantes**: se recalcula solo y muestra cuántos comentarios hay, cuántos participantes son válidos y por qué se descarta el resto.

### Pantalla del sorteo

1. Pulsa **¡Sortear!**. En ese momento el servidor vuelve a descargar los comentarios, aplica las bases y **baraja y fija el orden** de todos los participantes. El orden se guarda en disco antes de verificar a nadie.
2. La animación se para en el primero del orden. Comprueba en Instagram si **te sigue** y si **ha dado like** (botones *Ver perfil* y *Ver publicación*).
3. Si cumple, es ganador. Si no, queda descartado y se pasa al siguiente del orden.
4. Cuando se completan los ganadores (o se acaban los participantes), se guarda el resultado con **3 suplentes**: los siguientes del orden.

**Atajos**: **barra espaciadora** para sortear o pasar al siguiente. Usa el botón **Pantalla completa** para el directo.

## 5. Reglas de validez de un comentario

Un comentario se descarta, con su motivo, si:

| Motivo | Regla |
|---|---|
| `sin usuario` | La API no devuelve el usuario |
| `cuenta organizadora` | Lo ha escrito tu propia cuenta |
| `usuario excluido` | Está en la lista de excluidos |
| `fuera de plazo` | Es posterior a la fecha de cierre |
| `N menciones` | Tiene menos menciones de las exigidas |

Cómo se cuentan las menciones:
- Solo cuentan **usuarios distintos** (mencionar dos veces a la misma persona cuenta 1).
- **No cuentan** la mención a uno mismo ni a la cuenta organizadora.

**Una participación por persona**: si alguien comenta varias veces, solo entra su primer comentario válido.

**Aleatoriedad**: barajado Fisher-Yates con `crypto.randomInt` (aleatoriedad criptográfica de Node).

**No se comprueba automáticamente** si siguen la cuenta o si han dado like, porque la API no lo permite. Se verifica a mano y solo con quien sale elegido.

## 6. Archivos que genera: `resultados/`

Cada sorteo genera tres archivos con un identificador `fecha-hora-xxxxxx`:

| Archivo | Cuándo se crea | Contenido |
|---|---|---|
| `…-orden.json` | Al pulsar ¡Sortear! | Configuración, publicación, nº de comentarios y **orden completo** fijado |
| `…-comentarios.csv` | Al pulsar ¡Sortear! | Todos los comentarios con `valido` y `motivo` de descarte |
| `…-resultado.json` | Al terminar | Lo anterior + ganadores, descartados en la verificación (y por qué) y suplentes |

Sirven como **prueba de transparencia** del sorteo si alguien la pide.

> La carpeta `resultados/` está en `.gitignore`: contiene nombres de usuarios reales y **no se sube a GitHub**. Si quieres conservarla, haz copia aparte.

## 7. Estructura del proyecto

```
App_Sorteo_Instagram/
├── server/                 Servidor Node (sin dependencias externas)
│   ├── index.mjs           Servidor HTTP: rutas de la API, guarda resultados y sirve la web
│   ├── instagram.mjs       Llamadas a la API de Instagram (graph.instagram.com)
│   ├── demo.mjs            Datos inventados para el modo demo
│   └── sorteo.mjs          Lógica del sorteo: bases por defecto, filtrado y barajado
├── client/                 Web (React + Vite)
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx   Entrada y cambio entre pantallas
│       ├── api.js              Llamadas al servidor
│       ├── styles.css
│       └── components/
│           ├── Setup.jsx       Pantalla de preparación
│           ├── Stage.jsx       Pantalla del sorteo en directo
│           ├── Reel.jsx        Animación de nombres
│           └── Confetti.jsx    Confeti del ganador
├── vite.config.js          Configuración de Vite (raíz en client/, proxy /api → 3001)
├── package.json
├── README.md
└── Documentacion.md        Este documento
```

### API del servidor

| Ruta | Para qué |
|---|---|
| `GET /api/status` | Modo (demo/instagram) y cuenta conectada |
| `GET /api/posts` | Últimas 20 publicaciones |
| `POST /api/preview` | Recuento de participantes con la configuración elegida |
| `POST /api/draw` | Sorteo real: descarga comentarios, fija el orden y guarda `orden.json` + `comentarios.csv` |
| `POST /api/draw/finish` | Guarda `resultado.json` tras la verificación |

## 8. Cosas a tener en cuenta

- **No reinicies el servidor a mitad de un sorteo.** El sorteo en curso se guarda en memoria para poder cerrarlo. Si el servidor se reinicia antes de terminar, el resultado final dará error ("Sorteo no encontrado"). El `orden.json` y el `comentarios.csv` sí quedan guardados.
- **El token no se guarda en ningún archivo**: solo se lee de la variable `IG_TOKEN`. No lo escribas en el código ni lo subas al repo. Si algún día usas un archivo `.env`, ya está en `.gitignore`.
- **Caducidad del token**: los tokens de Instagram caducan (los de larga duración, a los 60 días aprox.). Si sale un error `Instagram: ... (código 190)`, normalmente toca renovar el token.
- **Si la web muestra** "Abre la web con 'npm run dev'… o compílala con 'npm run build'", falta ejecutar `npm run build` antes de `npm start`.
- **Si la web muestra** "No se pudo conectar con el servidor", el servidor no está arrancado.
- **Antes del directo**, ensaya una vez en modo demo y otra con tu cuenta, para comprobar que el token funciona y que el recuento de participantes es el esperado.

## 9. Copias de seguridad (Git)

Después de hacer cambios:

```powershell
git add -A
git commit -m "Describe el cambio"
git push
```
