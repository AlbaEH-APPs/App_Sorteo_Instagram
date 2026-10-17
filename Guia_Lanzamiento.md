# Guía de lanzamiento · Sorteo en directo

Pasos para poner en marcha la app, en **modo prueba** (datos inventados) y en **producción** (la cuenta real de Instagram, el día del directo), y para conseguir y renovar el **token de Instagram**.

La app se puede usar de dos formas:

- **En tu ordenador** (secciones 1 a 6): la arrancas tú y la abres en el navegador del mismo ordenador. "Producción" significa arrancarla con el token de la cuenta real.
- **Publicada en Vercel** (sección 7): queda en internet, protegida con contraseña, y la manejas **desde el móvil** sin necesidad del ordenador.

| Paso | Cuándo |
|---|---|
| [1. Preparación del ordenador](#1-preparación-del-ordenador-una-sola-vez) | Una sola vez |
| [2. Modo prueba](#2-modo-prueba-sin-token) | Para ensayar, sin token |
| [3. Conseguir el token](#3-conseguir-el-token-de-instagram) | Una vez, y renovarlo cada menos de 60 días |
| [4. Producción](#4-producción-el-sorteo-real) | Antes del directo y el día del directo |
| [5. Renovar el token](#5-renovar-el-token-antes-de-que-caduque) | Antes de que caduque |
| [6. Problemas frecuentes](#6-problemas-frecuentes) | Si algo falla |
| [7. Publicar en Vercel (usar desde el móvil)](#7-publicar-en-vercel-usar-desde-el-móvil) | Una vez, y al cambiar el código o el token |
| [8. Conectar la cuenta con un enlace](#8-conectar-la-cuenta-de-instagram-con-un-enlace) | Cuando la cuenta del sorteo es de otra persona (recomendado en Vercel) |

---

## 1. Preparación del ordenador (una sola vez)

### 1.1 Instalar Node.js

1. Comprueba si ya lo tienes: abre PowerShell y escribe `node -v`.
   - Si sale `v18` o superior (por ejemplo `v22.17.1`), ya está.
   - Si da error o sale una versión menor, sigue con el paso 2.
2. Descarga la versión **LTS** de https://nodejs.org e instálala con las opciones por defecto.
3. Cierra y vuelve a abrir PowerShell, y comprueba otra vez `node -v`.

### 1.2 Abrir una terminal en la carpeta del proyecto

Cualquiera de estas formas:

- **En VS Code**: abre la carpeta `App_Sorteo_Instagram` y ve a *Terminal → Nueva terminal*.
- **En PowerShell**:
  ```powershell
  cd C:\Users\ALBA\PythonScripts\App_Sorteo_Instagram
  ```

Todos los comandos de esta guía se escriben en esa terminal.

### 1.3 Instalar las dependencias

```powershell
npm install
```

Hay que repetirlo solo si cambias de ordenador o si cambia `package.json`.

---

## 2. Modo prueba (sin token)

Usa 45 publicaciones de prueba con 260 comentarios inventados (la primera es la del "sorteo"). Sirve para ensayar el directo y para enseñar la app sin tocar la cuenta real.

### 2.1 Arrancar

```powershell
npm run build
npm start
```

- `npm run build` prepara la web. Hay que repetirlo **cada vez que cambie el código**; si no ha cambiado, basta con `npm start`.
- En la terminal debe salir:
  ```
  Servidor del sorteo en http://localhost:3001  ·  modo DEMO
  Sin IG_TOKEN: usando participantes inventados para ensayar.
  ```

### 2.2 Abrir la web

Abre http://localhost:3001 en el navegador. Arriba a la derecha debe poner **"Modo demo"**.

### 2.3 Ensayo recomendado

1. Elige la publicación de prueba y cambia las bases. El recuento de participantes se actualiza solo.
2. Pulsa **Ir a la pantalla del sorteo → ¡Sortear!** y verifica un par de candidatos (uno con "No" y otro con "Sí").
3. **Recarga la página** a mitad: tiene que aparecer "Hay un sorteo sin terminar". Pulsa **Continuar sorteo** y comprueba que sigue donde estaba.
4. Termínalo y mira los archivos que se han creado en `resultados/`.
5. Practica con **Pantalla completa** y la **barra espaciadora**.

Los archivos de los ensayos puedes borrarlos de `resultados/` cuando quieras.

### 2.4 Parar

Pulsa `Ctrl + C` en la terminal.

---

## 3. Conseguir el token de Instagram

> **¿La cuenta del sorteo es de otra persona, o vas a usar la app en Vercel?** Haz los pasos 3.1 a 3.4 y 3.6 de esta sección y después sigue la **[sección 8](#8-conectar-la-cuenta-de-instagram-con-un-enlace)**. Con un enlace, esa persona conecta su cuenta desde su móvil, sin darte la contraseña, y el permiso se renueva solo.

El token es la "llave" que deja a la app leer los comentarios de la cuenta. Se consigue en el panel de desarrolladores de Meta y **dura 60 días**.

> Los nombres de los menús de Meta cambian de vez en cuando. Si alguno no coincide exactamente, busca el más parecido.

### 3.1 Requisitos de la cuenta del sorteo

La cuenta tiene que ser **profesional** (de Creador o de Empresa). Con una cuenta personal no se puede.

Para pasarla a profesional, desde la app de Instagram:

1. Ve a **Perfil → ☰ (menú) → Configuración**.
2. Entra en **Tipo de cuenta y herramientas → Cambiar a cuenta profesional**.
3. Elige **Creador** (o Empresa) y sigue los pasos.

No hace falta vincularla a una página de Facebook.

### 3.2 Crear la cuenta de desarrollador (una sola vez)

1. Entra en https://developers.facebook.com con tu cuenta de Facebook/Meta.
2. Pulsa **Empezar** (o *Get Started*) y completa el registro como desarrollador: aceptar condiciones y verificar el teléfono o el correo.

### 3.3 Crear la app en Meta (una sola vez)

1. En https://developers.facebook.com/apps pulsa **Crear app**.
2. Ponle un nombre, por ejemplo `Sorteo en directo`, y tu correo de contacto.
3. Cuando te pida el **caso de uso**, elige el de Instagram: *Administrar mensajes y contenido en Instagram* ("Manage messaging & content on Instagram"). Si en su lugar te pide un **tipo de app**, elige **Empresa** (*Business*). Con otros tipos no se puede añadir Instagram.
4. Si te pide un **portfolio comercial**, puedes elegir no vincular ninguno por ahora.
5. Termina la creación. Te llevará al panel de la app.

### 3.4 Comprobar los permisos

En el panel de la app, entra en el caso de uso de Instagram: **Casos de uso → Personalizar**, junto al de Instagram. Comprueba que estén estos dos permisos:

- `instagram_business_basic`
- `instagram_business_manage_comments`

Si falta alguno, pulsa **Añadir** a su lado. La app no necesita ningún otro.

### 3.5 Generar el token

1. En el menú del caso de uso de Instagram, entra en **Configuración de la API con el inicio de sesión para empresas de Instagram** ("API setup with Instagram business login").
2. En el apartado **Generar identificadores de acceso** ("Generate access tokens"), pulsa **Añadir cuenta** e inicia sesión con **la cuenta de Instagram del sorteo**.
3. Acepta los permisos que pide.
4. Junto a la cuenta añadida, pulsa **Generar identificador** ("Generate token"). Puede pedirte iniciar sesión otra vez.
5. **Copia el token** (una cadena larga de letras y números) y guárdalo en un sitio seguro, por ejemplo en tu gestor de contraseñas.
6. **Apunta la fecha de hoy**: el token caduca a los **60 días**. Ponte un recordatorio unos días antes (ver sección 5).

### 3.6 Si la cuenta del sorteo no es tuya

Si la cuenta de Instagram es de otra persona (por ejemplo, de un cliente), no podrá añadirse en el paso 3.5 hasta que tenga un **rol en tu app**:

1. En el panel de la app, ve a **Roles de la app → Roles → Añadir personas** y elige **Tester de Instagram**.
2. Escribe el nombre de usuario de la cuenta de Instagram y envía la invitación.
3. La persona dueña de la cuenta la acepta. **Solo se puede desde la web de Instagram, no desde la app**, aunque sí desde el navegador del móvil:
   1. Abrir **Safari o Chrome** (no la app de Instagram) e ir a:
      ```
      https://www.instagram.com/accounts/manage_access/
      ```
      Es la página **Apps y sitios web**. Si pide iniciar sesión, entrar con la cuenta del sorteo.
   2. Pestaña **Invitaciones de tester** (*Tester invites*) → **Aceptar** en tu app.
   - Si el enlace abre la app de Instagram: mantenerlo pulsado y elegir *Abrir en Safari/Chrome*, o pegar la dirección en la barra del navegador.
   - Si no se ven las pestañas: activar en el navegador **"Ver versión para ordenador"** y recargar.
   - Si no aparece ninguna invitación: comprobar en Meta → **Roles de la app → Roles** que el usuario está bien escrito, y enviarla otra vez.
4. Después ya se puede conectar la cuenta. **Lo recomendado es con un enlace (sección 8)**: la persona lo hace desde su móvil, sin dar su contraseña.

> **Si no usas Vercel** y necesitas el token a mano (paso 3.5) con una cuenta que no es tuya y la persona vive lejos: haced una **videollamada con control remoto** (Google Meet, AnyDesk o Chrome Remote Desktop). Tú abres el paso 3.5 en tu ordenador y, cuando sale la ventana de Instagram, ella escribe su usuario y contraseña con el control remoto. Al terminar, cerrad la sesión de su Instagram en tu navegador. Este token habrá que renovarlo cada menos de 60 días (sección 5).

### 3.7 ¿Hace falta la revisión de Meta ("App Review")?

**No.** Usar la app con tu propia cuenta, o con cuentas que tengan un rol en ella, funciona con el acceso estándar. La revisión solo hace falta para ofrecer la app a cuentas ajenas sin rol, y no es el caso.

### 3.8 Cuidado con el token

- Es como una contraseña de la cuenta: **no lo compartas**, no lo pegues en chats ni lo guardes en archivos del proyecto.
- **No lo escribas dentro del código** ni lo subas a GitHub.
- Si crees que se ha filtrado: cambia la contraseña de Instagram (eso anula el token) y genera uno nuevo.

---

## 4. Producción (el sorteo real)

### 4.1 Unos días antes del directo

1. **Comprueba que el token no caduca antes del directo.** Si le quedan menos de 7 días, renuévalo (sección 5).
2. **Haz un ensayo con la cuenta real** (pasos 4.2 a 4.4):
   - Comprueba que arriba a la derecha sale `@tu_cuenta`.
   - Comprueba que aparece la publicación del sorteo.
   - Comprueba que el recuento de participantes es razonable.
   - Elegir publicación y cambiar bases **no sortea nada**, así que esto se puede hacer sin miedo.
3. Opcional: haz un sorteo de prueba completo sobre **otra** publicación y termínalo o ciérralo con **Cerrar sin terminar**. Después borra sus archivos de `resultados/` para no confundirlos con el real.
4. Ten escritas **las bases definitivas**: nº de ganadores, menciones mínimas y fecha y hora de cierre.

### 4.2 Arrancar con el token

En la terminal, dentro de la carpeta del proyecto:

```powershell
npm run build
$env:IG_TOKEN = Read-Host "Pega el token"
npm start
```

- `Read-Host` te pide el token: pégalo con clic derecho y pulsa Intro. Así **no queda guardado en el historial** de PowerShell, cosa que sí pasaría escribiendo `$env:IG_TOKEN="..."` directamente.
- La variable solo dura mientras esa ventana esté abierta. Si cierras la terminal, hay que repetir estos pasos.
- En la terminal debe salir:
  ```
  Servidor del sorteo en http://localhost:3001  ·  modo INSTAGRAM
  ```
  Si sale `modo DEMO`, el token no se ha guardado: repite la línea de `Read-Host`.

> Si Windows muestra un aviso del **Firewall** para Node.js, pulsa **Cancelar**. La app solo se usa en este ordenador y funciona igual.

### 4.3 Abrir la web y comprobar

1. Abre http://localhost:3001.
2. Arriba a la derecha tiene que poner **`@nombre_de_la_cuenta`**, no "Modo demo".
3. Si sale un mensaje en rojo que empieza por `Instagram:`, mira la sección 6.

### 4.4 El día del directo

**Antes de empezar:**

1. Arranca la app como en 4.2 y comprueba lo de 4.3.
2. Elige la publicación del sorteo y pon las bases. Lo más rápido: en Instagram, en el post, *Compartir → Copiar enlace*, y pégalo en la caja **Pega el enlace del post** → **Buscar**.
3. Pulsa **Actualizar** para ver el recuento con los últimos comentarios.
4. Ten Instagram abierto en otra pestaña o en el móvil, con la sesión de la cuenta del sorteo, para verificar a los candidatos.
5. Cierra otras ventanas y notificaciones que no quieras que salgan en pantalla.

**En directo:**

1. Pulsa **Ir a la pantalla del sorteo** y después **Pantalla completa**.
2. Pulsa **¡Sortear!** o la barra espaciadora. En ese momento se leen los comentarios y se fija el orden.
3. Con cada candidato aparece **"¿Cumple las bases?"**. Las menciones se marcan solas. Para **"Sigue a @cuenta"** pulsa **Ver su perfil** (Instagram muestra *"Te sigue"* si la sigue) y responde **✓ Sí** o **✗ No**. Para **"Ha dado me gusta"** pulsa **Ver la publicación** y responde igual. Cada respuesta se marca con un ✓ o una ✗ animados y la pantalla baja sola hasta el veredicto, así que en la grabación se ve todo sin tocar nada más.
4. Repite hasta tener todos los ganadores.

**Si algo se corta** (se cierra el navegador, se recarga la página o se para el servidor):

1. Si se paró el servidor, vuelve a arrancarlo como en 4.2.
2. Abre http://localhost:3001 y pulsa **Continuar sorteo**. Sigue con el mismo orden; no se repite nada.

### 4.5 Después del directo

1. Copia la carpeta `resultados/` a un sitio seguro (por ejemplo, una carpeta en la nube). **No se sube a GitHub** porque contiene nombres de usuarios reales.
2. Los archivos de ese sorteo (`…-orden.json`, `…-comentarios.csv` y `…-resultado.json`) sirven como prueba si alguien pregunta cómo se eligió al ganador.
3. Para el servidor con `Ctrl + C` y cierra la terminal; así el token deja de estar en memoria.

---

## 5. Renovar el token antes de que caduque

Un token se puede renovar si tiene **más de 24 horas** y **aún no ha caducado**. El nuevo dura otros 60 días.

**Opción A: generar uno nuevo.** Repite el paso 3.5 en el panel de Meta. Es lo más sencillo, y la única opción si ya ha caducado.

**Opción B: renovarlo desde PowerShell.** En una terminal nueva:

```powershell
$env:IG_TOKEN = Read-Host "Pega el token actual"
$r = Invoke-RestMethod "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=$env:IG_TOKEN"
$r.access_token
"Caduca el: " + (Get-Date).AddSeconds($r.expires_in).ToString("dd/MM/yyyy")
```

Se muestra el **token nuevo** y su fecha de caducidad. Guárdalo en lugar del anterior y usa el nuevo a partir de ahora.

---

## 6. Problemas frecuentes

| Qué ves | Qué pasa | Qué hacer |
|---|---|---|
| Arriba pone "Modo demo" y querías la cuenta real | El servidor arrancó sin token | Para con `Ctrl + C` y arranca como en 4.2 |
| Arriba pone `@cuenta` y querías ensayar en demo | Esa terminal aún tiene el token | Ejecuta `Remove-Item Env:IG_TOKEN` y vuelve a hacer `npm start`, o abre una terminal nueva |
| `Instagram: ... (código 190)` | Token caducado, anulado (por ejemplo, tras cambiar la contraseña) o mal copiado | Genera uno nuevo (paso 3.5) |
| `Instagram: ... (código 10)` o `(código 200)` | Faltan permisos | Revisa el paso 3.4 y genera el token otra vez |
| `Instagram: ... (código 4)`, `(código 17)` o `(código 32)` | Demasiadas llamadas a Instagram en poco tiempo | Espera unos minutos sin pulsar *Actualizar* |
| `Instagram no responde` | Sin internet, o Instagram falla en ese momento (ya se reintentó 2 veces) | Comprueba la conexión y vuelve a intentarlo |
| No aparece la publicación del sorteo | La lista muestra las publicaciones de 20 en 20 | Pulsa **Cargar más publicaciones** al final de la lista, o pega su enlace en **Pega el enlace del post** → **Buscar** |
| "No se ha encontrado esa publicación en la cuenta conectada" | El enlace es de otra cuenta, o la cuenta conectada no es la del sorteo | Comprueba arriba a la derecha qué cuenta está conectada y que el post es de esa cuenta |
| "Ese enlace no parece de una publicación de Instagram" | Has pegado el enlace de un perfil u otra cosa | Copia el enlace desde el propio post: *Compartir → Copiar enlace* |
| `Abre la web con 'npm run dev'… o compílala con 'npm run build'` | Falta preparar la web | Ejecuta `npm run build` y luego `npm start` |
| `No se pudo conectar con el servidor` | El servidor no está arrancado | Arráncalo (`npm start`) y recarga la página |
| `Error: listen EADDRINUSE ... 3001` en la terminal | Ya hay otro servidor de la app abierto | Ciérralo (`Ctrl + C` en su terminal) o arranca en otro puerto: `$env:PORT="3002"; npm start` y abre http://localhost:3002 |
| No deja pulsar *Ir a la pantalla del sorteo* | Hay un sorteo sin terminar | Arriba aparece el aviso: **Continuar sorteo** o **Cerrar sin terminar** |

---

## 7. Publicar en Vercel (usar desde el móvil)

Con esto la app queda en una dirección de internet (por ejemplo `https://sorteo-xxxx.vercel.app`) que puedes abrir desde el móvil, **sin tener el ordenador encendido**.

Diferencias con la versión del ordenador:

| | En tu ordenador | En Vercel |
|---|---|---|
| Quién puede entrar | Solo tú, en ese ordenador | Cualquiera con el enlace **y la contraseña** |
| Dónde se guardan sorteos y resultados | Carpeta `resultados/` | Base de datos **Upstash Redis** |
| Cómo descargar los resultados | Abrir la carpeta | Botón **Historial** de la app |
| Dónde se pone el token | `$env:IG_TOKEN` en la terminal | Variable `IG_TOKEN` en el panel de Vercel |

La primera vez necesitas el ordenador para publicarla. Después, el sorteo se hace solo desde el móvil.

### 7.1 Antes de empezar: el repo es de una organización

El repo está en la organización de GitHub `AlbaEH-APPs`. El plan gratuito de Vercel (**Hobby**) **no permite** conectar repos **privados de organizaciones**. Hay tres formas de resolverlo:

| Opción | Cómo | Ventajas e inconvenientes |
|---|---|---|
| **A. Publicar desde el ordenador** (recomendada) | Con la herramienta de Vercel en la terminal (paso 7.3) | El repo sigue privado y donde está. Cada vez que cambies el código, vuelves a publicar con un comando |
| B. Mover el repo a tu cuenta personal | En GitHub: *Settings → Danger Zone → Transfer ownership* a `AlbaErdociainHerrero97` | Se publica sola en cada `git push`. Cambia la dirección del repo (habría que actualizar el remoto con `git remote set-url`) |
| C. Hacer el repo público | En GitHub: *Settings → Danger Zone → Change visibility* | Se publica sola en cada `git push`. El código queda a la vista de todos (no contiene ningún secreto: el token y la contraseña van en Vercel) |

> **Lo que se eligió: opción C.** El repo es público y está conectado a Vercel, así que **cada `git push` publica la app sola** (tarda uno o dos minutos). Los pasos de la terminal (`npx vercel`) solo hicieron falta la primera vez.

### 7.2 Crear la cuenta de Vercel

1. Entra en https://vercel.com/signup.
2. Elige el plan **Hobby** (gratuito; vale para uso personal).
3. Regístrate con **Continue with GitHub**.

### 7.3 Primera publicación (desde el ordenador)

En la terminal, dentro de la carpeta del proyecto:

```powershell
npx vercel login
```

Puede salir un aviso sobre *telemetry* (estadísticas de uso de la herramienta): es normal. Después se abre el navegador o aparece un enlace con un código, del tipo `Visit https://vercel.com/device and enter ABCD-EFGH`. Pulsa Intro para abrirlo, comprueba que el código coincide y acepta con **Continue with GitHub**. La terminal dirá *Success*. Después:

```powershell
npx vercel
```

Te hará unas preguntas. Responde así:

| Pregunta | Respuesta |
|---|---|
| Set up and deploy? | `Y` |
| Which scope? | Tu cuenta personal |
| *Search all projects* / *Create a new project* (o *Link to existing project?*) | **Create a new project** (o `N`): es la primera vez |
| Project name? | `sorteo-en-directo` (o el que quieras) |
| In which directory is your code located? | `./` (Intro) |
| Connect this Git repository to automatically deploy changes on every push? | `Y` si el repo es **público** (opción C de 7.1); `N` si es privado de una organización |
| Want to modify these settings? / Customize settings? | `N`: la configuración ya está en `vercel.json`. Si antes muestra *Framework: Vite* u otra carpeta de salida, no pasa nada |

Al terminar muestra una dirección de prueba. **Todavía no funcionará**: faltan la base de datos y la contraseña. Al abrirla verás un mensaje en rojo que lo indica, y eso es lo esperado.

### 7.4 Conectar la base de datos (Upstash Redis)

1. Entra en https://vercel.com/dashboard y abre el proyecto `sorteo-en-directo`.
2. Ve a la pestaña **Storage** y pulsa **Create Database** (o *Connect Database*).
3. En el catálogo (*Marketplace*) elige **Upstash** → **Redis** y pulsa **Continue**.
4. Elige:
   - **Primary Region:** *Washington, D.C., USA (East)* (`iad1`), la misma zona en la que Vercel ejecuta la app por defecto, para que vaya más rápida.
   - **Read Regions:** vacío. No hace falta, y en los planes de pago cuesta dinero.
   - **Eviction:** **desactivado**. Si se activa, cuando la base de datos se llena borra datos para hacer sitio, y podría borrar un sorteo en curso o resultados.
   - **Plan:** *Free*. Da 500.000 operaciones al mes; un sorteo completo usa unas pocas decenas.
   - **Resource Name:** por ejemplo `sorteo-datos`.
5. Pulsa **Create** y, cuando te pregunte, **conéctala al proyecto** `sorteo-en-directo` (marca todos los entornos: *Production*, *Preview* y *Development*). Si pide un prefijo para las variables, déjalo vacío o con `KV`, el que venga por defecto.
   - Si no te pide conectarla: proyecto → pestaña **Storage** → `sorteo-datos` → **Connect Project**.

Vercel añade solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`. No hay que copiar nada.

### 7.5 Poner la contraseña y el token

En el proyecto de Vercel: **Settings → Environment Variables**. Añade:

| Key | Value | Notas |
|---|---|---|
| `APP_PASSWORD` | La contraseña para entrar en la app | **Obligatoria.** Sin ella la app no funciona. Usa una larga y que no uses en otro sitio (por ejemplo, 4 o 5 palabras sueltas) |
| `IG_TOKEN` | El token de Instagram (sección 3) | Opcional. Si no la pones, la app funciona en **modo demo** |

Al añadir cada variable:
- **Type:** elige **Secret** (no *Config*) para `APP_PASSWORD` e `IG_TOKEN`. Así nadie puede volver a ver el valor desde el panel, ni siquiera tú; si lo olvidas, pones uno nuevo.
- **Environments:** *Production* es suficiente.
- **Contraseña:** nada de `1234` ni similares. La app está en internet y cualquiera puede llegar a la pantalla de entrada; con el límite de intentos, una contraseña de 4 cifras aguantaría como mucho uno o dos días a alguien probando combinaciones. Mejor varias palabras sueltas, por ejemplo `lince-tostada-mar-violeta-27` (inventa la tuya), y guárdala en tu gestor de contraseñas.

> Puedes empezar sin `IG_TOKEN` para probarlo todo desde el móvil en modo demo. Para conectar la cuenta real, **lo recomendado es con un enlace (sección 8)**, que no necesita `IG_TOKEN`.

### 7.6 Publicar la versión definitiva

Las variables solo se aplican al **volver a publicar**. En la terminal:

```powershell
npx vercel --prod
```

Al final muestra la dirección definitiva. La de este proyecto es **`https://sorteo-en-directo.vercel.app`**. También la ves en el panel de Vercel, en **Domains**.

**Otra forma, sin terminal (también desde el móvil):** pestaña **Deployments** → en la fila de arriba, los **tres puntos (⋯)** de la derecha, junto a la foto → **Redeploy**. Úsala cuando cambies una variable (contraseña, token, claves) sin cambiar el código.

> **Comprueba que se ha publicado la versión correcta.** En **Deployments**, la fila de arriba muestra el mensaje y el código del último commit (por ejemplo `80ece04`). Si es más antiguo que tu último `git push`, Redeploy volvería a publicar la versión vieja: publica con `npx vercel --prod` (ver 7.9).

### 7.7 Probar desde el móvil

1. Abre la dirección en el móvil y entra con tu contraseña.
2. Comprueba arriba a la derecha: **"Modo demo"** o `@tu_cuenta`, según hayas puesto el token o no.
3. Haz un sorteo de prueba completo, como en el paso 2.3, incluido recargar la página a mitad.
4. Pulsa **Historial** y descarga uno de los archivos.
5. Instálala en la pantalla de inicio para abrirla como una app más (ver **7.11**).

Al iniciar sesión, la sesión dura **12 horas**. Pasado ese tiempo, la app vuelve a pedir la contraseña. Un sorteo a medias no se pierde: al volver a entrar aparece para continuarlo.

### 7.8 El día del directo, desde el móvil

Igual que la sección 4.4, con estas diferencias:

- No hay que arrancar nada: abre la dirección y entra con la contraseña **antes** de empezar el directo.
- Para verificar a cada candidato, **Ver su perfil** y **Ver la publicación** abren Instagram en otra pestaña (o en la app de Instagram). Vuelve al navegador para responder **✓ Sí** / **✗ No**. Si el navegador recargara la página, pulsa **Continuar sorteo**.
- **Si grabas la pantalla del móvil**, la grabación recoge también lo que ves en Instagram (el *"Te sigue"* de su perfil, el corazón de la publicación). Así queda como prueba de cada comprobación. Antes de empezar, cierra las notificaciones (modo *No molestar*) para que no salgan en el vídeo.
- **Pantalla completa** no aparece en iPhone porque Safari no lo permite. Con "Añadir a pantalla de inicio" se ve casi igual.
- Los resultados se descargan desde **Historial**. Descárgalos después del directo y guárdalos en un lugar seguro.

### 7.9 Cuando cambies el código

Sube los cambios a GitHub y Vercel los publica solo:

```powershell
git add -A
git commit -m "Describe el cambio"
git push
```

Puedes seguir la publicación en el panel de Vercel, en **Deployments**. Si falla, ahí aparece el motivo.

**Si después de un `git push` no aparece ninguna publicación nueva en Deployments:**
1. Publica igualmente desde la terminal, que siempre funciona:
   ```powershell
   npx vercel --prod
   ```
2. Revisa la conexión con GitHub: proyecto → **Settings → Git**.
   - Si no hay ningún repositorio conectado: **Connect Git Repository** → `AlbaEH-APPs/App_Sorteo_Instagram`.
   - Si está conectado y aun así no publica: puede que Vercel esté bloqueando el repo de organización. Sigue publicando con `npx vercel --prod`.

### 7.10 Cuando renueves el token o cambies la contraseña

1. En Vercel: **Settings → Environment Variables**, edita `IG_TOKEN` o `APP_PASSWORD` y guarda.
2. Ve a **Deployments**, abre el menú **⋯** de la última publicación y pulsa **Redeploy**. Esto se puede hacer **desde el móvil**.

Cambiar `APP_PASSWORD` **cierra todas las sesiones abiertas**: útil si crees que alguien la conoce.

### 7.11 Instalarla en el móvil como una app

La app se puede añadir a la pantalla de inicio del móvil:
- sale **con el logo de Kalidoskopio** de icono y el nombre **"Kalidoskopio"** debajo,
- y se abre **a pantalla completa, sin la barra del navegador**, que además queda mejor en las grabaciones.

No hace falta ninguna tienda de apps.

**En Android (Chrome):**
1. Abre `https://sorteo-en-directo.vercel.app` en **Chrome**.
2. Pulsa el menú **⋮** (arriba a la derecha).
3. Elige **"Añadir a pantalla de inicio"** o **"Instalar aplicación"**, según la versión.
4. Confirma con **Instalar** o **Añadir**. El icono aparece en la pantalla de inicio o en el cajón de aplicaciones.

**En iPhone (Safari):**
1. Abre `https://sorteo-en-directo.vercel.app` en **Safari**. En iOS recientes también funciona desde Chrome.
2. Pulsa el botón **Compartir** (el cuadrado con la flecha hacia arriba), abajo en Safari o arriba en Chrome.
3. Baja y elige **"Añadir a pantalla de inicio"**. Si no aparece, pulsa **"Editar acciones"** al final de la lista y añádelo.
4. Deja el nombre **"Kalidoskopio"** y pulsa **Añadir**.

**A tener en cuenta:**
- **La primera vez que la abras desde el icono te pedirá la contraseña**, aunque ya hubieras entrado en el navegador. Sobre todo en iPhone, la app instalada guarda su sesión aparte. Como siempre, la sesión dura 12 horas.
- **Las actualizaciones llegan solas**: cuando publicas cambios, se ven al volver a abrirla. No hay que reinstalar nada.
- **Ver su perfil** y **Ver la publicación** abren Instagram. Para volver, usa el selector de apps del móvil. Si la app se recargara, pulsa **Continuar sorteo**.
- **Para conectar una cuenta de Instagram "desde este dispositivo"** (8.4 bis), mejor hazlo desde el **navegador** y no desde el icono. En iPhone, Instagram podría devolverte a Safari en lugar de a la app instalada. Una vez conectada, la app instalada ya la usa.
- **Para quitarla:** mantén pulsado el icono → **Eliminar** o **Desinstalar**. No borra ningún sorteo; los datos están en el servidor.

### 7.12 Problemas frecuentes en Vercel

| Qué ves | Qué hacer |
|---|---|
| `Falta configurar la contraseña (APP_PASSWORD) en Vercel` | Añade `APP_PASSWORD` (paso 7.5) y vuelve a publicar (paso 7.6) |
| `Falta conectar la base de datos (Upstash Redis) en Vercel` | Haz el paso 7.4 y vuelve a publicar |
| `No se pudo conectar con la base de datos` | Problema pasajero de Upstash: espera un momento y recarga. Si sigue, revisa en la pestaña *Storage* que la base de datos está conectada al proyecto |
| `Demasiados intentos. Espera 15 minutos.` | Se ha fallado la contraseña más de 10 veces. Espera y vuelve a intentarlo |
| Te pide la contraseña cada vez | Las sesiones duran 12 horas. Si te la pide antes, revisa que el navegador no esté en modo incógnito ni bloquee cookies |
| `Instagram: ... (código 190)` | El token ha caducado: renuévalo (sección 5) y sigue el paso 7.10 |
| Error al publicar con `npx vercel` | Copia el mensaje: suele indicar qué falta |

---

## 8. Conectar la cuenta de Instagram con un enlace

Sirve cuando **la cuenta del sorteo es de otra persona** (por ejemplo, una amiga que vive lejos). Tú creas un enlace desde la app y se lo mandas. Ella lo abre en su móvil, inicia sesión en Instagram y pulsa **Permitir**. Ya está:

- **No te da su contraseña** ni tiene que compartir pantalla.
- **Nadie copia ni pega el token**: la app lo recibe y lo guarda directamente en la base de datos.
- **El permiso se renueva solo**. Dura 60 días y la app lo renueva cuando le quedan menos de 50, al usarla o con una comprobación automática diaria. Solo habría que repetir el enlace si la app pasara **más de 60 días** sin renovarlo, o si ella retirara el permiso desde Instagram.

> Funciona **solo con la app publicada en Vercel**: Instagram exige una dirección `https://`.

**¿Por qué hay pasos que haces tú antes del enlace?** Cuando alguien pulsa el enlace, la app le dice a Instagram: *"soy la app Sorteos-IG; deja que esta persona me dé permiso y devuélvela a esta dirección"*. Para creérselo, Instagram necesita las claves de tu app (`IG_APP_ID` e `IG_APP_SECRET`) y tener registrada la dirección de vuelta (`…/api/ig/callback`), para no mandar nunca el permiso a una web falsa. Es como dar de alta la app en Instagram, **una sola vez**.

| Quién | Qué | Cuándo |
|---|---|---|
| Tú | Claves en Meta y en Vercel (8.2 y 8.3) | **Una sola vez** |
| Tú | Invitarla como Tester (3.6) | Una vez por cada cuenta |
| Quien tiene la cuenta | Cuenta profesional y aceptar la invitación de Tester (8.5) | Una vez |
| Tú | Crear el enlace y mandarlo (8.4) | Cada vez que se conecta una cuenta; casi nunca, porque se renueva sola |
| Quien tiene la cuenta | Abrir el enlace y pulsar **Permitir** (8.5) | Lo mismo |

### 8.1 Lo que necesitas antes

1. La app de Meta creada, con los dos permisos (pasos **3.2 a 3.4**).
2. La cuenta de tu amiga como **Tester de Instagram** de tu app (paso **3.6**), con la invitación **aceptada** por ella.
3. La app publicada en Vercel (sección **7**), en su **última versión**: arriba tiene que aparecer el botón **Instagram**. Si no aparece, publica con `npx vercel --prod`.
4. Saber su dirección: en este proyecto, `https://sorteo-en-directo.vercel.app`. La ves en el panel de Vercel → tu proyecto → **Domains**.

### 8.2 Copiar las claves de la app de Meta (tú, una vez)

1. En https://developers.facebook.com/apps abre tu app.
2. Ve a **Casos de uso → Personalizar** (el de Instagram) → **Configuración de la API con el inicio de sesión para empresas de Instagram** (*API setup with Instagram business login*).
3. En la franja de arriba de esa página verás:
   - **Identificador de la aplicación de Instagram** (*Instagram App ID*): un número. Cópialo.
   - **Clave secreta de la aplicación de Instagram** (*Instagram app secret*): pulsa **Mostrar** y cópiala. Es secreta: no la compartas.

   > Cuidado: son las de **Instagram**, no el "Identificador de la app" que sale arriba del todo en el panel, que es otro número distinto.

4. En el apartado **1. Añade los permisos**, pulsa **Add all required permissions** si aún no están añadidos. Los apartados **2** (identificadores de acceso) y **3** (webhooks) **no hacen falta**.
5. En el apartado **4. Configura un inicio de sesión empresarial de Instagram**, pulsa **Configurar** y, en **URI de redireccionamiento de OAuth** (*OAuth redirect URIs*), añade **exactamente** esto. Si en la ventana hay más campos (por ejemplo *Embed URL*), ignóralos.
   ```
   https://sorteo-en-directo.vercel.app/api/ig/callback
   ```
   Tiene que empezar por **`https://`**, terminar en **`/api/ig/callback`**, sin barra al final y sin espacios. Poner solo `sorteo-en-directo.vercel.app` **no vale**: Instagram rechazaría la vuelta con un error de dirección no válida. Si Meta añade una barra `/` al final al guardar, quítala y guarda otra vez.
6. Pulsa **Guardar** (*Save*).

### 8.3 Poner las claves en Vercel (tú, una vez)

En Vercel → tu proyecto → **Settings → Environment Variables**, añade:

| Key | Value | Type |
|---|---|---|
| `IG_APP_ID` | El *Instagram App ID* | Config |
| `IG_APP_SECRET` | El *Instagram app secret* | **Secret** |

Environment: *Production*. Guarda y vuelve a publicar: **Deployments → ⋯ → Redeploy**.

> Si pusiste antes la variable `IG_TOKEN`, puedes dejarla o borrarla. La cuenta conectada con enlace tiene preferencia.

### 8.4 Crear y mandar el enlace (tú, desde el móvil)

Antes:
- Espera a que tu amiga haya **aceptado la invitación de Tester** (8.5, primer mensaje). Si no, Instagram le dará un error.
- Si queda algún **sorteo de prueba a medias**, termínalo o pulsa **Cerrar sin terminar**: con uno pendiente no se puede empezar otro.

Después:
1. Abre la app **en su dirección principal** (la de *Domains*, no una dirección de prueba con letras raras) y entra con tu contraseña.
2. Arriba, pulsa **Instagram**.
3. Pulsa **Crear enlace de conexión**.
4. Pulsa **Compartir** y mándaselo por WhatsApp, o **Copiar** y pégalo donde quieras.

El enlace **vale para un solo uso y caduca en 24 horas**. Si caduca, crea otro.

### 8.4 bis. Otra forma: que ella conecte su cuenta desde la propia app

Si le das **la dirección de la app y la contraseña** (`APP_PASSWORD`), puede hacerlo ella sola, sin que le mandes ningún enlace:

1. Abre `https://sorteo-en-directo.vercel.app` en su móvil y entra con la contraseña.
2. Pulsa **Instagram** → **Conectar una cuenta desde este dispositivo**.
3. Instagram le pide iniciar sesión (con **su** cuenta) y pulsar **Permitir**.
4. Sale **"¡Cuenta conectada!"** con el botón **Volver a la app**.

Ten en cuenta:
- **La invitación de Tester (3.6) sigue haciendo falta.** Es una regla de Meta, entre por donde entre.
- **Con la contraseña tiene acceso a todo**: hacer sorteos, ver, descargar y borrar el Historial, y desconectar la cuenta. Hay una sola contraseña, sin permisos distintos por persona. Si solo quieres que conecte su cuenta, mejor el enlace (8.4).

### 8.5 Lo que hace tu amiga (desde su móvil)

Puedes reenviarle estos mensajes tal cual. **El primero, en cuanto la hayas invitado como Tester (3.6)**:

> ¡Hola! Para conectar tu Instagram a la app del sorteo necesito que hagas dos cosas desde el móvil (son 2 minutos):
>
> **1. Que tu cuenta sea profesional** (si ya lo es, sáltate esto): en Instagram → tu perfil → ☰ → Configuración → *Tipo de cuenta y herramientas* → *Cambiar a cuenta profesional* → *Creador*.
>
> **2. Aceptar una invitación**: abre esta dirección en **Safari o Chrome** (no en la app de Instagram):
> https://www.instagram.com/accounts/manage_access/
> Entra en la pestaña **Invitaciones de tester** y pulsa **Aceptar** en "Sorteos-IG". Si no ves las pestañas, activa en el navegador "Ver versión para ordenador".
>
> Avísame cuando lo tengas y te mando un enlace.

**El segundo, junto con el enlace (8.4):**

> Abre este enlace en el móvil, inicia sesión en Instagram si te lo pide y pulsa **Permitir**. Te saldrá "¡Cuenta conectada!" y ya está.
>
> La app solo lee los comentarios para hacer el sorteo: no publica nada ni ve tu contraseña. Puedes quitarle el permiso cuando quieras en https://www.instagram.com/accounts/manage_access/

### 8.6 Comprobar

1. En la app, en la pantalla **Instagram**, pulsa **Comprobar de nuevo**.
2. Tiene que poner **Conectada @cuenta_de_tu_amiga** y la fecha hasta la que dura el permiso.
3. Arriba a la derecha aparece **@cuenta_de_tu_amiga** en lugar de "Modo demo".
4. Vuelve atrás: ya puedes elegir sus publicaciones y preparar el sorteo.

### 8.7 Probar primero con tu cuenta y cambiar después a otra

Se puede probar todo con una cuenta tuya y después conectar la de tu amiga. La app usa siempre **la última cuenta conectada con un enlace**: la nueva sustituye a la anterior automáticamente, sin borrar nada ni volver a publicar.

**La cuenta de prueba** tiene que cumplir lo mismo que la definitiva:
1. Ser **profesional** (3.1). Pasar tu cuenta personal a Creador es gratis y se puede deshacer.
2. Ser **Tester de Instagram** de tu app (3.6), con la invitación aceptada. Puede haber varias cuentas tester a la vez.
3. Tener **alguna publicación con comentarios** (mejor con menciones), para ver que la app los lee y los cuenta bien.

**La prueba:** crea un enlace (8.4), ábrelo **tú** en el móvil con la cuenta de prueba, pulsa Permitir y haz un sorteo completo.

**Para cambiar a la cuenta definitiva:**
1. Termina o cierra cualquier sorteo de prueba a medias.
2. Crea un **enlace nuevo** y mándaselo (8.4 y 8.5). Cuando lo acepte, pulsa **Comprobar de nuevo** y verás su cuenta.
3. Opcional: quita el permiso de tu cuenta de prueba en https://www.instagram.com/accounts/manage_access/

Ten en cuenta:
- **Abre cada enlace con la cuenta correcta.** Si el navegador del móvil ya tiene otra cuenta de Instagram abierta, puede conectar esa. Si no ves la pantalla de inicio de sesión, revisa qué cuenta está activa antes de pulsar Permitir.
- **El Historial guarda también los sorteos de prueba**, junto a los reales. Se distinguen por la fecha y la publicación. Todavía no hay botón para borrarlos (ver *Mejoras pendientes* en la Documentación).

### 8.8 Si algo falla

| Qué pasa | Qué hacer |
|---|---|
| En la app: "Faltan IG_APP_ID e IG_APP_SECRET" | Haz el paso 8.3 y vuelve a publicar |
| A tu amiga, Instagram le dice que la app no está disponible, o un error de permisos | Comprueba que aceptó la invitación de **Tester** (paso 3.6) |
| A tu amiga, Instagram le da un error de *redirect_uri* / "URL no válida" | La dirección del paso 8.2.5 no coincide **exactamente** con la de la app. Revisa que es `https://…/api/ig/callback`, sin barra al final, y que creaste el enlace desde la dirección principal |
| Tu amiga ve "Enlace caducado" | Ya se usó o pasaron 24 h: crea uno nuevo |
| Tu amiga ve "No se ha conectado" | Pulsó cancelar en Instagram: crea uno nuevo |
| Tu amiga ve "No se ha podido conectar" y un mensaje de Instagram | Mándame ese mensaje. Suele ser la clave secreta mal copiada (paso 8.3) |
| En la app: "El permiso de @… caducó" | Crea un enlace nuevo y repetid los pasos 8.4 y 8.5 |
| Aviso en la pantalla principal: "El permiso de Instagram de @… caduca en N días y no se ha podido renovar solo" | Pulsa **Conectar de nuevo**, crea un enlace y repetid los pasos 8.4 y 8.5. El motivo del fallo se ve en la pantalla Instagram |
| En la app: "Instagram: … (código 190)" | Ella ha quitado el permiso o ha cambiado la contraseña: crea un enlace nuevo |
