# Auditoría visual e identidad — 11 de noviembre de 2026

Solicitud: añadir el favicon y ordenar los colores entre secciones. Se conserva la dirección aprobada «llamativa y cercana», con coral, fondo cálido y Manrope.

## Hallazgos y correcciones

| Prioridad | Hallazgo | Corrección |
| --- | --- | --- |
| Alta | El portal usaba la preferencia guardada; guía, herramientas e información obedecían solamente al sistema. Navegar podía invertir claro/oscuro. | Un script local común aplica la misma apariencia antes del contenido y permite cambiarla desde las cuatro cabeceras. Sin preferencia explícita sigue al sistema; también sincroniza otras pestañas. |
| Media | Cuatro bloques de CSS dentro del HTML mantenían paletas antiguas; había colores propios en enlaces, bordes y estados. | Colores centralizados en `brand.css`, sin colores literales en las hojas de estructura. HTML sin bloques de estilos. |
| Media | Paneles melocotón grandes, categorías amarillas y precios resaltados competían con las acciones coral. | Fondo cálido común, paneles y pie con la misma superficie, precios en tinta y etiquetas suaves. El amarillo queda como acento pequeño en portada. |
| Media | Cabeceras y pie de Información diferían de las otras páginas. Las notas repetidas de Herramientas se mostraban todas como cajas destacadas. | Cabeceras y pies compartidos; notas explicativas en texto secundario y cajas suaves reservadas a avisos o resultados. |
| Media | Ninguna página declaraba un favicon. | Casa original en SVG, ICO 16/32, PNG 32, Apple 180 e iconos 192/512. Manifest y enlaces relativos al subdirectorio de publicación. |

## Criterio de color

Una acción principal usa coral; una acción secundaria usa la superficie del panel con borde. Encabezados y precios usan tinta; enlaces y estados seleccionados, coral oscuro. Los avisos usan un fondo melocotón suave. Todos tienen equivalentes cálidos para modo oscuro. Las imágenes editoriales conservan sus colores originales y no forman parte de la paleta de interfaz.

No se modifican las propiedades, noticias, fuentes ni las condiciones de uso de imágenes. Las capturas locales aíslan la interfaz bloqueando imágenes externas; el respaldo que aparece en ellas no significa que se hayan retirado las imágenes de artículos en producción.

## Comprobación

La prueba inicial reprodujo 32 fallos de consistencia, preferencia o ausencia de iconos. Tras la corrección pasaron 35 escenarios de identidad, incluidos cambio automático del sistema, navegación y sincronización entre pestañas, almacenamiento bloqueado y legibilidad de Información sin JavaScript con mayor contraste. Las cabeceras de apoyo también se revisaron a 320 píxeles, sin desbordamiento.

Pruebas locales: 25 Node, 25 Python, seis escenarios de composición, 12 visuales, cinco de carrusel automático y 28 de accesibilidad automatizada sin infracciones detectadas. Se inspeccionaron capturas antes/después de las cuatro páginas en claro y oscuro, además de la imagen del favicon y los tamaños de sus archivos.

La comprobación automatizada de accesibilidad no equivale a una auditoría WCAG completa. La compatibilidad Firefox/WebKit se ejecuta en el flujo de QA del repositorio junto a la nueva comprobación de identidad.

## Seguimiento

Los nuevos componentes deben usar los roles de `brand.css` y probar ambas apariencias. La versión común `identity-20261111` de CSS y script permite renovar la caché al publicar este ajuste. El favicon puede conservar una caché independiente del resto de la página según el navegador.
