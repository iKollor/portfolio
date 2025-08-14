# VideoResponsive.astro

Componente de video responsivo sin hidratación, con AV1 como preferido y MP4 como fallback. Usa 720p por defecto y 1080p solo en pantallas grandes.

## Props

- base (string, requerido): prefijo de archivo dentro de `src/projects`. Ej: `CIDDT/CIDDT` resuelve a:
  - AV1 1080: `/src/projects/CIDDT/CIDDT_1080_av1.webm`
  - AV1 720:  `/src/projects/CIDDT/CIDDT_720_av1.webm`
  - MP4 1080: `/src/projects/CIDDT/CIDDT_1080_h264.mp4`
  - MP4 720:  `/src/projects/CIDDT/CIDDT_720_h264.mp4`
  - Poster:   `/src/projects/CIDDT/CIDDT_poster.jpg`
- poster (string, opcional): URL alternativa para el poster. Por defecto se infiere.
- largeBreakpoint (string, opcional): media query para 1080p. Default: `(min-width: 1024px)`.
- controls (boolean, opcional): default `true`.
- autoplay (boolean, opcional): default `false`. Si es `true`, fuerza `muted` y `playsinline`.
- loop (boolean, opcional): default `false`.
- preload ("none" | "metadata" | "auto", opcional): default `"metadata"`.
- className, style (string, opcional)
- width, height (number, opcional): default `1920x1080`.
- ariaLabel (string, opcional): requerido si `controls=false` por accesibilidad.

## Accesibilidad
Si `controls=false`, debes pasar `ariaLabel` describiendo el video; en desarrollo se lanza error para evitar problemas.

## Ejemplos

### Caso normal con controles
 
```astro
---
import VideoResponsive from "../components/VideoResponsive.astro";
---
<VideoResponsive base="CIDDT/CIDDT" />
```

### Caso hero (autoplay, loop, muted)
 
```astro
---
import VideoResponsive from "../components/VideoResponsive.astro";
---
<VideoResponsive base="CIDDT/CIDDT" autoplay={true} loop={true} controls={false} ariaLabel="Video destacado del proyecto CIDDT" />
```

## Notas
 
- El orden de `<source>` es AV1 primero y MP4 después.
- 1080p solo se anuncia con `media="(min-width: 1024px)"` por defecto.
- Sin JS en el cliente; se resuelven rutas en build.
