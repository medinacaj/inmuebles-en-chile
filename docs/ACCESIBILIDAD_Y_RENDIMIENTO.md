# Verificación de accesibilidad y rendimiento

## Comprobaciones automáticas

Con servidor iniciado (`npm run serve`) y navegadores de Playwright instalados:

- `npm run test:visual`: seis resoluciones y dos temas en Chromium; filtros, favoritos, comparación, guía, herramienta y enlaces profundos.
- `npm run test:resilience`: registros lentos, fallidos, inválidos, caché, bajas conocidas, filtros heredados, historial/foco y carga de imágenes y altura completa del fondo de portada móvil.
- `npm run test:accessibility`: axe con reglas WCAG 2 A/AA, 2.1 A/AA y 2.2 AA; portada, catálogo, noticias, diálogo y tres páginas de apoyo, dos tamaños y dos temas.
- `npm run test:autoplay`: avance cada cinco segundos, retorno, pausa/reanudación, foco y preferencia de movimiento reducido.
- `npm run test:compatibility`: Firefox y WebKit en móvil/escritorio. WebKit automatizado no equivale a Safari físico.

Las suites Chromium aceptan `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` para usar el navegador disponible en un contenedor aislado. Las verificaciones automatizadas no acreditan cumplimiento integral WCAG.

## Verificación manual pendiente

Registrar dispositivo, versión del sistema/navegador, tecnología de asistencia, fecha, pasos y resultado en un PR o incidencia sin datos personales:

| Recorrido | Resultado exigido |
| --- | --- |
| Teclado desde el inicio | Saltar contenido, menú, cambio de sección con foco visible, filtros, tarjeta, diálogo y retorno del foco |
| VoiceOver en Safari/iPhone | Nombres coherentes, encabezados, estado de filtros, diálogo, cierre y lectura del resumen |
| TalkBack en Android/Chrome | Navegación y filtros, favoritos, compartir, controles del carrusel |
| Zoom 200% y 400% | Lectura y controles accesibles sin perder contenido |
| Movimiento reducido | Carrusel y navegación sin animación obligatoria |
| Conexión lenta, sin datos de estados | No aparecen fichas pendientes; mensaje y reintento utilizables |

No hay dispositivos físicos o lector de pantalla conectados a esta tarea. Estas filas son pendientes, no aprobaciones.

## Imágenes y medición

Las dos fotos de referencia originales se conservan como fuente; `scripts/optimize-images.py` genera WebP 480/960 sin copiar metadatos. El navegador selecciona `srcset` según ancho, viewport y densidad. El hero ya tiene recursos separados para móvil/escritorio. Mantener etiquetas de imagen ilustrativa y atribuciones.

La medición local debe registrar navegador, viewport, recurso elegido y bytes descargados. Es útil para comparar cambios, pero no sustituye métricas de usuarios reales (LCP, INP y CLS de campo). No se ha acreditado Core Web Vitals en producción ni rendimiento de red móvil real.
