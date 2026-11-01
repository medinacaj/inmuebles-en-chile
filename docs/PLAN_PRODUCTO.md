# Plan de producto y controles de publicación

## Estado implementado (2026-11-01)
- Diseño adaptable a móvil, tablet y escritorio mediante CSS responsive.
- Referencias externas con ID interno, fuente, fecha y disponibilidad no confirmada.
- Favoritos y comparación local (sin cuentas), filtros y ordenamiento.
- GitHub Actions comprueba diariamente las URLs y al cambiar el catálogo, escribe `data/listing-status.json` y oculta publicaciones con señales explícitas de baja. El primer intento recibió HTTP 403 en ambas fuentes, sin poder comprobar su disponibilidad.
- El administrador ficticio y los datos DEMO fueron retirados del HTML público; falta construir un backend seguro.
- Las fotografías locales son **ilustrativas**, no imágenes auténticas de las propiedades.
- Se mantiene `noindex,nofollow` hasta contar con contenido verificable y política editorial operativa.

## Riesgos y límites actuales
1. El chequeo automatizado puede encontrar bloqueos, páginas dinámicas, captchas y falsos positivos. Estado `unknown` **no** significa disponible.
2. No existe API autorizada de disponibilidad de unidades ni confirmación de agentes. No publicar sello "disponible" solo por HTTP 200.
3. No hay permisos documentados para descargar fotos auténticas; no copiar fotos de terceros sin licencia.
4. El administrador antiguo en localStorage **no** es seguro y no publica cambios reales. Fue retirado del HTML público. Una administración real requiere autenticación y autorización del servidor.
5. El catálogo nacional requiere fuentes y acuerdos de publicación; no se debe inventar inventario.
6. Las noticias son una selección estática. La automatización necesita fuentes RSS/API autorizadas, control editorial, fechas y deduplicación.

## Mejoras de calidad ya añadidas
- Pruebas unitarias y de interacción con Node.js (`node --test scripts/tests.mjs`) ejecutadas en CI.
- Gestión de foco y teclado en diálogos, aviso de privacidad y mejoras de contraste.
- La lectura HTTP 403 de los portales inmobiliarios se considera estado desconocido, no disponible.

## Siguientes entregables antes de producción
- Migración de catálogo a PostgreSQL con tablas `properties`, `listings`, `sources`, `verification_events`, `media_licenses` y `audit_logs`.
- API con autenticación MFA para administradores, RBAC, políticas por recurso y validación de entrada.
- Workflow de revisión humana para publicaciones `unknown`, duplicadas o retiradas.
- Fotos reales únicamente con licencia y atribución; compresión WebP/AVIF, `srcset` y galería accesible.
- Cobertura regional gradual con fuentes consentidas y geocodificación segura; mapas solo para coordenadas fiables.
- SEO: URLs por inmueble, canonical, sitemap y datos estructurados `RealEstateListing` cuando el contenido sea verificado; eliminar `noindex` tras auditoría.
- Datos de mercado con fecha, método, fuente y actualización documentada.
- Noticias con feeds permitidos, deduplicación, revisión editorial y políticas de atribución.
- Pruebas automatizadas en 320/375/430/768/1024/1440px, Safari iOS, Chrome Android, escritorio, claro/oscuro, teclado y lector de pantalla.
- Analítica de eventos respetuosa de privacidad y métricas de vigencia, visitas, consultas y calidad.

## Reglas de publicación
- No mostrar como activa una publicación cuya baja se haya confirmado.
- Si el origen es inaccesible, marcar para revisión; no inferir disponibilidad.
- Nunca representar una imagen ilustrativa como imagen del inmueble.
- No presentar el identificador interno como certificado oficial.
- Separar claramente contenido editorial, anuncios y resultados patrocinados.
