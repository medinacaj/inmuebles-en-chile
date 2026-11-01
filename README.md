# Inmuebles en Chile

**Tu decisión, bien informada.**

Primera versión pública de demostración, alojada únicamente en GitHub Pages. Portal editorial inmobiliario de Chile con catálogo de propiedades ficticias, fuentes informativas externas, módulo Mercado Inteligente y panel administrador de prueba.

## Publicación

En GitHub, abrir **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: /(root) → Save**.

URL prevista al activar Pages: https://medinacaj.github.io/inmuebles-en-chile/

## Limitaciones de esta etapa

- Las propiedades son ficticias y están señaladas como demostrativas.
- El panel de administración no tiene autenticación ni base de datos: utiliza únicamente localStorage en cada navegador y no cambia el catálogo de otras personas.
- Las referencias a noticias son enlaces hacia fuentes externas y no constituyen una sincronización RSS automática.
- El simulador es orientativo y el valor UF es editable; no consulta cotizaciones actuales.
- Se usa `noindex,nofollow` durante la fase de pruebas para evitar indexar publicaciones ficticias.

## Desarrollo

Página estática autónoma en `index.html` (HTML, CSS y JavaScript), sin dependencias externas. Para la versión de producción, incorporar una API, usuarios autenticados, almacenamiento compartido, fuentes verificadas y publicación automatizada.
