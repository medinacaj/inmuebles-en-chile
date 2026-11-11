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
- [ ] Commit/push y comprobación de la sincronización real y despliegue. Diferenciar resultados locales con fixtures de contenido real del proveedor.

## Evidencia local

25 pruebas Node y 25 Python aprobadas. Navegador: cinco escenarios de imágenes (incluye foto asociada, ausencia/error, host ajeno y artículo distinto), 12 escenarios visuales, 28 de axe y cinco de reproducción automática aprobados. El caso con foto usa una respuesta interceptada de prueba; no acredita por sí solo fotos actuales del proveedor.

La revisión independiente detectó redirecciones a portada/otra noticia y falta de turnos para artículos tras 16 fallos. Ambas regresiones se observaron RED, se corrigieron y pasaron GREEN: comprobación de URL final/canonical/og:url y registro de intentos con prioridad a artículos nunca consultados. Se revalidaron suites completas. El retorno suave del carrusel con listas largas se verifica esperando al compositor hasta tres segundos.

La conexión local al RSS devolvió CONNECT 403 del proxy. La actualización automática existente deberá producir el contenido real tras desplegar la funcionalidad; su comprobación se registra en el cierre de la tarea.
