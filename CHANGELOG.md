# Historial de cambios

La versión del manifiesto es `1.0.0`; no se localizaron tags ni una release formal. Las fechas siguientes describen commits, no versiones comerciales ni despliegues acreditados por este archivo.

## Respaldo de continuidad — 2026-11-26 — rama de trabajo

- Rama `docs/respaldo-continuidad-20261126`, sobre main `437b4d647fa33ac1b5e676dd5203852ccb4911f9`.
- Recuperado por cherry-pick el cambio documental `1d4e949` del PR #17, conservando su texto y procedencia. El PR original permanece abierto; esto no lo fusiona.
- Añadidos AGENTS, memoria operativa, decisiones, continuidad autónoma, arquitectura/operación y evidencia de pruebas. README enlaza las fuentes de continuidad.
- Sin cambios a aplicación, datos públicos, dependencias o infraestructura. La publicación de esta rama se acredita mediante el SHA remoto en el informe de transferencia posterior al push; no se declara fusión a main.

## Integrado en main antes del respaldo

- 2026-11-15 — `5cd3c27` / PR #16: rechazar comprobaciones y filas de más de siete días, con pruebas de caducidad. No certifica stock ni precios.
- 2026-11-11 — `f52e88e`, `cac0435`, `766b3b0`: identidad compartida, favicons, contraste de favoritos, auditoría visual y evidencia histórica de CI/Pages.
- 2026-11-11 — `dcab647`: vistas previas de imágenes asociadas a artículos RSS y validación de origen; no se alojan fotos de artículos.
- 2026-11-02 — `15a47e3`: identidad coral/melocotón, Manrope y ambientación IA rotulada; sustituye la dirección editorial anterior.
- 2026-11-02 — `2a70e36`, `8bcdb23`: fiabilidad de estados, accesibilidad, carrusel automático, pruebas reproducibles y concurrencia QA por rama/PR.
- 2026-11-01 — catálogo de referencias, cinco regiones, favoritos/comparación local, fichas, búsqueda, RSS, guía y herramientas; retirada de datos DEMO y administrador ficticio. La auditoría inicial revisó `4bec069` y no aplicó correcciones en esa conversación.
- Hasta 2026-11-25 — actualizaciones automáticas de JSON. Son cambios de metadatos, no revisiones humanas ni nuevas funcionalidades. Véase `git log` para el historial íntegro.
