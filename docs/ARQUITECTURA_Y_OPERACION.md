# Arquitectura, seguridad y operación

## Estado confirmado en la base 437b4d6

Sitio estático en GitHub Pages, URL documentada https://medinacaj.github.io/inmuebles-en-chile/. No hay CNAME versionado ni evidencia de otro dominio, hosting o staging. No hay base de datos, migraciones, backend, autenticación, secretos de aplicación o pagos.

- `index.html`: aplicación de tres secciones y JavaScript inline. `const REAL` es el catálogo maestro; `NEWS` es archivo editorial de respaldo.
- `guia.html`, `herramientas.html`, `informacion.html`: guía/checklist, generador local y privacidad.
- `assets/css/brand.css`: tokens/Manrope/temas; `portal.css` y `experience.css`: estructura del portal; `subpages.css`: páginas de apoyo. `assets/js/theme.js` comparte preferencia entre páginas/pestañas.
- `data/listing-status.json`: comprobaciones HTTP, no inventario. Validación completa y caché local pública, rechazo de estados antiguos y reintento.
- `data/news-feed.json`: titulares, enlaces, fechas, salud y metadatos de imágenes externas. El navegador valida fuentes y caducidad; respaldo ilustrativo cuando falla una imagen.
- `scripts/check-listings.mjs`, `audit-status.mjs`: dominios aprobados, límites de descarga/redirecciones y resumen de revisión.
- `scripts/ingest-news.py`: RSS/Atom y previews con límites de tiempo/tamaño/dominio, filtros y deduplicación.
- `scripts/*check.mjs`, `tests.mjs`, `test_news.py`: QA. `optimize-images.py` utiliza Pillow de requirements-dev, solo para desarrollo.

No hay build, transpiler, lint o comprobador de tipos configurados. Servir los archivos no requiere npm. Las pruebas necesitan Node >=22 (CI: 22), Python 3.12 y `npm ci`; el manifiesto fija Playwright 1.64.1 y @axe-core/playwright 4.14.0. `private:true` evita publicar el paquete npm: el repositorio GitHub sí es público.

## Variables y credenciales

| Variable | Uso | ¿Secreto? |
| --- | --- | --- |
| `SITE_URL` | URL de prueba; por defecto http://127.0.0.1:8765/ en suites Chromium | No; no incluir tokens ni parámetros privados |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Ruta opcional al Chromium del sistema en entorno aislado | No |
| `GITHUB_STEP_SUMMARY` | Ruta provista por Actions para resúmenes | No; no definir manualmente en producción |
| `GITHUB_TOKEN` / credencial Git del ejecutor | Permisos de Actions/publicación; gestionados por la plataforma | Sí, nunca guardar ni imprimir valores |

No se requiere `.env` para el sitio. No inventar claves de Supabase, Vercel, bases de datos o servicios no utilizados.

## Automatización y despliegue

Actions valida Node/Python; QA ejecuta Chromium, identidad, composición, imágenes, resiliencia, autoplay, axe y Firefox/WebKit, conservando artefactos 14 días. Los workflows de vigencia y RSS actualizan JSON con permisos contents:write. RSS tiene programación `17 10,18 * * *` y vigencia `23 11 * * *` (cron UTC; ejecución exacta no garantizada).

Pages está documentado sobre main/raíz; se observó la ejecución [45695881429](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/45695881429) exitosa para 437b4d6. Esto acredita el workflow, no una prueba funcional del sitio público. El 26/11 no se cambió configuración ni se lanzó despliegue.

Para publicar cambios de producto: revisar diff/checks/PR, validar permisos de rama y confirmar el SHA efectivamente desplegado; obtener autorización de despliegue según el alcance. Para recuperación: conservar el SHA anterior, revertir mediante PR revisado y validar datos/estado antes de publicar; no hacer reset/force push ni ejecutar workflows de escritura como prueba local. La recuperación de un respaldo consiste en clonar la rama y verificar su SHA, sin modificar main.

## Seguridad y límites

Metadatos de catálogo/RSS son públicos; licencias privadas, datos de clientes, credenciales y documentos comerciales no pertenecen al repositorio. No ejecutar recopilación ni evadir bloqueos. Los previews de noticias producen solicitudes a terceros descritas en privacidad; usar los límites actuales y revisar nuevas fuentes.

Los datos de almacenamiento local no acreditan identidad. Mantener escaping y restricciones de URLs. Las pruebas usan simulaciones para errores, nunca para afirmar vigencia. No ejecutar actualizadores externos para probar integridad de documentos.

Ver [operación del catálogo](OPERACION_CATALOGO.md), [RSS](AUTOALIMENTACION.md), [licencias](LICENCIAS_FOTOGRAFIAS.md), [accesibilidad/rendimiento](ACCESIBILIDAD_Y_RENDIMIENTO.md) y [evidencia del respaldo](RESPALDO_2026-11-26.md).
