# Inmuebles en Chile: reglas permanentes

- Producto autónomo de AJ-Med!n@ / `medinacaj`. Repositorio oficial: https://github.com/medinacaj/inmuebles-en-chile. Rama principal: `main`. Verificar remoto y cambios antes de publicar; no aplicar reglas de otros productos.
- Leer primero `docs/MEMORIA_OPERATIVA.md` y `docs/DECISIONES.md`, luego este archivo, README y documentación específica. Contrastar fechas, SHA, PR y estado remoto. No reiniciar ni reconstruir funciones existentes.
- [CONFIRMADO] Portal informativo estático: HTML, CSS, JavaScript y JSON públicos; GitHub Pages y Actions. No hay backend, cuentas, base de datos, reservas, pagos ni administración real. `package.json` contiene dependencias de QA, no un servidor de aplicación.
- [NO MODIFICAR sin decisión expresa posterior] No convertir HTTP 200 en disponibilidad; mantener `unknown` cuando corresponda, las bajas confirmadas y las diferencias entre fecha editorial e intento HTTP. No cambiar precios, licencias ni fechas de consulta sin evidencia.
- [NO MODIFICAR sin decisión expresa posterior] Mantener `noindex,nofollow`, imágenes referenciales/IA rotuladas e IDs IEC-PUB internos sin certificación. No reintroducir DEMO ni administración por localStorage.
- Respetar la identidad coral cercana, Manrope local, tokens de `assets/css/brand.css` y apariencia compartida en `assets/js/theme.js`. No restaurar la portada editorial anterior por usar capturas históricas.
- Conservar el trabajo local/remoto. Usar ramas de continuidad, commits revisables y push normal; nunca force push, resets destructivos, semillas o migraciones de datos reales. Respaldar antes de resolver conflictos; no descartar ramas incompletas.
- No desplegar, fusionar a main ni cambiar infraestructura como parte de un respaldo sin autorización específica. Un push a main puede afectar Pages; una rama remota no equivale a integración.
- No enviar mensajes a inmobiliarias ni solicitar permisos a terceros sin autorización. No publicar secretos, documentos privados, datos personales, contratos ni capturas de sesiones autenticadas. `data/` de ESTE producto contiene metadatos públicos: revisarlos antes de publicar, sin importar reglas de otros productos.
- Ejecutar las pruebas pertinentes de README. No alterar el catálogo ni revivir bajas para satisfacer conteos de pruebas. Separar escenarios simulados de datos públicos reales.
- Diferenciar implementado, probado localmente, respaldado en GitHub, fusionado, staging y producción verificados. CI verde no certifica disponibilidad, WCAG integral ni Core Web Vitals de campo.
- Registrar comandos/resultados/limitaciones y decisiones en la memoria. Usar SHA base o de código en documentos; el SHA del commit que los contiene va en el informe posterior a su publicación.
