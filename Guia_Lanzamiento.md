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

Usa 260 comentarios inventados en una publicación de prueba. Sirve para ensayar el directo y para enseñar la app sin tocar la cuenta real.

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
3. La persona dueña de la cuenta la acepta desde Instagram en el navegador: **Configuración → Apps y sitios web → Invitaciones de tester**.
4. Después ya se puede hacer el paso 3.5, iniciando sesión con esa cuenta (lo puede hacer ella o contigo delante).

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
4. Ten escritas **las bases definitivas**: nº de ganadores, menciones mínimas, fecha y hora de cierre y cuentas excluidas.

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
2. Elige la publicación del sorteo y pon las bases.
3. Pulsa **Actualizar** para ver el recuento con los últimos comentarios.
4. Ten Instagram abierto en otra pestaña o en el móvil, con la sesión de la cuenta del sorteo, para verificar a los candidatos.
5. Cierra otras ventanas y notificaciones que no quieras que salgan en pantalla.

**En directo:**

1. Pulsa **Ir a la pantalla del sorteo** y después **Pantalla completa**.
2. Pulsa **¡Sortear!** o la barra espaciadora. En ese momento se leen los comentarios y se fija el orden.
3. Con cada candidato, comprueba en Instagram si **te sigue** y si **ha dado like** (botones *Ver perfil* y *Ver publicación*) y responde Sí / No.
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
| No aparece la publicación del sorteo | Solo se muestran las **20 últimas** publicaciones | Si es más antigua, avísame para añadir que se pueda elegir |
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

Elige **Continue with GitHub** y acepta en el navegador. Después:

```powershell
npx vercel
```

Te hará unas preguntas. Responde así:

| Pregunta | Respuesta |
|---|---|
| Set up and deploy? | `Y` |
| Which scope? | Tu cuenta personal |
| Link to existing project? | `N` |
| Project name? | `sorteo-en-directo` (o el que quieras) |
| In which directory is your code located? | `./` (Intro) |
| Want to modify these settings? | `N` (la configuración ya está en `vercel.json`) |

Al terminar muestra una dirección de prueba. **Todavía no funcionará**: faltan la base de datos y la contraseña. Al abrirla verás un mensaje en rojo que lo indica, y eso es lo esperado.

### 7.4 Conectar la base de datos (Upstash Redis)

1. Entra en https://vercel.com/dashboard y abre el proyecto `sorteo-en-directo`.
2. Ve a la pestaña **Storage** y pulsa **Create Database** (o *Connect Database*).
3. En el catálogo (*Marketplace*) elige **Upstash** → **Redis** y pulsa **Continue**.
4. Elige:
   - **Plan:** *Free*.
   - **Región:** *US East (Virginia)*, la misma zona en la que Vercel ejecuta la app por defecto, para que vaya más rápida.
   - **Nombre:** por ejemplo `sorteo-datos`.
5. Pulsa **Create** y, cuando te pregunte, **conéctala al proyecto** `sorteo-en-directo` (marca todos los entornos: *Production*, *Preview* y *Development*).

Vercel añade solo las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`. No hay que copiar nada.

### 7.5 Poner la contraseña y el token

En el proyecto de Vercel: **Settings → Environment Variables**. Añade:

| Key | Value | Notas |
|---|---|---|
| `APP_PASSWORD` | La contraseña para entrar en la app | **Obligatoria.** Sin ella la app no funciona. Usa una larga y que no uses en otro sitio (por ejemplo, 4 o 5 palabras sueltas) |
| `IG_TOKEN` | El token de Instagram (sección 3) | Opcional. Si no la pones, la app funciona en **modo demo** |

En **Environments** deja marcado *Production* (y los demás si quieres). Marca la opción **Sensitive** si aparece, para que el valor no se pueda volver a ver.

> Puedes empezar sin `IG_TOKEN` para probarlo todo desde el móvil en modo demo, y añadirlo cuando tengas el token.

### 7.6 Publicar la versión definitiva

Las variables solo se aplican al **volver a publicar**. En la terminal:

```powershell
npx vercel --prod
```

Al final muestra la dirección definitiva, del tipo `https://sorteo-en-directo.vercel.app`. También la ves en el panel de Vercel, en **Domains**.

### 7.7 Probar desde el móvil

1. Abre la dirección en el móvil y entra con tu contraseña.
2. Comprueba arriba a la derecha: **"Modo demo"** o `@tu_cuenta`, según hayas puesto el token o no.
3. Haz un sorteo de prueba completo, como en el paso 2.3, incluido recargar la página a mitad.
4. Pulsa **Historial** y descarga uno de los archivos.
5. Truco: en el menú del navegador, **"Añadir a pantalla de inicio"**, para abrirla como una app.

Al iniciar sesión, la sesión dura **12 horas**. Pasado ese tiempo, la app vuelve a pedir la contraseña. Un sorteo a medias no se pierde: al volver a entrar aparece para continuarlo.

### 7.8 El día del directo, desde el móvil

Igual que la sección 4.4, con estas diferencias:

- No hay que arrancar nada: abre la dirección y entra con la contraseña **antes** de empezar el directo.
- Para verificar a cada candidato, **Ver perfil** y **Ver publicación** abren Instagram en otra pestaña (o en la app de Instagram). Vuelve al navegador para responder Sí / No. Si el navegador recargara la página, pulsa **Continuar sorteo**.
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

### 7.10 Cuando renueves el token o cambies la contraseña

1. En Vercel: **Settings → Environment Variables**, edita `IG_TOKEN` o `APP_PASSWORD` y guarda.
2. Ve a **Deployments**, abre el menú **⋯** de la última publicación y pulsa **Redeploy**. Esto se puede hacer **desde el móvil**.

Cambiar `APP_PASSWORD` **cierra todas las sesiones abiertas**: útil si crees que alguien la conoce.

### 7.11 Problemas frecuentes en Vercel

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

### 8.1 Lo que necesitas antes

1. La app de Meta creada, con los dos permisos (pasos **3.2 a 3.4**).
2. La cuenta de tu amiga como **Tester de Instagram** de tu app (paso **3.6**), con la invitación **aceptada** por ella.
3. La app publicada en Vercel (sección **7**) y saber su dirección, por ejemplo `https://sorteo-en-directo.vercel.app`. La ves en el panel de Vercel → tu proyecto → **Domains**.

### 8.2 Copiar las claves de la app de Meta (tú, una vez)

1. En https://developers.facebook.com/apps abre tu app.
2. Ve a **Casos de uso → Personalizar** (el de Instagram) → **Configuración de la API con el inicio de sesión para empresas de Instagram** (*API setup with Instagram business login*).
3. Baja al apartado **3. Configurar el inicio de sesión para empresas de Instagram** (*Set up Instagram business login*) y pulsa **Configuración del inicio de sesión para empresas** (*Business login settings*).
4. Ahí verás:
   - **Identificador de la app de Instagram** (*Instagram App ID*): un número. Cópialo.
   - **Clave secreta de la app de Instagram** (*Instagram app secret*): pulsa **Mostrar** (*Show*) y cópiala. Es secreta: no la compartas.

   > Cuidado: son las de **Instagram**, no el "Identificador de la app" que sale arriba del todo en el panel, que es otro número distinto.

5. En ese mismo sitio, en **URI de redireccionamiento de OAuth** (*OAuth redirect URIs*), añade **exactamente** (con tu dirección):
   ```
   https://sorteo-en-directo.vercel.app/api/ig/callback
   ```
   Sin barra al final. Si Meta añade una barra `/` al final al guardar, quítala y guarda otra vez.
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

1. Abre la app **en su dirección principal** (la de *Domains*, no una dirección de prueba con letras raras) y entra con tu contraseña.
2. Arriba, pulsa **Instagram**.
3. Pulsa **Crear enlace de conexión**.
4. Pulsa **Compartir** y mándaselo por WhatsApp, o **Copiar** y pégalo donde quieras.

El enlace **vale para un solo uso y caduca en 24 horas**. Si caduca, crea otro.

### 8.5 Lo que hace tu amiga (desde su móvil)

Puedes reenviarle estas instrucciones tal cual:

> 1. Abre el enlace que te he mandado.
> 2. Se abrirá Instagram: inicia sesión con tu cuenta, si no lo estás ya.
> 3. Verás que la app "Sorteo en directo" pide ver tu perfil y gestionar tus comentarios. Pulsa **Permitir**.
> 4. Saldrá una página que dice **"¡Cuenta conectada!"**. Ya puedes cerrarla.
>
> La app solo lee los comentarios para el sorteo: no publica nada ni ve tu contraseña. Puedes quitarle el permiso cuando quieras desde Instagram → Configuración → Apps y sitios web.

### 8.6 Comprobar

1. En la app, en la pantalla **Instagram**, pulsa **Comprobar de nuevo**.
2. Tiene que poner **Conectada @cuenta_de_tu_amiga** y la fecha hasta la que dura el permiso.
3. Arriba a la derecha aparece **@cuenta_de_tu_amiga** en lugar de "Modo demo".
4. Vuelve atrás: ya puedes elegir sus publicaciones y preparar el sorteo.

### 8.7 Si algo falla

| Qué pasa | Qué hacer |
|---|---|
| En la app: "Faltan IG_APP_ID e IG_APP_SECRET" | Haz el paso 8.3 y vuelve a publicar |
| A tu amiga, Instagram le dice que la app no está disponible, o un error de permisos | Comprueba que aceptó la invitación de **Tester** (paso 3.6) |
| A tu amiga, Instagram le da un error de *redirect_uri* / "URL no válida" | La dirección del paso 8.2.5 no coincide **exactamente** con la de la app. Revisa que es `https://…/api/ig/callback`, sin barra al final, y que creaste el enlace desde la dirección principal |
| Tu amiga ve "Enlace caducado" | Ya se usó o pasaron 24 h: crea uno nuevo |
| Tu amiga ve "No se ha conectado" | Pulsó cancelar en Instagram: crea uno nuevo |
| Tu amiga ve "No se ha podido conectar" y un mensaje de Instagram | Mándame ese mensaje. Suele ser la clave secreta mal copiada (paso 8.3) |
| En la app: "El permiso de @… caducó" | Crea un enlace nuevo y repetid los pasos 8.4 y 8.5 |
| En la app: "Instagram: … (código 190)" | Ella ha quitado el permiso o ha cambiado la contraseña: crea un enlace nuevo |
