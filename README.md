# Sorteo en directo

Pantalla para hacer sorteos de Instagram en directo, usando la API oficial.

- **Servidor (Node, sin dependencias):** guarda el token, descarga los comentarios, filtra los válidos y fija el orden al azar con `crypto`.
- **Web (React + Vite):** eliges publicación y bases, y en directo se ve la animación, la verificación manual (sigue / like) y el resultado.

## Requisitos

- Node.js 18 o superior
- Para usarlo con tu cuenta: cuenta de Instagram profesional (Creador) y un token de la app de Meta con `instagram_business_basic` e `instagram_business_manage_comments`

## Instalación

```bash
npm install
```

## Ensayar en modo demo (sin token)

```bash
npm run build
npm start
```

Abre http://localhost:3001. Sin `IG_TOKEN` el servidor usa participantes inventados.

## Usarlo con tu cuenta

macOS / Linux:

```bash
npm run build
IG_TOKEN=tu_token npm start
```

Windows (PowerShell):

```powershell
npm run build
$env:IG_TOKEN="tu_token"; npm start
```

## Desarrollo

En dos terminales:

```bash
npm run server   # API en el puerto 3001 (con IG_TOKEN si quieres datos reales)
npm run dev      # web con recarga en http://localhost:5173
```

## Cómo funciona el sorteo

1. Al pulsar **¡Sortear!** el servidor descarga los comentarios en ese momento, aplica las bases (menciones mínimas, cierre, excluidos, una participación por persona) y baraja a los participantes. Ese orden queda fijado y guardado antes de verificar a nadie.
2. La animación se para en el primero del orden. Compruebas en Instagram si te sigue y si ha dado like (botones *Ver perfil* y *Ver publicación*).
3. Si no cumple, se descarta y pasa al siguiente del orden. Si cumple, es ganador.
4. Al terminar se guarda todo en `resultados/`:
   - `…-orden.json`: configuración y orden completo del sorteo
   - `…-comentarios.csv`: todos los comentarios, con el motivo de descarte
   - `…-resultado.json`: ganadores, descartados en la verificación y suplentes

Atajos: **barra espaciadora** para sortear o pasar al siguiente. Usa **Pantalla completa** para el directo.
