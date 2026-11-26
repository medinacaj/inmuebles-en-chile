# Decisiones y restricciones del producto

Actualizado el 26 de noviembre de 2026, America/Santiago. Las decisiones de producto recuperadas se sustentan en el repositorio y su documentación; no se atribuyen instrucciones nuevas al propietario. Una decisión expresa posterior puede sustituirlas, registrando evidencia y motivo.

| Estado | Decisión | Fundamento / fuente |
| --- | --- | --- |
| [CONFIRMADO] | Inmuebles en Chile pertenece a `medinacaj` y usa `medinacaj/inmuebles-en-chile`, rama `main` | Remoto Git, HEAD remoto y HTML público de GitHub contrastados el 26/11 |
| [CONFIRMADO] | Portal informativo independiente del futuro registro/certificación nacional | README; IDs internos IEC-PUB no oficiales |
| [NO MODIFICAR] | No prometer disponibilidad, precio vigente, representación ni certificación documental | OPERACION_CATALOGO.md y REVISION_EDITORIAL.md; HTTP 200 solo acceso |
| [NO MODIFICAR] | Mantener bajas conocidas; validar registro completo/global y filas, edad máxima siete días | Código de validación y PR #16 integrado; no burlar el control con fixtures de producción |
| [NO MODIFICAR] | Noindex hasta revisión editorial y autorización para apertura SEO | README y PLAN_PRODUCTO.md |
| [NO MODIFICAR] | Fotos oficiales requieren evidencia de licencia; ilustraciones, IA y fotos genéricas llevan su procedencia | LICENCIAS_FOTOGRAFIAS.md y SISTEMA_VISUAL.md |
| [CONFIRMADO] | Identidad coral cercana, Manrope local, portada con texto e imagen separados, tema consistente | Dirección aprobada registrada en SISTEMA_VISUAL.md; cambios del 2 y 11/11 |
| [CONFIRMADO] | Carrusel de cinco segundos con pausa, foco/puntero y movimiento reducido | Implementación y suite autoplay; no eliminar controles de accesibilidad |
| [CONFIRMADO] | Favoritos, comparación y apariencia locales; sin cuentas ni sincronización remota | Código, información de privacidad y README |
| [CONFIRMADO] | RSS editorial e inventario son circuitos distintos | AUTOALIMENTACION.md; no crear ofertas desde noticias |
| [CONFIRMADO] | Las imágenes de noticias son previews externas atribuidas y validadas; no una licencia general ni imágenes del inventario | Ampliación del 11/11 y condiciones de proveedores |
| [CONFIRMADO] | Backend, autenticación, MFA, roles y almacenamiento son una fase condicionada a anuncios propios | Auditoría de cierre e Issue #4; no imponer PostgreSQL por una lista histórica |
| [CONFIRMADO: alcance de este respaldo] | Conservar código actual, recuperar documentación pendiente y publicar en rama sin desplegar | Instrucción del propietario del 26/11 en esta conversación |

## Contradicciones resueltas por evidencia posterior

1. La auditoría inicial del 1/11 describía una portada editorial y fallos abiertos. Los commits del 2/11 y el sistema visual posterior la sustituyen por coral y registran correcciones: no volver a construir el diseño anterior ni presentar todos los hallazgos históricos como aún existentes.
2. El primer informe tenía diez referencias visibles y cero bajas; el JSON de main del 25/11 tiene diez registros, una baja y nueve fichas visibles. Los conteos históricos no autorizan a reactivar la baja para pasar QA.
3. Documentos antiguos declaran pruebas o despliegue pendientes en aquella tarea; la auditoría visual del 11/11 aporta CI/Pages histórico y GitHub muestra ejecuciones posteriores. Mantener fechas y entornos: esas evidencias no verifican el respaldo actual en producción.
4. Las cifras de mercado antes visibles se retiraron por falta de revisión documental completa. Se conserva su procedencia en INDICADORES.md; no restaurarlas por el solo contraste parcial de la auditoría inicial.
5. La rama del 21/11 contiene documentación aún fuera de main. Se conserva su aporte por cherry-pick en la continuidad actual, sin cerrar ni fusionar el PR #17.

## No decidido / no verificado

Dominio propio, staging independiente, proveedor de backend, acuerdos de inventario, autorización de fotos oficiales, presupuesto operativo, responsables legales y aprobación del próximo despliegue. La lectura del conector GitHub el 26/11 confirmó main `protected:false` y rulesets vacíos: configurar protecciones continúa pendiente, sin cambios de permisos en este respaldo. No trasladar Namecheap/cPanel, Vercel, Transbank o configuraciones de otros productos.
