# Inmuebles en Chile

**Tu decisión, bien informada.** Portal informativo estático alojado en GitHub Pages: https://medinacaj.github.io/inmuebles-en-chile/

## Experiencia visual renovada
- Portada fotográfica editorial con navegación minimalista, tarjetas flotantes y llamada a la acción principal.
- Composición específica para móviles con menú desplegable accesible.
- Recursos WebP locales optimizados para móvil y escritorio; no representan ninguna publicación inmobiliaria.
- Páginas de guía, herramientas y privacidad con el mismo sistema visual.
- [Sistema visual, fuentes fotográficas y licencias](docs/SISTEMA_VISUAL.md).

## Estado actual

- Catálogo de diez referencias externas de cinco regiones con identificador interno, precio anunciado en origen y enlace directo; **no se garantiza disponibilidad**. Incluye proyectos de CFL Inmobiliaria y una parcelación anunciada por Inmobiliaria Patagonia.
- Portada con buscador directo por proyecto/comuna y región, exploración geográfica y seis referencias destacadas; el catálogo también filtra por precio inicial anunciado, tipo, operación y texto.
- Las dos referencias originales utilizan fotografías ilustrativas. Las otras ocho tienen **ilustraciones SVG originales y diferenciadas**: ninguna representa la propiedad real. Todas se etiquetan como referenciales y enlazan a la ficha original para consultar fotografías oficiales.
- Las tarjetas incorporan un acceso principal a las fotos y detalles en origen, corazón discreto para favoritos y un menú con ficha informativa ampliada, procedencia, estado del enlace, comparación y compartir.
- Enlaces al portal de origen desde las imágenes y los títulos.
- Filtros por texto, operación, tipo, región y presupuesto inicial en UF; búsqueda tolerante a acentos y ordenamiento por precio y superficie.
- Favoritos y comparación de hasta tres inmuebles, guardados **solo en el navegador**.
- Mercado Inteligente con indicadores orientativos y calculadora hipotecaria.
- **Actualidad autoalimentada:** la portada y Noticias consumen `data/news-feed.json`, generado automáticamente desde RSS de medios chilenos; filtra, deduplica y enlaza a artículos originales. En caso de fallo se muestra una selección editorial previa identificada como archivo.
- Navegación adaptativa, modo claro/oscuro y diálogos con gestión de foco.
- [Información y privacidad](informacion.html).
- [Guía para evaluar propiedades](guia.html) con lista de comprobación y enlaces a organismos oficiales.
- [Herramienta gratuita para corredores y propietarios](herramientas.html): crea un resumen compartible sin enviar datos al servidor ni publicar anuncios.
- Enlaces directos compartibles a referencias: `#ficha=IEC-PUB-2026-000001` (no implican oferta disponible).
- **Sin administrador público**: el antiguo panel ficticio se retiró del HTML y no existe backend ni autenticación.

## Participación y corrección editorial

- [Proponer un proyecto con fuente pública](https://github.com/medinacaj/inmuebles-en-chile/issues/new?template=proponer-proyecto.yml) es gratuito y **no incorpora el proyecto automáticamente**. Requiere una cuenta GitHub y revisión editorial.
- [Reportar un enlace o dato incorrecto](https://github.com/medinacaj/inmuebles-en-chile/issues/new?template=reporte-referencia.yml) para que se evalúe la referencia. No se solicitan datos personales.
- El menú de cada ficha muestra el enlace de reporte y su identificación interna. La propuesta no acredita identidad o autorización del anunciante.
- [Procedimiento operativo](docs/OPERACION_CATALOGO.md) para revisión de fuentes, informes de estado y seguimiento de incidencias.

## Contenido editorial automático

- Los titulares RSS se actualizan dos veces al día mediante [GitHub Actions](.github/workflows/auto-noticias.yml).
- Feeds de Diario Financiero, Cooperativa Economía, La Tercera y Servicio de Impuestos Internos, con filtros de vivienda, proyectos y financiamiento.
- No se copian artículos ni fotografías, y un artículo sobre un proyecto no se convierte automáticamente en un inmueble disponible.
- [Diseño, límites y operación del motor RSS](docs/AUTOALIMENTACION.md).
- La actualización puede retrasarse por fallos, bloqueos de proveedores o por programación de GitHub; la web muestra la fecha real del último éxito.

## Fiabilidad de referencias

La tarea [Revisar vigencia de publicaciones](.github/workflows/verificar-publicaciones.yml) comprueba diariamente las URLs y cuando cambia el catálogo o el script. Escribe los resultados en [data/listing-status.json](data/listing-status.json).

- `unavailable`: solo cuando el servidor responde 404/410 o la página muestra un aviso explícito de baja. Se oculta del catálogo.
- `unknown`: no se pudo comprobar disponibilidad; una respuesta HTTP 200 **no** significa oferta disponible.
- En la vista pública se indica qué enlaces respondieron a la comprobación y cuáles bloquearon el acceso; los estados de disponibilidad siguen sin confirmarse.
- Las bajas confirmadas se conservan si después la fuente se vuelve inaccesible.
- El comprobador está limitado a proveedores HTTPS explícitamente aprobados, controla redirecciones y tamaño de respuestas para evitar solicitudes peligrosas. Ampliar fuentes requiere revisar la lista de dominios.
- [Resumen operativo de revisión](scripts/audit-status.mjs) en cada GitHub Action de comprobación: muestra fuentes bloqueadas, fallidas y retiradas, así como resultados de más de siete días.
- Los falsos positivos, bloqueos, JavaScript de terceros y cambios de diseño aún exigen revisión manual.

La fuente de información del catálogo está en `const REAL` dentro de [index.html](index.html). Para proyectos inmobiliarios se admiten fichas oficiales del proyecto, siempre identificadas como tales y sin sugerir que exista una unidad disponible. No incorporar supuestas propiedades individuales sin ficha comprobable. No utilizar imágenes ajenas sin licencia.

## Desarrollo y verificación

Sin dependencias de producción: HTML, CSS y JavaScript en `index.html`.

Ejecutar pruebas locales con Node.js 22 o superior:

```bash
node --test scripts/tests.mjs
```

[Calidad del sitio](.github/workflows/validar-sitio.yml) ejecuta estas pruebas automáticamente ante cada cambio a `main` y en solicitudes de integración. [QA visual responsivo](.github/workflows/qa-responsive.yml) prueba Chromium en seis tamaños y dos temas; también incluye controles de Firefox y WebKit en móvil y escritorio y valida los enlaces profundos, fichas, el buscador de portada, la guía y la herramienta de anunciantes.

### Requisitos antes de producción comercial

1. Catálogo auténtico con fuentes autorizadas, imágenes originales licenciadas y verificación de vigencia.
2. Migrar datos a almacenamiento central y crear administración autenticada, permisos y auditoría.
3. Revisar normativa, responsabilidad editorial, privacidad y tratamiento de datos por asesoría competente.
4. Completar auditoría manual WCAG 2.2 AA y validación en Safari iOS, Chrome Android y dispositivos físicos; WebKit automatizado no equivale a Safari en un iPhone real.
5. Configurar monitorización y analítica conforme a privacidad, y revisar indicadores de rendimiento.
6. Plan SEO con URLs propias, canonical, sitemap y datos estructurados **solo cuando el contenido sea fiable**.

Se mantiene `<meta name="robots" content="noindex,nofollow">` durante esta fase para evitar indexación de referencias no confirmadas.

## Despliegue

GitHub Pages utiliza la rama `main` y carpeta raíz. Consultar el historial de GitHub Actions para confirmar cada despliegue; guardar en GitHub no significa por sí solo que la nueva versión ya esté publicada.

## Alcance

Este proyecto es independiente de la propuesta futura de registro y certificación inmobiliaria nacional. Los IDs `IEC-PUB-...` no son identificadores públicos oficiales ni certificaciones.

## Referencia de diseño de producto

Se ha tomado como inspiración conceptual el enfoque de utilidad para profesionales y clientes de The Real Brokerage; no existe afiliación, integración, reproducción de marca, base de datos o propiedad intelectual de esa empresa. La plataforma chilena sigue siendo un portal informativo y no actúa como corredor autorizado ni como intermediario de transacciones.

## Ampliación visible del catálogo (2026-11-01)

Ocho fichas adicionales, cada una con enlace al proyecto o anuncio original:

| Región | Referencia | Fuente |
|---|---|---|
| O'Higgins | Viñedos del Cachapoal | CFL Inmobiliaria |
| O'Higgins | Viñedos de Rancagua | CFL Inmobiliaria |
| Metropolitana | El Arroyo 10035 | CFL Inmobiliaria |
| Metropolitana | Vista Parque Las Pircas | CFL Inmobiliaria |
| Valparaíso | Santa Teresa del Mar | CFL Inmobiliaria |
| Valparaíso | Mirador El Yeco II | CFL Inmobiliaria |
| Valparaíso | Parquemar El Tabo | CFL Inmobiliaria |
| Los Lagos | Parque Estación Pupelde | Inmobiliaria Patagonia |

*Datos referenciales consultados en las fichas oficiales. No existe integración comercial con esas empresas, autorización para replicar sus fotografías ni confirmación independiente de unidades disponibles.*
