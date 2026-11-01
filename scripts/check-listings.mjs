import fs from 'node:fs/promises';

export function extractCatalog(html) {
  const marker = 'const REAL=';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('Catálogo REAL ausente');
  const offset = start + marker.length;
  let quote = false, escaped = false, depth = 0;
  for (let i = offset; i < html.length; i++) {
    const char = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quote = false;
    } else if (char === '"') quote = true;
    else if (char === '[') depth++;
    else if (char === ']') {
      depth--;
      if (depth === 0) {
        const catalog = JSON.parse(html.slice(offset, i + 1));
        if (!Array.isArray(catalog)) throw new Error('El catálogo no es una lista');
        return catalog;
      }
    }
  }
  throw new Error('El catálogo REAL está incompleto');
}

export function classifyResponse(status, html = '') {
  if (status === 404 || status === 410)
    return { status: 'unavailable', reason: 'La ficha devuelve HTTP ' + status };
  if (status !== 200)
    return { status: 'unknown', reason: 'La fuente devuelve HTTP ' + status + '; requiere revisión' };
  const visible = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ');
  const withdrawal = [
    /esta propiedad ya no se encuentra disponible/i,
    /esta publicaci[oó]n ya no est[aá] disponible/i,
    /el aviso ya no se encuentra disponible/i,
    /este inmueble ya no est[aá] disponible/i
  ];
  if (withdrawal.some(pattern => pattern.test(visible)))
    return { status: 'unavailable', reason: 'Aviso explícito de baja en el sitio de origen' };
  return { status: 'unknown', reason: 'Ficha accesible; disponibilidad no confirmada' };
}

export function preserveConfirmedWithdrawal(current, previous) {
  if (previous?.status === 'unavailable' && current.status === 'unknown')
    return { status: 'unavailable', reason: 'Baja detectada anteriormente; requiere revisión manual para reactivar' };
  return current;
}

async function run() {
  const html = await fs.readFile('index.html', 'utf8');
  const properties = extractCatalog(html);
  let old = [];
  try { old = JSON.parse(await fs.readFile('data/listing-status.json','utf8')).listings || []; }
  catch { old = []; }
  const results = [];
  for (const property of properties) {
    let current, httpStatus = null;
    try {
      const url = new URL(property.url);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('URL no permitida');
      const response = await fetch(url, {
        signal: AbortSignal.timeout(14000),
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatalogStatusCheck/1.0)' }
      });
      httpStatus = response.status;
      const body = response.ok ? (await response.text()).slice(0, 1250000) : '';
      current = classifyResponse(response.status, body);
    } catch {
      current = { status: 'unknown', reason: 'Conexión fallida o acceso bloqueado; revisión pendiente' };
    }
    const previous = old.find(item => item.id === property.publicationId);
    const outcome = preserveConfirmedWithdrawal(current, previous);
    results.push({
      id: property.publicationId,
      source: property.source,
      status: outcome.status,
      reason: outcome.reason,
      httpStatus,
      checkedAt: new Date().toISOString()
    });
  }
  await fs.mkdir('data', { recursive: true });
  const status = { schemaVersion: 1, checkedAt: new Date().toISOString(), listings: results };
  await fs.writeFile('data/listing-status.json', JSON.stringify(status, null, 2) + '\n');
  console.log(results.map(item => item.id + ': ' + item.status + ' (' + item.reason + ')').join('\n'));
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href)
  await run();
