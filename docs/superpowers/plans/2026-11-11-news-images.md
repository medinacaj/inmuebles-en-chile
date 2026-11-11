# Imágenes asociadas a noticias

El usuario solicita fotos reales en las tarjetas. El fallo actual está en dos capas: el agregador conserva solo siete campos textuales y la interfaz impone SVG de categoría.

## Cambios autorizados
- Extraer imágenes de RSS/Atom (Media RSS, enclosure y contenido HTML) con HTTPS y dominios de la fuente/CDN revisados.
- Cuando falten, leer solo metadatos de vista previa del artículo enlazado, con límites de tamaño, tiempo, redirecciones y número de consultas. Conservar resultados válidos entre sincronizaciones.
- Mostrar la imagen asociada en portada y Actualidad, con crédito, enlace al origen y sin enviar referrer. Mantener respaldo ilustrativo explícito para falta/error de foto.
- No descargar fotografías al repositorio, inventar permisos ni usar fotos genéricas como si pertenecieran a una noticia. Mantener el catálogo de inmuebles intacto.

## Verificación
- [x] RED/GREEN Python: RSS, Atom, HTML, OpenGraph, URL no permitida, preservación y límite de consultas.
- [x] RED/GREEN navegador: foto del artículo en ambas vistas, sin imagen, error y URL rechazada.
- [x] Node/Python y suites de interfaz pertinentes; revisión independiente.
- [x] Commit/push y comprobación de la sincronización real y despliegue. Diferenciar resultados locales con fixtures de contenido real del proveedor.

## Evidencia local

25 pruebas Node y 25 Python aprobadas. Navegador: cinco escenarios de imágenes (incluye foto asociada, ausencia/error, host ajeno y artículo distinto), 12 escenarios visuales, 28 de axe y cinco de reproducción automática aprobados. El caso con foto usa una respuesta interceptada de prueba; no acredita por sí solo fotos actuales del proveedor.

La revisión independiente detectó redirecciones a portada/otra noticia y falta de turnos para artículos tras 16 fallos. Ambas regresiones se observaron RED, se corrigieron y pasaron GREEN: comprobación de URL final/canonical/og:url y registro de intentos con prioridad a artículos nunca consultados. Se revalidaron suites completas. El retorno suave del carrusel con listas largas se verifica esperando al compositor hasta tres segundos.

La conexión local al RSS devolvió CONNECT 403 del proxy. La actualización automática existente deberá producir el contenido real tras desplegar la funcionalidad; su comprobación se registra en el cierre de la tarea.

## Publicación verificada

El cambio `dcab647` se publicó en `main`. La sincronización de producción [43019350189](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/43019350189) terminó correctamente y generó `55f6364`: 24 noticias, 12 con imagen del artículo, 16 consultas de metadatos y cuatro sin imagen disponible en ese intento. Los artículos restantes conservan respaldo ilustrativo y tienen turnos en siguientes sincronizaciones. Ninguna imagen se añadió manualmente ni se sustituyó por fotografías genéricas.

El despliegue [43019640009](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/43019640009) terminó correctamente sobre `55f6364`. Se verificó que las 12 imágenes tienen `sourceUrl` igual al artículo y provienen de los dominios de sus respectivos medios. El entorno local bloquea los dominios de los medios; no se afirma haber comprobado desde él la descarga final de esas fotos externas. Las cinco pruebas de interfaz pasaron con Chromium instalado, además de 25 pruebas Python y 25 Node. La prueba de interfaz usa una foto interceptada para comprobar representación, atribución y respaldo ante error, sin confundirla con imágenes reales de producción.

La [QA de navegador 43019350555](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/43019350555) terminó correctamente, incluidas imágenes, reproducción automática, accesibilidad, escenarios responsivos y compatibilidad Firefox/WebKit. También terminaron correctamente Calidad del sitio y revisión de vigencia. Tras incorporar los datos reales de producción, se repitieron los cinco escenarios del carrusel automático y pasaron.
