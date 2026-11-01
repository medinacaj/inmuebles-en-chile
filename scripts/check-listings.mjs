import fs from 'node:fs/promises';

// Las URL autorizadas para comprobación son públicas y se revisan antes de habilitarlas.
// Nunca usar esta tarea para consultar redes privadas, localhost o enlaces suministrados por visitantes.
const TRUSTED_DOMAINS = Object.freeze([
  'cfl.cl',
  'enlaceinmobiliario.cl',
  'inmobiliariapatagonia.cl'
]);
const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

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
        if (!Array.isArray(catalog)) throw new Error('El catálogo REAL no es una lista');
        return catalog;
      }
    }
  }
  throw new Error('El catálogo REAL está incompleto');
}

export function isAllowedSourceUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.port && TRUSTED_DOMAINS.some(domain => host === domain || host.endsWith('.' + domain));
  } catch { return false; }
}

export function classifyResponse(status, html = '') {
  if ([404, 410].includes(status))
    return { status: 'unavailable', reason: 'La ficha devuelve HTTP ' + status };
  if (status !== 200)
    return { status: 'unknown', reason: 'La fuente devuelve HTTP ' + status + '; requiere revisión' };
  // Excluir scripts y estilos para no interpretar como baja un texto oculto de terceros.
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
    /este inmueble ya no est[aá] disponible/i,
    /esta propiedad no se encuentra/i,
    /el enlace no arroja ninguna propiedad/i
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

export async function readHtmlResponse(response, maxBytes = MAX_HTML_BYTES) {
  const length = Number(response.headers.get('content-length') || 0);
  if (length > maxBytes) throw new Error('El documento supera el límite de tamaño');
  const type = response.headers.get('content-type') || '';
  if (type && !/text\/html|application\/xhtml\+xml/i.test(type))
    throw new Error('El origen no devolvió una página HTML');
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error('Se excedió el límite de descarga');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString('utf8');
}

export async function inspectSource(url, http = fetch) {
  if (!isAllowedSourceUrl(url))
    return { status: 'unknown', reason: 'Fuente fuera de la lista de dominios autorizados', httpStatus: null };
  let target = url;
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
    const response = await http(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(14_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CatalogStatusCheck/1.1)' }
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) return { status: 'unknown', reason: 'Redirección sin destino', httpStatus: response.status };
      const resolved = new URL(location, target).href;
      if (!isAllowedSourceUrl(resolved))
        return { status: 'unknown', reason: 'Redirección fuera de los dominios autorizados', httpStatus: response.status };
      target = resolved;
      await response.body?.cancel().catch(() => {});
      continue;
    }
    const httpStatus = response.status;
    if (httpStatus === 404 || httpStatus === 410) return { ...classifyResponse(httpStatus), httpStatus };
    if (httpStatus !== 200) return { ...classifyResponse(httpStatus), httpStatus };
    try {
      const html = await readHtmlResponse(response);
      return { ...classifyResponse(200, html), httpStatus };
    } catch {
      return { status: 'unknown', reason: 'Respuesta ilegible, demasiado grande o no HTML', httpStatus };
    }
  }
  return { status: 'unknown', reason: 'Demasiadas redirecciones', httpStatus: null };
}

async function run() {
  const html = await fs.readFile('index.html', 'utf8');
  const properties = extractCatalog(html);
  let previous = [];
  try { previous = JSON.parse(await fs.readFile('data/listing-status.json', 'utf8')).listings || []; }
  catch { previous = []; }
  const results = [];
  for (const property of properties) {
    let report;
    try { report = await inspectSource(property.url); }
    catch { report = { status: 'unknown', reason: 'Fallo de conexión o tiempo de espera', httpStatus: null }; }
    const prior = previous.find(item => item.id === property.publicationId);
    const status = preserveConfirmedWithdrawal(report, prior);
    results.push({
      id: property.publicationId,
      source: property.source,
      status: status.status,
      reason: status.reason,
      httpStatus: report.httpStatus,
      checkedAt: new Date().toISOString()
    });
  }
  await fs.mkdir('data', { recursive: true });
  const report = { schemaVersion: 1, checkedAt: new Date().toISOString(), listings: results };
  await fs.writeFile('data/listing-status.json', JSON.stringify(report, null, 2) + '\n');
  console.log(results.map(x => x.id + ': ' + x.status + ' (' + x.reason + ')').join('\n'));
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href)
  await run();
