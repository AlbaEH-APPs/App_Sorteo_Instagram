# Sorteo en directo

Pantalla para hacer sorteos de Instagram en directo, usando la API oficial de Instagram.

- **Servidor (Node, sin dependencias):** descarga los comentarios, filtra los válidos según las bases y fija el orden al azar con `crypto` antes de verificar a nadie.
- **Web (React + Vite):** eliges publicación y bases, y en directo se ve la animación, la verificación manual (sigue / like) y el resultado. Funciona también en el móvil.
- **Dos formas de usarla:** en tu ordenador (`npm start`) o publicada en **Vercel**, protegida con contraseña, para manejarla desde el móvil.
- **Cuenta de Instagram:** se conecta con un **enlace** que la persona dueña de la cuenta abre en su móvil, sin dar su contraseña. El permiso se renueva solo.

## Documentación

- **[Guía de lanzamiento](Guia_Lanzamiento.md)**: paso a paso para el modo prueba, el sorteo real, el token de Instagram, la publicación en Vercel y la conexión de la cuenta con un enlace.
- **[Documentación](Documentacion.md)**: cómo funciona por dentro (reglas del sorteo, archivos que genera, estructura, API, seguridad y mejoras pendientes).

## Arranque rápido (modo demo, en tu ordenador)

Requiere Node.js 18 o superior.

```bash
npm install
npm run build
npm start
```

Abre http://localhost:3001. Sin cuenta de Instagram conectada, la app usa participantes inventados para ensayar.

## Desarrollo

En dos terminales:

```bash
npm run server   # API en el puerto 3001
npm run dev      # web con recarga en http://localhost:5173
```
