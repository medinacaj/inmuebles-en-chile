# Sistema visual — Coral cercano

Dirección elegida y aprobada por el responsable del proyecto: llamativa y cercana. La maqueta de escritorio y móvil se aplica conservando el catálogo y las herramientas reales.

## Identidad

- Coral vivo `#FF6B5E` en acciones, con texto carbón `#262322` para legibilidad.
- Blanco cálido `#FFF9F5`, superficies blancas, melocotón `#FFE4D8` en Actualidad y herramientas.
- Amarillo `#FFCD57` para pequeños acentos y precios referenciales.
- Coral oscuro `#AD3026` para enlaces/textos pequeños; modo oscuro con superficies marrón cálido y coral claro.
- Manrope variable, peso 200–800, fuente local. Licencia SIL OFL en assets/fonts/OFL-Manrope.txt; origen @fontsource-variable/manrope 5.3.0, Manrope Project Authors.

## Composición y funciones

«Tu próximo lugar empieza aquí»: texto e imagen separados. Fotografía de ambientación a la derecha en escritorio y debajo del titular en móvil; nunca se usa como fondo del texto. Buscador flotante con texto, región y presupuesto sincronizado con el catálogo.

Actualidad inmediatamente debajo de portada/buscador, con carrusel automático cada cinco segundos, pausa visible, controles manuales, pausa sobre noticias/con foco y respeto al movimiento reducido. Tarjetas reales a continuación, regiones, guía y simulador. El corazón de cabecera abre los favoritos locales.

Catálogo, noticias, diálogos, guía, herramientas y privacidad comparten tokens, fuente, contrastes y estados de foco. No se añaden enlaces a secciones inexistentes ni inventario de ejemplo.

## Archivos

- assets/css/brand.css: tokens, fuente local y temas.
- assets/css/experience.css: composición del portal y controles responsive, reemplaza las antiguas capas de overrides.
- assets/css/subpages.css: páginas de apoyo.
- assets/photos/hero-coral.webp (1440×960) y hero-coral-mobile.webp (840×560): imagen de ambientación generada con IA, escena ficticia inspirada en arquitectura costera. Etiqueta visible y alt indican procedencia; no representa un proyecto del catálogo ni una ubicación verificada. Variantes WebP sin metadatos personales.
- assets/illustrations/news-*.svg: ilustraciones editoriales originales con paleta coral; no fotografías de noticias.
- scripts/brand-check.mjs: composición en seis anchos, cabecera, fuente, orden y presupuesto de portada.

Las fotografías antiguas hero-editorial*.webp permanecen como recursos históricos, con atribuciones Unsplash: Justin Wolff (https://unsplash.com/photos/7qD-iDyrdHY) y James Coleman (https://unsplash.com/photos/Ywyr5vjnExA). No se usan en la portada coral. Los originales y atribuciones de las fotos referenciales del catálogo se conservan.

## Validación

Node/Python, QA visual en seis anchos × dos temas, regresiones de estados, autoplay, composición y axe en páginas/diálogos. Firefox y WebKit en CI con navegadores oficiales. Una prueba automatizada no acredita WCAG integral ni Core Web Vitals de usuarios reales. Mantener noindex y las condiciones editoriales de publicación.
