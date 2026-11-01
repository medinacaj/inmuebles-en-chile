import fs from 'node:fs/promises';
import { extractCatalog } from './check-listings.mjs';

export function buildReviewSummary(catalog, report, now = Date.now()) {
  if (!Array.isArray(catalog) || !Array.isArray(report?.listings))
    throw new Error('El catálogo o el resultado de revisión no tiene un formato válido');
  const ids = new Set(catalog.map(item => item.publicationId));
  const entries = new Map();
  for (const item of report.listings) {
    if (!ids.has(item.id)) throw new Error('ID ajeno al catálogo: ' + item.id);
    if (entries.has(item.id)) throw new Error('ID duplicado en revisión: ' + item.id);
    if (!['unknown', 'unavailable'].includes(item.status))
      throw new Error('Estado desconocido para ' + item.id);
    entries.set(item.id, item);
  }
  const missing = catalog.filter(item => !entries.has(item.publicationId));
  const gone = report.listings.filter(item => item.status === 'unavailable');
  const accessible = report.listings.filter(item => item.status === 'unknown' && item.httpStatus === 200);
  const restricted = report.listings.filter(item => item.status === 'unknown' && item.httpStatus === 403);
  const inconclusive = report.listings.filter(item => item.status === 'unknown' && ![200, 403].includes(item.httpStatus));
  const checkedAt = Date.parse(report.checkedAt);
  const stale = !Number.isFinite(checkedAt) || checkedAt > now + 86400000 || now - checkedAt > 7 * 86400000;
  const lines = [
    '## Control de fuentes inmobiliarias',
    '',
    '| Indicador | Total |',
    '| --- | ---: |',
    '| Referencias del catálogo | ' + catalog.length + ' |',
    '| Páginas accesibles (NO disponibilidad confirmada) | ' + accessible.length + ' |',
    '| Bloqueos HTTP 403 | ' + restricted.length + ' |',
    '| Sin respuesta concluyente | ' + inconclusive.length + ' |',
    '| Bajas detectadas | ' + gone.length + ' |',
    '| Sin comprobación registrada | ' + missing.length + ' |',
    '',
    '**Última comprobación:** ' + (report.checkedAt || 'desconocida') +
       (stale ? ' — **DESACTUALIZADA**' : ''),
    '',
    '### Requieren revisión manual',
    '',
    ...[...restricted, ...inconclusive, ...gone, ...missing.map(x => ({ id: x.publicationId, reason: 'Sin comprobación' }))].map(
      x => '- ' + x.id + ': ' + String(x.reason || 'Revisar fuente').replace(/[|<>]/g, '')
    ),
    '',
    '> Accesibilidad HTTP 200 no equivale a disponibilidad de unidades. No se han verificado títulos de dominio.',
    ''
  ];
  return { markdown: lines.join('\n'), counts: { total: catalog.length, accessible: accessible.length, restricted: restricted.length, inconclusive: inconclusive.length, gone: gone.length, missing: missing.length }, stale };
}

if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const catalog = extractCatalog(await fs.readFile('index.html', 'utf8'));
  const report = JSON.parse(await fs.readFile('data/listing-status.json', 'utf8'));
  const summary = buildReviewSummary(catalog, report);
  console.log(summary.markdown);
  if (process.env.GITHUB_STEP_SUMMARY)
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary.markdown);
}
