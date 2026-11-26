# Memoria operativa — Inmuebles en Chile

Fecha: 26 de noviembre de 2026, America/Santiago. Estado del respaldo documental, sin despliegue ni cambios de aplicación.

## Identidad y revisiones

- Propietario: AJ-Med!n@, cuenta `medinacaj`. Producto: **Inmuebles en Chile**; lema «Tu decisión, bien informada».
- Repositorio público verificado: https://github.com/medinacaj/inmuebles-en-chile; origin HTTPS del mismo propietario/producto. Git HEAD simbólico y HTML público confirman `main`.
- Main al iniciar: `437b4d647fa33ac1b5e676dd5203852ccb4911f9` (25/11, actualización de estados). Versión package.json `1.0.0`; sin tags/release identificados.
- Código de aplicación más reciente: `5cd3c2790dac2c7ed799421b1023df386e5ce44c` / PR #16, integrado el 15/11; después hay actualizaciones de metadatos. Usar el SHA completo de main como base de reproducción.
- Rama de continuidad preparada: `docs/respaldo-continuidad-20261126`. Su SHA final se acredita después del push mediante la referencia remota/informe de entrega, no se intenta autorreferenciar el commit en este documento.
- Checkout inicial `work` en `be84e18` estaba limpio y atrasado respecto de main; sin commits locales exclusivos ni archivos sin seguimiento. Se conserva esa rama, sin reset ni force push.
- Se creó la continuidad desde main y se recuperó por cherry-pick `1d4e9490c3adbef76dea000ca85de0f28eb647a7` de `docs/readme-continuidad-20261121`, PR #17 abierto. Su aporte era solo README y se conserva completo. No se fusionó ni cerró aquel PR.

## Fuentes recuperadas y límites de continuidad

Se revisaron README, documentación de auditorías/producto/operación/indicadores/licencias/identidad, planes y especificación en `docs/superpowers/`, scripts, workflows, Git local/remoto, páginas públicas de PR/issues/Actions y el historial accesible de esta conversación. No existían MEMORIA_OPERATIVA, DECISIONES, AGENTS, CHANGELOG o CONTINUIDAD_NUEVA_SESION en main ni en la rama del 21/11.

La auditoría inicial de esta conversación examinó `4bec069` y entregó diez hallazgos A01–A10; entonces no se modificó el producto. Detectó recorte móvil, reaparición de bajas, falta de inventario verificado, filtros heredados, selector sin etiqueta, comparación ambigua, caducidad RSS, controles de publicación, documentación e imágenes/CSS. Los commits posteriores y las auditorías versionadas registran las correcciones: no asumir que siguen todos abiertos.

El documento de Notion [40bcb37b0d8181f58f2fe6982b08f9c7](https://app.notion.com/p/40bcb37b0d8181f58f2fe6982b08f9c7) devuelve una página **eliminada y vacía** al consultarlo ahora. Los archivos temporales originales, capturas y JSON de aquella auditoría ya no están en el entorno. Esta síntesis es reconstruida del historial, no un original recuperado ni una restauración de Notion. La implementación/documentación actual sí está íntegra en Git; consultar sus auditorías versionadas.

## Implementado, integrado y por verificar

| Área | Estado comprobado / fuente |
| --- | --- |
| Sitio estático, catálogo y navegación | Implementado e integrado; 4 páginas, 3 secciones en portada, filtros, URL/historial/foco, favoritos/comparación locales y fichas |
| Catálogo | 10 referencias maestras, 5 regiones; JSON del 25/11: 7 HTTP 200 unknown, 2 HTTP 403 unknown y 1 baja conservada; 9 visibles. Ninguna disponibilidad comercial confirmada |
| Fiabilidad | Registro completo antes de publicar tarjetas, caché, reintento, validación de fechas globales/filas y límite siete días; PR #16 integrado. La suite actual tiene un fallo de conservación de baja pendiente de diagnóstico |
| Noticias | RSS/Atom de 5 fuentes, metadatos públicos, filtros/deduplicación/fechas/salud, previews con atribución, fallbacks; no crean ofertas de inventario |
| Diseño | Coral cercano y Manrope locales; ambientación IA rotulada, variantes WebP, tokens/tema compartidos, favicons y manifest. Sustituye diseño histórico editorial |
| Utilidades | Guía y generador de resumen local, sin servidor de datos ni publicación automática |
| Producción comercial | No habilitada/verificada. No cuentas, backend, pagos, leads o administración auténtica |
| Este respaldo | Solo documentación/evidencia y recuperación del README pendiente. Sin cambios de aplicación, JSON, dependencias, workflows ni infraestructura |

## Estado de GitHub observado el 26/11

- PR [#17](https://github.com/medinacaj/inmuebles-en-chile/pull/17) abierto: README de continuidad, recuperado en esta rama. Calidad histórica [44934747552](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/44934747552) success y QA [44934747510](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/44934747510) failure; no afirmar aprobación completa ni revisión humana.
- Dependabot abiertos [#11](https://github.com/medinacaj/inmuebles-en-chile/pull/11), [#12](https://github.com/medinacaj/inmuebles-en-chile/pull/12), [#13](https://github.com/medinacaj/inmuebles-en-chile/pull/13), [#14](https://github.com/medinacaj/inmuebles-en-chile/pull/14): checkout, setup-python, upload-artifact y Pillow. No aplicados por este respaldo.
- Issues abiertos: [#2 fotos](https://github.com/medinacaj/inmuebles-en-chile/issues/2), [#3 inventario](https://github.com/medinacaj/inmuebles-en-chile/issues/3), [#4 administración](https://github.com/medinacaj/inmuebles-en-chile/issues/4), [#15 auditoría multidisciplinaria](https://github.com/medinacaj/inmuebles-en-chile/issues/15). Se inspeccionó #15; el respaldo no completa esa auditoría ni cierra incidencias.
- Ramas históricas recuperadas: `codex/reject-stale-listing-reports-20261114`, `design/immersive-editorial-hero-20261101`, `feat/auto-content-rss-20261101`, `feat/portada-carrusel-inmuebles-20261101`, `fix/actualidad-visible-portada-20261101`, `fix/rss-chile-relevance-20261101`, `fix/stable-navigation-unified-interior-20261101`, `improve/catalog-governance-20261101`; más las ramas docs/Dependabot citadas. No se borraron. Los aportes funcionales pertinentes ya están integrados por commits/PR; revisar diff antes de reutilizarlas.
- Pages [45695881429](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/45695881429) success para `437b4d6`, verificado por HTML público. Vigencia [45695826547](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/45695826547) y RSS [45690254575](https://github.com/medinacaj/inmuebles-en-chile/actions/runs/45690254575) success. También se observó un fallo Pages anterior del 22/11, después sucedido por ejecuciones exitosas; no se diagnosticó.
- REST/GraphQL por `gh`: Forbidden en este entorno. Posteriormente quedó disponible el conector GitHub y confirmó repositorio público, main/base y acceso de escritura. Su lectura directa devuelve main `protected:false`, rulesets vacíos y ninguna revisión en PR #17. No se cambiaron permisos. La creación del PR nuevo se acredita por su resultado e informe posterior.

## Prioridades vigentes

| Prioridad | Pendiente | Condición de cierre |
| --- | --- | --- |
| P0 | Ninguno confirmado por este respaldo | No equivale a auditoría de seguridad completa |
| P1 | A02: diagnosticar fallo de prueba de baja guardada ante reporte anterior | Reproducción determinista que separe fixture/fecha/caché de una regresión real; baja no reaparece en casos cubiertos; no revivir inventario |
| P1 | Vigencia/precio/modelo/condiciones y licencias de datos/fotos (#2, #3) | Evidencia humana autorizada; fecha editorial real, derechos y canal de inventario. Resolver prioridad comercial antes de prometer stock |
| P1 antes de comercializar | Operación, privacidad/responsabilidad y administración (#4) | Decisiones del propietario y diseño de seguridad/recuperación; no construir backend solo para dar por cerrada una lista |
| P2 | Pruebas brand/visual/resilience dependen del catálogo vivo y fallan con una baja | Fixtures controladas separadas, IDs y bajas comprobados, conteos coherentes con política; pruebas siguen detectando errores reales |
| P2 | Comparación conserva ambigüedad de precio desde/superficie (A06) | Mostrar condiciones y evitar UF/m² si no hay modelo/superficie comparable; sigue pendiente en código leído |
| P2 | Auditoría #15, WCAG manual, iOS/Android reales, lector de pantalla | Evidencia por dispositivo/recorrido; no sustituir con axe |
| P2 | Revisión editorial de RSS/indicadores, protecciones y checks de rama, PR Dependabot | Documentos precisos y verificación de GitHub con permisos; no declarar settings activos sin acceso |
| P3 | SEO cuando proceda y métricas/optimización de campo | Mantener noindex hasta decisión; medir producción real |

## Pruebas, entornos y próxima acción

Resultados actuales, comandos y fallos: [RESPALDO_2026-11-26.md](RESPALDO_2026-11-26.md) y [JSON de evidencia](evidencias/continuidad-20261126.json). No sustituirlos por las aprobaciones históricas del 1/11 o 11/11.

- Integración GitHub de código previo: confirmada en main. Integración del respaldo a main: no realizada.
- Staging separado: no identificado/verificado. Desarrollo local: pruebas ejecutadas con servidor Python y Chromium del sistema.
- Producción: workflow Pages observado; funcionalidad pública, SHA instalado en ejecución y métricas de campo no comprobados de extremo a extremo. No hubo despliegue en esta tarea.

**Siguiente acción concreta:** desde la rama de continuidad, contrastar con main y reproducir primero `npm run test:resilience`, caso «respuesta antigua no reactiva una baja guardada más reciente»; revisar `scripts/resilience-check.mjs` y `validateListingReport`/`applyListingReport` en `index.html`. Aislar tiempo y catálogo de prueba antes de corregir producto. Después estabilizar fixtures de brand/visual frente a la baja de Pupelde y correr QA completa. No modificar `data/listing-status.json` para aprobarla. Mantener main sin cambios hasta revisión y checks pertinentes.
