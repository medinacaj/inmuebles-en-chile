# Correcciones de auditoría: plan de ejecución

**Objetivo:** resolver los hallazgos implementables de la auditoría 4bec069 sin inventar validaciones editoriales o permisos externos.
**Arquitectura:** conservar HTML estático, Node >=22 y Python 3.12. Registro de estados validado antes de mostrar referencias; caché local del último registro válido como respaldo. Mantener la separación entre accesibilidad del enlace, revisión editorial y disponibilidad.
**Especificación:** auditoría de esta conversación, 1 de noviembre de 2026.

## Restricciones y decisiones
- Trabajar en la rama aislada existente `work`, sin publicar ni cambiar main remotamente.
- No crear inventario, autenticación, licencias o verificación de cifras ficticios.
- Mantener noindex. No extraer todos los datos/código de index.html en esta corrección: rompería el contrato del verificador; preparar estructura gradual y documentación.
- Un registro ausente/inválido nunca habilita una ficha por defecto. Respaldo solo de un informe validado y completo; avisar su fecha.
- Navegación regional empieza una búsqueda limpia. Secciones con foco y URL/historial coherentes.
- Fuente genérica sin evidencia precisa: retirar cifra de portada y mantenerla como pendiente documental; simulador usa tasa supuesta, explícitamente ilustrativa.

## Tareas y comprobaciones
- [x] 1. Regresiones de navegador para estados lentos, fallidos, inválidos, caché y bajas; filtros regionales e historial/foco. Ejecutar RED, corregir index.html, ejecutar GREEN y suite Node.
- [x] 2. Test de caída RSS completa con archivo anterior conservado y salida no cero; fuentes sin titulares no simulan actualización. RED/GREEN Python. Workflow publica diagnósticos y luego falla cuando corresponde.
- [x] 3. Revisión editorial visible y trazabilidad de indicadores; documentación al día, lista explícita de dependencias externas y seguimiento editorial por ID.
- [x] 4. Dependencias bloqueadas por lockfile, scripts npm, Actions con SHA oficial, artefactos QA y automatización de actualizaciones. QA admite Chromium del sistema mediante variable, sin copias auxiliares.
- [x] 5. Variantes WebP responsivas generadas desde recursos licenciados existentes, proceso reproducible y verificación funcional de carga; medición local sin atribuir Core Web Vitals reales.
- [x] 6. Suites completas, auditoría dependencias, revisión de diff independiente y registro final de evidencia/pendientes.

## Casos que guían revisión
- Primer acceso sin caché y servidor caído: sin tarjetas, aviso claro y reintento.
- Caché corrupta/incompleta/futura: rechazar; conservar baja ante fallo de red.
- Navegación desde filtros incompatibles y Atrás: sección y foco correctos.
- Cinco RSS fallidos: datos anteriores vigentes conservados, fecha de éxito intacta y Action roja con resumen.
- Fuentes inaccesibles y cifras sin documento comprobable: indicar pendiente; no simular verificación.

## Registro de ejecución

Todas las tareas implementables completadas; evidencia y limitaciones en docs/AUDITORIA_2026-11-01.md. Se observaron fallos RED antes de cada corrección funcional y se repitieron las suites GREEN.

Decisiones de alcance: se conserva el sitio estático y las cifras sin evidencia se retiran hasta su revisión; las fuentes/licencias/dispositivos y publicación permanecen como requisitos externos explícitos. No se enviaron mensajes a terceros ni se publicó el sitio. La revisión visual adicional encontró y corrigió max-height heredado de 220px en la portada móvil, con regresión incluida.

## Ampliación solicitada: carrusel automático

Avanzar una noticia cada cinco segundos mientras el carrusel esté visible; volver al inicio al terminar. Control visible Pausar/Reproducir, pausa al pasar el puntero o recibir foco, sin movimiento automático inicial con prefers-reduced-motion. Mantener navegación manual, no trasladar foco ni anunciar cada transición. Cubrir avance, retorno, pausa/reanudación y movimiento reducido con regresiones.
