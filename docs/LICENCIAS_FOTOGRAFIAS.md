# Incorporación de fotografías y renders oficiales

## Objetivo
Reemplazar imágenes editoriales por fotografías **del inmueble anunciado** o renders oficiales claramente identificados, sin presentar material genérico como una representación real del proyecto.

**Estado al 1 de noviembre de 2026:** las ocho fichas recientes usan ilustraciones SVG locales originales; las dos primeras usan fotografías de arquitectura ilustrativas. Ninguna imagen actual acredita características físicas de los proyectos.

## Condición previa: autorización
Antes de reproducir una fotografía de terceros, solicitar y conservar autorización del titular o una licencia expresa que permita su uso en este portal. No basta con que esté visible en la web, tenga una URL pública o permita enlazar directamente.

Referencia: [Departamento de Derechos Intelectuales de Chile](https://www.propiedadintelectual.gob.cl/node/554), Ley 17.336 (artículos 19 y 20).

Solicitar a cada inmobiliaria/corredor:
1. Archivos originales o canal autorizado de entrega.
2. Nombre del titular de derechos y confirmación de facultad para autorizar.
3. Proyectos, fotografías y renders concretos incluidos.
4. Permiso de publicación en `inmuebles-en-chile` y futuros dominios propios si procede.
5. Permiso para reducir, recortar, convertir a WebP/AVIF y almacenar/cachar los archivos.
6. Plazo, territorio, atribución requerida, limitaciones y eventual retirada.
7. Confirmación de que fotos y renders corresponden al proyecto, etapa o unidad identificada.
8. Canal y procedimiento de revocación o rectificación.

**Las respuestas y contratos con datos personales deben guardarse en un repositorio privado de evidencias**, nunca en el repositorio público del sitio. Registrar solamente una referencia interna no sensible.

## Clasificación del material
- `editorial_illustration`: ilustración genérica creada para la interfaz; siempre se muestra como ilustración referencial.
- `reference_photo`: fotografía de referencia ajena a un inmueble, con permiso de uso; se muestra como imagen ilustrativa.
- `official_render`: render aprobado del proyecto; debe etiquetarse como render, no fotografía.
- `property_photo`: foto aprobada de la propiedad o proyecto; no implica disponibilidad de unidades ni verificación registral.

Las dos categorías oficiales requieren `mediaRights` con `evidenceId`, `rightsHolder`, `grantedOn`, `expiresOn` (si corresponde), `scope` y `approvedBy` para poder publicarse. **No consignar datos falsos para superar controles.**

## Flujo operativo
1. Contactar a la fuente y solicitar la licencia por escrito.
2. Verificar la correspondencia entre imagen y proyecto (nombre, ubicación, etapa).
3. Guardar el documento de autorización en almacenamiento privado.
4. Comprimir y adaptar el recurso, eliminando EXIF y metadatos personales innecesarios.
5. Actualizar el catálogo con el tipo de imagen, fuente, licencia y fecha.
6. Comprobar `alt`, ratio, peso, carga en móvil, contraste de etiquetas y enlace a origen.
7. Ante revocación, baja o incertidumbre, retirar el medio y volver a la ilustración original.

## Solicitud orientativa de autorización

Asunto: Autorización de fotografías y renders — [nombre del proyecto]

Nos gustaría mostrar en el portal informativo Inmuebles en Chile imágenes oficiales de [proyecto], con atribución y enlace a su publicación original. El portal no anuncia disponibilidad certificada ni gestiona reservas.

¿Pueden autorizarnos por escrito la publicación, optimización (compresión, ajuste de dimensiones y conversión de formato) y almacenamiento de los archivos indicados, señalando titular, alcance, plazo, condiciones de atribución y procedimiento para solicitar su retirada?

No se interpretará la falta de respuesta como autorización.

## Situación actual
**No hay permisos oficiales aportados para estas ocho fichas.** La sustitución por imágenes reales está pendiente de recibirlos. Se puede abrir cada publicación de origen para ver sus fotografías o renders oficiales en la página de la inmobiliaria.
