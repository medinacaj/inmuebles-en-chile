# Cierre de mejoras de la auditoría

Base revisada: `4bec06905a575515fcd272d1a1161330c38e67bd`, coincidente con main remoto al iniciar la auditoría del 1 de noviembre de 2026. Esta entrega contiene cambios locales; no acredita merge, despliegue ni ejecución remota de Actions.

## Implementado

| Hallazgo | Cambio |
| --- | --- |
| Una baja reaparece con fallo del registro | Registro completo validado antes de mostrar fichas; respaldo local, fechas originales, rechazo de respuestas anteriores y protección contra solicitudes concurrentes. Reintento visible. |
| Exploración regional con filtros heredados | Región inicia filtros limpios. |
| Carrusel solicitado con avance automático | Rotación cada cinco segundos, retorno al inicio, pausa visible, foco/puntero y preferencia de movimiento reducido. |
| Navegación sin foco/historial | Foco en encabezado, hash de sección e historial Atrás/Adelante. Enlaces de ficha conservados. |
| Caída total RSS con salida exitosa | Salud por fuente, resumen de Actions, salida 1 tras guardar diagnóstico y contenido previo vigente. |
| Confusión entre revisión editorial y HTTP | Fecha editorial identificada en tarjeta/ficha, mensaje explícito y seguimiento por fuente. |
| Cifras sin evidencia revisada | Retiradas de portada y gráfico; fuentes y valores anteriores conservados para revisión documental. Simulador con supuestos editables. |
| QA no reproducible | package-lock, npm ci, Playwright/axe fijados, SHA de Actions y Dependabot para npm/Actions/Python. |
| Imágenes grandes | WebP 480/960 y srcset para fotos de referencia, con generador reproducible. |
| Accesibilidad sin control automático | Axe en 28 escenarios, nombre del filtro de noticias y nombres de enlaces coherentes con su texto visible. |
| Fondo móvil recortado por CSS heredado | Eliminado max-height de 220px y ajustado degradado para legibilidad del texto. |
| Documentación obsoleta | README, plan, operación y RSS actualizados; requisitos manuales separados de resultados automáticos. |

## Evidencia de desarrollo

Resultados finales de esta tarea:
- Node: 25 pruebas aprobadas (ejecución directa; el runner `node --test` resume un archivo en este entorno).
- Python: 14 pruebas aprobadas, incluida caída total con contenido conservado y resumen aislado de CI.
- Chromium: 11 regresiones de resiliencia, cinco pruebas de reproducción automática y 12 escenarios visuales aprobados.
- Axe: 28 escenarios, cero infracciones en las reglas automatizadas seleccionadas; no acredita WCAG integral.
- `npm audit`: cero vulnerabilidades conocidas reportadas.
- YAML de los workflows válido y `git diff --check` sin errores.
- Revisión independiente del código: sin hallazgos reproducibles; el revisor repitió las suites Node y Python.

Los comandos de validación están en README. Los informes JSON, capturas locales y mediciones de esta tarea se guardan en `test-results/` (ignorado por Git); CI conserva resultados como artefactos por 14 días. Las pruebas funcionales usan respuestas de red simuladas solo para reproducir errores, nunca para acreditar disponibilidad real.

Las imágenes móviles nuevas pesan 38.270 y 37.932 bytes frente a 221.573 y 258.323 bytes de los JPG originales (reducción aproximada 83% y 85%). Las variantes 960 pesan 139.334 y 124.000 bytes. Las fotografías e ilustraciones siguen siendo referenciales.

Medición local orientativa con Chromium, viewport 375 y 1440, servidor Python local y sin limitación de red/CPU: 205.273 y 528.762 bytes transferidos en el primer viewport, respectivamente. Incluye carga diferida; no es el peso de toda la página tras recorrerla. No equivale a LCP/INP/CLS de campo ni a rendimiento en red móvil.

## Pendientes externos concretos

| Pendiente | Requisito para cerrarlo |
| --- | --- |
| Dos fuentes con 403 y revisión de precios del catálogo | Consulta humana autorizada a cada ficha y evidencia de precio/condiciones; no sortear bloqueos. Ver REVISION_EDITORIAL.md. |
| Cifras de mercado | Documento preciso, tabla, período, cobertura y evidencia de lectura; ver INDICADORES.md. |
| Fotos oficiales/inventario | Permisos escritos y canal autorizado. No se han enviado solicitudes a terceros. |
| Firefox y WebKit | Permitir descargas desde `cdn.playwright.dev` y `playwright.download.prss.microsoft.com`, instalar navegadores oficiales y ejecutar la suite. |
| Safari/iPhone, Android y lector de pantalla | Dispositivos y revisión manual con evidencia; ver ACCESIBILIDAD_Y_RENDIMIENTO.md. |
| Publicación y CI remoto | Acceso a `api.github.com` y `medinacaj.github.io`, revisión de checks y despliegue real. Un push con GITHUB_TOKEN puede no disparar builds de Pages; comprobar configuración de publicación, sin introducir tokens personales en archivos. |
| Políticas de rama y notificaciones | Revisar settings de GitHub con permisos del mantenedor. Dependabot y workflows preparados no prueban que esos ajustes estén activos. |
| Producción comercial | Revisión legal/editorial, fuentes autorizadas y métricas reales. Mantener noindex. |

Backend, autenticación, MFA, roles y base de datos siguen condicionados a la futura publicación de anuncios propios. Añadirlos al portal informativo sin inventario ni requisitos de operación definidos no cerraría los problemas auditados.
