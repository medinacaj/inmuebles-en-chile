# Procedimiento operativo del catálogo

## Alcance
Inmuebles en Chile es actualmente un portal informativo estático. Un identificador IEC-PUB es interno y **no acredita titularidad, disponibilidad, identidad del anunciante ni vigencia de precios**.

## Incorporación de referencias
1. Recibir la propuesta mediante el formulario de GitHub (.github/ISSUE_TEMPLATE/proponer-proyecto.yml) u otra comunicación autorizada.
2. Verificar que la ficha pública corresponde a un proyecto real, con URL individual HTTPS, región, comuna y fuente explícita.
3. Distinguir **proyecto** de **unidad disponible**. Un proyecto anunciado no prueba que haya unidades a la venta.
4. Confirmar los precios publicados y anotar la fecha real de consulta. No asignar superficies o dormitorios inexistentes.
5. Revisar permiso de fotografías o renders en docs/LICENCIAS_FOTOGRAFIAS.md. Mantener ilustraciones referenciales si falta permiso.
6. Revisar que el dominio puede incorporarse al listado explícito TRUSTED_DOMAINS de scripts/check-listings.mjs. No aceptar localhost, direcciones privadas ni redirecciones ajenas.
7. Comprobar duplicaciones por URL, ID y proyecto. Mantener los IDs existentes inmutables.
8. Añadir la referencia mediante PR; ejecutar pruebas y revisar móvil antes de fusionar.

## Seguimiento y respuesta
La acción Revisar vigencia de publicaciones intenta consultar la página original a diario y cuando cambian scripts o catálogo. No lee datos privados ni ejecuta JavaScript de las fuentes.

- **HTTP 200:** página accesible, *disponibilidad desconocida*.
- **HTTP 403/429/5xx/timeout:** revisión inconclusa; no ocultar la propiedad solo por bloqueo.
- **HTTP 404/410 o mensaje explícito de baja:** ocultar mientras se evalúa la causa.
- **El enlace vuelve a funcionar:** no reactivar automáticamente una baja histórica sin evidencia humana.
- **Redirección no autorizada, página enorme o respuesta no HTML:** revisión inconclusa y anotación del motivo.

La tarea genera una tabla de revisión en el resumen de GitHub Actions mediante scripts/audit-status.mjs. No crea Issues automáticos para evitar alertas falsas.

## Incidencias de usuarios
Los informes se reciben mediante .github/ISSUE_TEMPLATE/reporte-referencia.yml; requieren cuenta GitHub y son públicos. No solicitar RUT, correos, teléfonos, escrituras ni direcciones privadas. Revisar origen, registrar evidencia pública y corregir mediante PR. No bloquear ni reactivar una ficha por una afirmación sin comprobación.

## Seguridad de despliegue
Este repositorio sirve páginas estáticas con GitHub Pages. No hay backend, cuentas, formularios personales ni base de datos. No crear tokens, roles administrativos ni pasarelas de pago ficticias. GitHub Pages no permite configurar todos los encabezados HTTP a nivel del repositorio; CSP estricta, WAF y políticas avanzadas dependen del alojamiento/CDN real y requieren pruebas.

## Evidencias y cierre
- Ejecutar node --test scripts/tests.mjs.
- Ejecutar QA Chromium (6 tamaños por 2 temas), Firefox y WebKit en GitHub Actions.
- Revisar resultados de verificación, especialmente enlaces bloqueados y retirados.
- Revisar CI antes de fusionar y confirmar pages build and deployment después.
- No afirmar pruebas en Safari iOS físico, conformidad WCAG 2.2 AA ni Core Web Vitals reales si no fueron medidos.

## Dependencias externas bloqueadas
Obtener imágenes oficiales requiere permisos de titulares; sincronizar inventario requiere acuerdos o APIs de anunciantes; y una administración segura requiere autenticación y persistencia. Ninguna tarea se resuelve únicamente con HTML estático.
