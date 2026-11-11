# Identidad consistente y favicon

> **For agentic workers:** Use superpowers:executing-plans para implementar y verificar este ajuste.

**Goal:** Corregir las diferencias de color entre secciones y añadir el favicon que falta.

**Architecture:** Conservar la dirección «Coral cercano» aprobada. Centralizar colores en `brand.css`, conservar estilos estructurales separados y aplicar la preferencia de apariencia a todas las páginas desde un único script local.

**Tech Stack:** HTML, CSS, JavaScript sin dependencias de producción; Playwright para comprobación.

**Spec:** `docs/SISTEMA_VISUAL.md` y petición del usuario: favicon y auditoría para ordenar los colores entre secciones.

## Restricciones

- Mantener coral para acciones, carbón para texto, fondo cálido y superficies blancas; equivalentes cálidos en oscuro.
- Reservar el amarillo al pequeño acento decorativo de portada. Quitar su uso como fondo de precios y etiquetas repetidas.
- Usar superficies y bordes comunes en Actualidad, guía, herramientas, simulador y pie; avisos suaves para información contextual.
- No cambiar catálogo, noticias, fuentes, licencias, enlaces comerciales ni funciones reales.
- Usar rutas relativas compatibles con GitHub Pages bajo `/inmuebles-en-chile/`.

## Revisión prioritaria

- Preferencia guardada contraria al sistema al pasar del portal a páginas de apoyo.
- Almacenamiento local no disponible y preferencia del sistema.
- Tema cambiado en otra pestaña y cambios del sistema sin preferencia explícita.
- Favicons que devuelven HTML/404 o dependen de una ruta desde la raíz del dominio.
- Contraste, foco y desbordamiento en móvil después de retirar estilos heredados.

## Tareas

- [x] 1. Añadir `scripts/identity-check.mjs`: reproducir pérdida de preferencia entre páginas y diferencias de superficies; comprobar RED antes de corregir. Centralizar temas en `assets/js/theme.js` y `brand.css`; retirar paletas heredadas e inline CSS de las cuatro páginas. Actualizar `experience.css` y `subpages.css` con jerarquía consistente. Verificar GREEN.
- [x] 2. Crear un símbolo original de casa en coral/carbón (`assets/icons/favicon.svg`), PNG 32/180/192/512 e ICO 16/32. Declararlo en todas las páginas junto al manifest con alcance relativo; comprobar recursos y representación real a tamaño pequeño.
- [ ] 3. Registrar hallazgos y correcciones en `docs/AUDITORIA_VISUAL_2026-11-11.md`. Ejecutar Node/Python, identidad, composición, visual, accesibilidad y autoplay; revisión independiente del cambio completo. Publicar y comprobar Actions/Pages como en las mejoras anteriores.

## Diagnóstico inicial

Falta cualquier declaración de favicon. Hay cuatro bloques de estilos en HTML con paletas antiguas, además de tres hojas compartidas; Información conserva reglas propias de enlaces y bordes. La portada repite grandes paneles melocotón y resaltados amarillos en precios/categorías. La apariencia del portal lee `iech_theme`, mientras las páginas de apoyo solo obedecen al sistema: al navegar pueden cambiar de modo.

La auditoría inicial usa colores calculados y capturas de las cuatro páginas en claro/oscuro. Los recursos externos se bloquean durante estas capturas para aislar la interfaz; las ilustraciones de respaldo no indican que hayan desaparecido las imágenes reales de producción.

## Evidencia de ejecución

Node 25 y Python 25 aprobados; visual 12, composición 6, autoplay 5 y axe 28 sin infracciones detectadas. Identidad: 36 escenarios aprobados tanto en raíz local como bajo `/inmuebles-en-chile/`. La revisión independiente identificó un favorito con poco contraste en oscuro; se reprodujo RED y se corrigió GREEN con un color específico para superficies claras, conservando contraste en estado guardado. Publicación y comprobación remota pendientes al preparar este registro.
