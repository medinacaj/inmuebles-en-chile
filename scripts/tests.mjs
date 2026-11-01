import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractCatalog, classifyResponse, preserveConfirmedWithdrawal } from './check-listings.mjs';

const page = await fs.readFile('index.html', 'utf8');
const catalog = extractCatalog(page);

test('el catálogo se extrae con textos que contienen punto y coma', () => {
  assert.ok(catalog.length > 0);
  assert.ok(catalog.some(p => p.description.includes(';')));
});
test('los identificadores y las fuentes no se repiten', () => {
  assert.equal(new Set(catalog.map(p => p.publicationId)).size, catalog.length);
  assert.equal(new Set(catalog.map(p => p.url)).size, catalog.length);
  for (const p of catalog) {
    assert.match(p.publicationId, /^IEC-PUB-20\d\d-\d{6}$/);
    assert.match(p.url, /^https:\/\//);
    assert.ok(p.imageIsReference, 'La imagen debe identificarse como referencial');
  }
});
test('retiros explícitos y 404 no se muestran como activos', () => {
  assert.equal(classifyResponse(404).status, 'unavailable');
  assert.equal(classifyResponse(410).status, 'unavailable');
  assert.equal(classifyResponse(200, '<main>¡Lo sentimos!, esta propiedad ya no se encuentra disponible.</main>').status, 'unavailable');
});
test('contenido no concluyente o bloqueo no implican disponibilidad', () => {
  assert.equal(classifyResponse(403).status, 'unknown');
  assert.equal(classifyResponse(200, '<div>Oferta de vivienda</div>').status, 'unknown');
  assert.equal(classifyResponse(200, '<script>const msg="esta propiedad ya no se encuentra disponible"</script><main>Detalle</main>').status, 'unknown');
});
test('un retiro previo no se revierte por un bloqueo temporal', () => {
  assert.equal(preserveConfirmedWithdrawal({status:'unknown'}, {status:'unavailable'}).status, 'unavailable');
  assert.equal(preserveConfirmedWithdrawal({status:'unknown'}, {status:'unknown'}).status, 'unknown');
});
test('el JavaScript del navegador se puede analizar', () => {
  const script = page.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(script);
  assert.doesNotThrow(() => new Function(script[1]));
});
test('el sitio no publica el administrador ficticio', () => {
  assert.doesNotMatch(page, /id="admin"/);
  assert.doesNotMatch(page, /const DEMO=/);
  assert.match(page, /name="viewport"/);
  assert.match(page, /name="robots" content="noindex,nofollow"/);
});
