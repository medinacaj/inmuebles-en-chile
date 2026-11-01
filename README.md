# Inmuebles en Chile

**Tu decisión, bien informada.** Portal informativo estático alojado en GitHub Pages: https://medinacaj.github.io/inmuebles-en-chile/

## Estado actual

- Catálogo limitado de referencias externas con identificador interno y precio referencial; no se garantiza disponibilidad de unidades.
- Imágenes locales **ilustrativas** (no son fotos de los inmuebles enlazados).
- Enlaces al portal de origen desde las imágenes y los títulos.
- Filtros por texto, operación, tipo y región; ordenamiento por precio y superficie.
- Favoritos y comparación de hasta tres inmuebles, guardados **solo en el navegador**.
- Mercado Inteligente con indicadores orientativos y calculadora hipotecaria.
- Selección editorial de enlaces de actualidad, sin sincronización automática.
- Navegación adaptativa, modo claro/oscuro y diálogos con gestión de foco.
- [Información y privacidad](informacion.html).
- **Sin administrador público**: el antiguo panel ficticio se retiró del HTML y no existe backend ni autenticación.

## Fiabilidad de referencias

La tarea [Revisar vigencia de publicaciones](.github/workflows/verificar-publicaciones.yml) comprueba diariamente las URLs y cuando cambia el catálogo o el script. Escribe los resultados en [data/listing-status.json](data/listing-status.json).

- `unavailable`: solo cuando el servidor responde 404/410 o la página muestra un aviso explícito de baja. Se oculta del catálogo.
- `unknown`: no se pudo comprobar disponibilidad; una respuesta HTTP 200 **no** significa oferta disponible.
- Las bajas confirmadas se conservan si después la fuente se vuelve inaccesible.
- Los falsos positivos, bloqueos, JavaScript de terceros y cambios de diseño aún exigen revisión manual.

La fuente de información del catálogo está en `const REAL` dentro de [index.html](index.html). No incorporar propiedades sin ficha individual comprobable. No utilizar imágenes ajenas sin licencia.

## Desarrollo y verificación

Sin dependencias de producción: HTML, CSS y JavaScript en `index.html`.

Ejecutar pruebas locales con Node.js 22 o superior:

```bash
node --test scripts/tests.mjs
```

[Calidad del sitio](.github/workflows/validar-sitio.yml) ejecuta estas pruebas automáticamente ante cada cambio a `main` y en solicitudes de integración.

### Requisitos antes de producción comercial

1. Catálogo auténtico con fuentes autorizadas, imágenes originales licenciadas y verificación de vigencia.
2. Migrar datos a almacenamiento central y crear administración autenticada, permisos y auditoría.
3. Revisar normativa, responsabilidad editorial, privacidad y tratamiento de datos por asesoría competente.
4. Probar accesibilidad WCAG 2.2 AA, navegación, contrastes y vistas de dispositivos en navegadores reales.
5. Configurar monitorización y analítica conforme a privacidad, y revisar indicadores de rendimiento.
6. Plan SEO con URLs propias, canonical, sitemap y datos estructurados **solo cuando el contenido sea fiable**.

Se mantiene `<meta name="robots" content="noindex,nofollow">` durante esta fase para evitar indexación de referencias no confirmadas.

## Despliegue

GitHub Pages utiliza la rama `main` y carpeta raíz. Consultar el historial de GitHub Actions para confirmar cada despliegue; guardar en GitHub no significa por sí solo que la nueva versión ya esté publicada.

## Alcance

Este proyecto es independiente de la propuesta futura de registro y certificación inmobiliaria nacional. Los IDs `IEC-PUB-...` no son identificadores públicos oficiales ni certificaciones.
