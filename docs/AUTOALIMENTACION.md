# Actualización automática de contenido

## Qué publica

La sección **Actualidad** y el bloque de noticias de la portada cargan titulares obtenidos de RSS externos desde data/news-feed.json, generado por scripts/ingest-news.py. No se necesitan cuentas ni pagos.

Fuentes iniciales chilenas, seleccionadas por ofrecer RSS público:
- Diario Financiero: https://www.df.cl/noticias/site/list/port/rss.xml
- Cooperativa, sección Economía: https://www.cooperativa.cl/noticias/site/tax/port/all/rss_5___1.xml
- Servicio de Impuestos Internos: https://www.sii.cl/pagina/actualizada/noticias/rss/siiall_rss.xml
- La Tercera: https://www.latercera.com/arcio/rss/
- El Diario Inmobiliario (fuente en evaluación): https://eldiarioinmobiliario.cl/feed/

El sistema consulta fuentes dos veces al día mediante GitHub Actions (.github/workflows/auto-noticias.yml). La periodicidad depende de GitHub Actions y no constituye garantía de ejecución exacta.

El resultado incluye titular original, fecha de publicación declarada, medio, categoría, vínculo individual y metadatos de una imagen asociada cuando existe. No almacena artículos completos, contenidos restringidos ni archivos fotográficos. Las imágenes se enlazan al recurso del medio con atribución; esto no declara una licencia nueva ni transfiere sus derechos.

## Reglas editoriales

1. Dominio HTTPS permitido y redirecciones comprobadas ANTES de acceder.
2. Descargas de XML limitadas a 1,5 MB y 14 segundos; sin ejecución de JavaScript.
3. Noticias con fecha interpretable, antigüedad máxima de 100 días y temática inmobiliaria.
   - Se excluyen coincidencias engañosas como títulos de novelas que incluyen «Casa».
   - Se descartan titulares sobre mercados extranjeros cuando no mencionan un contexto chileno. Esto reduce falsos positivos, aunque la revisión editorial sigue siendo necesaria.
4. Filtrado específico para vivienda, proyectos residenciales, hipotecarios, arriendos, construcción, subsidios y normativa afín.
5. Deduplicación por URL canónica, sin parámetros de seguimiento.
6. Máximo 48 enlaces, ordenados por fecha de origen.
7. Si alguna fuente falla, se conservan artículos anteriores vigentes y se registra el resultado de la comprobación.
8. Si el JSON no contiene titulares válidos o no carga, el sitio muestra el archivo editorial previo identificado como archivo. Si fallan fuentes pero hay titulares anteriores vigentes en el JSON, se conservan con su fecha de último éxito y un aviso de salud degradada. Nunca se simula una sincronización nueva.

Esta automatización no confirma que una oferta inmobiliaria esté disponible ni incorpora propiedades automáticamente.

## Cómo funciona

- GitHub Actions ejecuta pruebas de ingestión y recolecta los RSS.
- El resultado validado se guarda en data/news-feed.json y se confirma en git cuando hay cambios.
- GitHub Pages sirve el JSON y la portada lo consume sin depender directamente de los medios externos.
- El navegador muestra la fecha de sincronización y avisa si lleva más de tres días sin datos nuevos.
- La portada y Actualidad usan la imagen del artículo facilitada por Media RSS, enclosure, contenido RSS/Atom o metadatos OpenGraph/Twitter del propio artículo. Sin imagen válida, o si falla, se conserva el respaldo ilustrativo explícito.
- Los titulares dirigen siempre al artículo original de su fuente.

No se debe eliminar una atribución ni republicar contenido extenso de terceros. Si el titular original contiene datos erróneos, corresponde que el usuario consulte el medio fuente.

## Incorpora más fuentes

Antes de agregar un RSS: verificar que sea chileno y relevante, que ofrezca RSS público, que no exija credenciales y que el sitio tolere su consumo. Actualizar SOURCES con dominio permitido y categoría; agregar pruebas. Un feed argentino o de otro mercado no debería incluirse en una plataforma especializada en Chile salvo sección internacional explícita.

## Reproducción y pruebas

Python 3.12 (biblioteca estándar):

    python3 -m unittest discover -s scripts -p 'test_news.py' -v
    python3 scripts/ingest-news.py

La segunda instrucción necesita acceso a Internet. GitHub Actions genera el resultado real: NO inventar noticias si un proveedor bloquea o devuelve errores.

## Propiedades: integración diferente

Para publicar automáticamente viviendas o proyectos con precio y disponibilidad se necesita un feed/API autorizado por la inmobiliaria o corredor y términos que permitan replicar la ficha y sus imágenes. Hasta entonces, **solo se publica información editorial externa**. Las fichas actuales son referenciales y conservan el verificador de enlaces existente.

No se debe convertir un artículo sobre un proyecto inmobiliario en una nueva propiedad anunciada ni asumir disponibilidad por HTTP 200.

## Salud y alertas

`health`: `ok` cuando todas las fuentes responden y alguna aporta titulares; `degraded` cuando hay fallos parciales y titulares; `empty` cuando hay respuestas pero ningún titular válido nuevo; `failed` cuando todas fallan. Los dos estados intermedios generan advertencia; el fallo total devuelve código 1. El resumen de Actions muestra fuente, respuesta y titulares. Un proveedor que responde correctamente con cero titulares no actualiza `updatedAt` por sí solo.

El workflow conserva/publica el diagnóstico y los titulares anteriores vigentes antes de terminar con error ante caída total. No hay mensajes externos automáticos ni creación de incidencias; configurar notificaciones de GitHub Actions para recibir avisos. La publicación mediante el token de Actions puede no disparar otros workflows; comprobar el despliegue real en GitHub Pages.

## Imágenes asociadas a los artículos

Se priorizan Media RSS, enlaces enclosure y el contenido del feed. Como alternativa se consulta únicamente el prefijo HTML del artículo para leer su vista previa: máximo 300.000 bytes, seis segundos y tres redirecciones dentro del medio autorizado. Máximo 16 consultas de artículos por ejecución; una imagen comprobada se conserva tres días antes de intentar renovarla. Los intentos sin imagen también se guardan (`imageCheckedAt`), con descanso de 12 horas. Se priorizan artículos nunca consultados y luego los intentos más antiguos, para que un medio sin imágenes no impida revisar el resto. No se descargan archivos de fotos al repositorio, no se ejecuta JavaScript de los medios y no se utilizan imágenes genéricas como si fueran de la noticia.

`image` contiene `url`, `sourceUrl`, `origin` (rss/opengraph), `credit`, `alt` y `checkedAt`. El proceso de mezcla conserva estos campos y valida que corresponden al artículo. Se rechazan redirecciones a otra noticia o a la portada, y metadatos og:url/canonical incompatibles con el enlace solicitado. Solo se admiten HTTPS y dominios de la fuente o CDN configurados; se descartan SVG, logos y píxeles de seguimiento identificables. La interfaz vuelve a comprobar dominios y asociación antes de cargar la imagen. Para agregar un proveedor de imágenes, revisar tanto SOURCES del recolector como NEWS_IMAGE_SOURCES de la interfaz.

La tarjeta acredita la imagen y enlaza al artículo. Los derechos permanecen en sus titulares; la presencia de una URL o metadato no constituye permiso general de reutilización. Respetar las condiciones del proveedor y retirar fuentes o medios cuando proceda. Las imágenes se muestran como vistas previas del artículo, sin afirmar que documenten un inmueble disponible. La consulta directa por el navegador se describe en Información y privacidad y utiliza `referrerpolicy=no-referrer`.

`imageStats` informa cuántas imágenes se conservaron y cuántos artículos se consultaron o no ofrecieron una imagen válida. Si todos los RSS fallan, se conservan las imágenes válidas anteriores sin iniciar consultas adicionales. Pruebas: `npm run test:news` y, con servidor y Chromium, `npm run test:news-images`.
