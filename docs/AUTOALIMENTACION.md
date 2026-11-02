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

El resultado incluye: titular original, fecha de publicación declarada por el feed, medio, categoría y vínculo individual. No almacena artículos completos, contenidos restringidos, fotografías ni textos generados que puedan presentarse como hechos.

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
