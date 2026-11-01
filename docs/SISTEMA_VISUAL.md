# Sistema visual — Inmuebles en Chile

## Dirección de diseño (noviembre de 2026)

Basado en las referencias de experiencia web compartidas por el responsable del proyecto: **arquitectura como protagonista, navegación compacta, tipografía editorial de gran tamaño, pocos accesos flotantes y una experiencia móvil de composición propia**.

No replica marcas, textos, fotografías ni identidades visuales de las referencias.

### Principios

- Fotografía editorial de arquitectura con foco en el inmueble y tratamiento discreto del contraste.
- Título principal potente: «Vive el momento.»
- Tres accesos flotantes con funciones reales: explorar proyectos, guía de compra y actualidad.
- CTA de portada claro, sin botones redundantes.
- Navegación de escritorio simplificada y menú desplegable en móvil, con estado accesible.
- Búsqueda inmobiliaria debajo de la portada, no superpuesta sobre el texto principal.
- Fichas de proyectos con fotografía o ilustración **expresamente identificada como referencial**.
- Datos del mercado en una sección más oscura para establecer jerarquía sin depender de divisores repetitivos.

### Implementación

- `index.html`: estructura semántica y navegación de la portada.
- `assets/css/experience.css`: tokens visuales, jerarquía, tarjetas, menús y media queries.
- `assets/photos/hero-editorial.webp`: fotografía de portada de escritorio.
- `assets/photos/hero-editorial-mobile.webp`: fotografía de portada para móvil.
- `.github/workflows/descargar-fotos.yml`: descarga optimizada y trazable de ambos recursos Unsplash.
- Los cambios se validan con los controles existentes de Node, Chromium, Firefox y WebKit.

### Origen y licencia de las fotografías

Fotografías de ambientación bajo la [licencia Unsplash](https://unsplash.com/license), que permite usos comerciales y modificaciones con las condiciones de la licencia. Estos medios **no son fotografías de proyectos del catálogo**.

- **Escritorio:** Justin Wolff, «Modern luxury house with stone accents at sunset», https://unsplash.com/photos/modern-luxury-house-with-stone-accents-at-sunset-7qD-iDyrdHY
- **Móvil:** James Coleman, «Modern house with warm lights at dusk», https://unsplash.com/photos/modern-house-with-warm-lights-at-dusk-Ywyr5vjnExA

### Alcance y límites

- La presentación de la fotografía de portada no acredita características de ninguna propiedad publicada.
- No se inventan agentes, testimonios, fotografías de propiedades ni unidades disponibles.
- El sitio sigue usando GitHub Pages y el catálogo existente, sin rediseñar su modelo de datos.
- La conformidad WCAG 2.2 AA integral y los valores reales LCP/INP/CLS requieren auditorías complementarias en dispositivos y tráfico real.
- La actualización automática de noticias y el verificador de enlaces inmobiliarios siguen independientes del sistema visual.
