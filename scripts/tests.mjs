import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractCatalog, classifyResponse, preserveConfirmedWithdrawal, isAllowedSourceUrl, inspectSource, readHtmlResponse } from './check-listings.mjs';
import { buildReviewSummary } from './audit-status.mjs';

const page = await fs.readFile('index.html', 'utf8');
const catalog = extractCatalog(page);

test('el catálogo se extrae con textos que contienen punto y coma', () => {
  assert.ok(catalog.length >= 10);
  assert.ok(catalog.some(p => p.description.includes(';')));
});
test('los identificadores y las fuentes no se repiten', () => {
  assert.equal(new Set(catalog.map(p => p.publicationId)).size, catalog.length);
  assert.equal(new Set(catalog.map(p => p.url)).size, catalog.length);
  for (const p of catalog) {
    assert.match(p.publicationId, /^IEC-PUB-20\d\d-\d{6}$/);
    assert.match(p.url, /^https:\/\//);
    if (p.image) assert.equal(p.imageIsReference,true,'Las imágenes existentes deben estar rotuladas como referenciales');
    assert.ok(Number.isFinite(p.price)&&p.price>0,'Precio referencial positivo');
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

test('el catálogo y las acciones esenciales funcionan en un DOM simulado', () => {
  function makeElement(id) {
    return {
      id, value: ({ufprice:2498,ufvalue:39000,down:20,rate:4.07,years:25}[id] ?? ''),
      innerHTML:'', textContent:'', dataset:{}, isConnected:true,
      classList:{add(){},remove(){},toggle(){},contains(){return false}},
      focus(){}, scrollIntoView(){}, setAttribute(){}, removeAttribute(){}, addEventListener(){},
      getClientRects(){return [1]},querySelector(){return {focus(){}}},
      querySelectorAll(){return []}
    };
  }
  const elements = new Map();
  const getElementById = id => {
    if (!elements.has(id)) elements.set(id,makeElement(id));
    return elements.get(id);
  };
  const nav = ['inicio','propiedades','noticias'].map(page => ({...makeElement(page),dataset:{page}}));
  const document = {
    getElementById, activeElement:makeElement('previous'),
    body:makeElement('body'),
    querySelectorAll(selector){return selector==='.navbtn'?nav:[]},
    addEventListener(){}
  };
  const localStorage = {getItem(){return null},setItem(){}};
  const script = page.match(/<script>([\s\S]*?)<\/script>/)[1];
  const app = new Function('document','localStorage','window','fetch','alert',script+
    ';return {toggleFavorite,toggleCompare,showSaved,showCompare,closeModal,applyListingReport};')(
      document,localStorage,{scrollTo(){},addEventListener(){},requestAnimationFrame(fn){fn()},matchMedia(){return {matches:true}}},async()=>({ok:false}),()=>{});
  assert.equal(getElementById('count').textContent, '0 referencias','No mostrar referencias antes de validar estados');
  app.applyListingReport({schemaVersion:1,checkedAt:new Date().toISOString(),listings:catalog.map(p=>({id:p.publicationId,status:'unknown',httpStatus:200,checkedAt:new Date().toISOString()}))});
  assert.equal(getElementById('count').textContent, catalog.length+' referencias');
  assert.equal((getElementById('propertyGrid').innerHTML.match(/class="card property-card"/g)||[]).length,catalog.length);
  app.toggleFavorite(catalog[0].id);
  assert.equal(getElementById('favCount').textContent,1);
  app.toggleCompare(catalog[0].id);
  assert.equal(getElementById('compareCount').textContent,1);
  app.showSaved();
  assert.match(getElementById('modalContent').innerHTML,/Propiedades guardadas/);
  app.closeModal();
  app.showCompare();
  assert.match(getElementById('modalContent').innerHTML,/UF\/m²/);
});

test('contraste mínimo de tokens tipográficos prioritarios', () => {
 function luminance(hex) {
   const color=hex.replace('#','');
   const rgb=(color.length===3?color.split('').map(x=>x+x):color.match(/../g)).map(x=>parseInt(x,16)/255);
   const linear=rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
   return .2126*linear[0]+.7152*linear[1]+.0722*linear[2];
 }
 function contrast(fg,bg) {
   const a=luminance(fg),b=luminance(bg);
   return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
 }
 const targets=[
   ['#626e74','#f7f6f3'],['#626e74','#ffffff'],
   ['#88652d','#f0eee8'],['#d6af6d','#263236'],
   ['#b0babd','#101719']
 ];
 for (const [foreground,background] of targets)
   assert.ok(contrast(foreground,background)>=4.5,
      'Contraste insuficiente '+foreground+' sobre '+background);
});

test('hay nuevas regiones con fichas directas y atributos no inventados',()=>{
 const regions=new Set(catalog.map(p=>p.region));
 for(const region of ["Biobío","Valparaíso","Metropolitana","O'Higgins","Los Lagos"])assert.ok(regions.has(region),region);
 assert.ok(catalog.some(p=>p.city==="Rancagua"&&p.source==="CFL Inmobiliaria"));
 assert.ok(catalog.some(p=>p.city==="Ancud"&&p.source==="Inmobiliaria Patagonia"));
 for(const p of catalog.filter(x=>x.source==="CFL Inmobiliaria")){
   assert.equal(p.area,null,'No asignar superficies ficticias a proyectos');
   assert.match(p.image,/^assets\/illustrations\/[a-z-]+\.svg$/,'Usar ilustraciones originales locales');
   assert.equal(p.imageKind,'editorial_illustration');
   assert.equal(p.imageIsReference,true,'No presentar ilustraciones como fotos reales');
 }
});

test('todas las imágenes del catálogo tienen un recurso local',async()=>{
 for(const p of catalog){
   assert.ok(p.image,'No dejar fichas sin imagen');
   const image=await fs.readFile(p.image);
   assert.ok(image.byteLength>500,'Imagen vacía o no encontrada: '+p.image);
   if(p.image.endsWith('.svg')){
     const content=image.toString('utf8');
     assert.match(content,/<svg\b/);
     assert.match(content,/<\/svg>/);
     assert.match(content,/Ilustraci[oó]n editorial referencial/);
   }
 }
});
test('las acciones compactas son accesibles',()=>{
 assert.match(page,/class="card-fav/);
 assert.match(page,/card-options/);
 assert.match(page,/aria-pressed/);
 assert.match(page,/function openCardActions\(/);
});

test('fotografías oficiales requieren derechos de reutilización documentados', () => {
 for (const p of catalog) {
  if (['official_render','property_photo'].includes(p.imageKind)) {
   assert.ok(p.mediaRights && typeof p.mediaRights==='object',p.publicationId+': faltan permisos de imagen');
   for(const key of ['evidenceId','rightsHolder','grantedOn','scope','approvedBy']) {
    assert.ok(typeof p.mediaRights[key]==='string' && p.mediaRights[key].trim(),p.publicationId+': falta '+key);
   }
   assert.ok(p.image && p.image.startsWith('assets/'),p.publicationId+': archivo local controlado obligatorio');
  } else if(p.imageKind==='editorial_illustration') {
   assert.match(p.image,/^assets\/illustrations\/[\w-]+\.svg$/);
   assert.equal(p.imageIsReference,true);
  } else {
   assert.equal(p.imageIsReference,true,p.publicationId+': no confundir foto de referencia con inmueble');
   assert.ok(p.imageCredit,p.publicationId+': falta atribución/origen de la fotografía de referencia');
  }
 }
});


test('el verificador solo permite dominios aprobados con HTTPS', () => {
 for (const url of [
   'https://www.cfl.cl/proyecto/',
   'https://enlaceinmobiliario.cl/venta',
   'https://inmobiliariapatagonia.cl/propiedad'
 ]) assert.equal(isAllowedSourceUrl(url), true, url);
 for (const url of [
   'http://www.cfl.cl/proyecto',
   'https://cfl.cl.ejemplo.net/malicioso',
   'https://127.0.0.1/admin',
   'https://localhost/',
   'https://cfl.cl@127.0.0.1/privado',
   'https://cfl.cl:8443/',
   'file:///etc/passwd',
   'not-a-url'
 ]) assert.equal(isAllowedSourceUrl(url), false, url);
});

test('rechazar redirecciones a dominios no permitidos sin consultarlos', async () => {
 let calls = 0;
 const result = await inspectSource('https://www.cfl.cl/test', async () => {
   calls++;
   return new Response('', {status:302, headers:{location:'https://127.0.0.1/private'}});
 });
 assert.equal(calls, 1);
 assert.equal(result.status, 'unknown');
 assert.match(result.reason, /Redirección fuera/);
});

test('un 404 explícito marca la ficha retirada, pero 403 no confirma nada', async () => {
 const gone = await inspectSource('https://www.cfl.cl/test', async () => new Response('', {status:404}));
 assert.equal(gone.status, 'unavailable');
 const blocked = await inspectSource('https://www.cfl.cl/test', async () => new Response('', {status:403}));
 assert.equal(blocked.status, 'unknown');
 const ok = await inspectSource('https://www.cfl.cl/test', async () => new Response('<html>Proyecto</html>', {status:200, headers:{'content-type':'text/html; charset=utf-8'}}));
 assert.equal(ok.status, 'unknown');
});

test('redirecciones permitidas solo hacia dominios aprobados', async () => {
 const calls = [];
 const result = await inspectSource('https://cfl.cl/inicio', async url => {
   calls.push(url);
   return calls.length===1 ?
     new Response('', {status:301, headers:{location:'/proyecto'}}) :
     new Response('<main>Esta propiedad ya no se encuentra disponible</main>', {status:200, headers:{'content-type':'text/html'}});
 });
 assert.equal(calls[1], 'https://cfl.cl/proyecto');
 assert.equal(result.status, 'unavailable');
});

test('descargas grandes o no HTML no provocan carga ilimitada', async () => {
 const html = await readHtmlResponse(new Response('<html>válido</html>', {headers:{'content-type':'text/html'}}),100);
 assert.match(html, /válido/);
 await assert.rejects(() => readHtmlResponse(new Response('archivo binario',{headers:{'content-type':'image/png'}})),/HTML/);
 await assert.rejects(() => readHtmlResponse(new Response('x'.repeat(200),{headers:{'content-type':'text/html'}}),100),/límite/);
});


test('el informe operativo identifica bloqueos, bajas, ausencias y caducidad', () => {
 const start = Date.parse('2026-11-01T12:00:00Z');
 const report = {
   checkedAt: '2026-11-01T12:00:00Z',
   listings: [
     {id:catalog[0].publicationId,status:'unknown',httpStatus:200,reason:'Accesible'},
     {id:catalog[1].publicationId,status:'unknown',httpStatus:403,reason:'Bloqueado'},
     {id:catalog[2].publicationId,status:'unavailable',httpStatus:404,reason:'Retirado'}
   ]
 };
 const {counts,stale,markdown} = buildReviewSummary(catalog,report,start);
 assert.equal(counts.accessible,1);
 assert.equal(counts.restricted,1);
 assert.equal(counts.gone,1);
 assert.equal(counts.missing,catalog.length-3);
 assert.equal(stale,false);
 assert.match(markdown,/NO disponibilidad confirmada/);
 assert.equal(buildReviewSummary(catalog,report,start+9*86400000).stale,true);
 const duplicado={...report,listings:[...report.listings,report.listings[0]]};
 assert.throws(()=>buildReviewSummary(catalog,duplicado),/duplicado/);
});
test('el formulario de incidencia no solicita datos sensibles de usuarios', async () => {
 const template=await fs.readFile('.github/ISSUE_TEMPLATE/reporte-referencia.yml','utf8');
 assert.match(template,/No incluyas RUT/);
 assert.match(template,/Identificador de la publicación/);
 assert.doesNotMatch(template,/required: true[\s\S]*RUT|teléfono obligatorio/i);
});


test('la propuesta de publicación es gratuita y requiere revisión editorial', async () => {
 const template = await fs.readFile('.github/ISSUE_TEMPLATE/proponer-proyecto.yml','utf8');
 const toolsPage = await fs.readFile('herramientas.html','utf8');
 assert.match(template,/no publica automáticamente/i);
 assert.match(template,/No compartas RUT/);
 assert.match(template,/Enlace oficial de la publicación/);
 assert.match(toolsPage,/proponer-proyecto\.yml/);
 assert.match(toolsPage,/revis[aó] manualmente/i);
});

test('el nuevo lenguaje visual dispone de hoja y portada con imagen ambientacional',async()=>{const css=await fs.readFile('assets/css/experience.css','utf8');assert.match(page,/class="hero-photo"/);assert.match(page,/class="hero-panels"/);assert.match(page,/id="menuToggle"/);assert.match(page,/assets\/css\/experience\.css/);assert.match(css,/@media\(max-width:680px\)/);assert.match(css, /prefers-reduced-motion/);assert.match(page,/fotograf[ií]a de ambientaci[oó]n/i)});

test('páginas de apoyo siguen el sistema visual y mantienen sus funcionalidades',async()=>{for(const path of ['guia.html','herramientas.html','informacion.html']){const body=await fs.readFile(path,'utf8');assert.match(body,/class="subpage"/);assert.match(body,/assets\/css\/subpages\.css/)}const style=await fs.readFile('assets/css/subpages.css','utf8');assert.match(style,/prefers-color-scheme:dark/)});


test('Inicio prioriza inmuebles después de un carrusel RSS con imágenes ilustrativas', async()=>{
 const css=await fs.readFile('assets/css/experience.css','utf8');
 assert.ok(page.indexOf('id="homeNews"')<page.indexOf('id="featured"'));
 assert.ok(page.indexOf('id="featured"')<page.indexOf('id="regionQuick"'));
 assert.match(page,/id="homeNewsPrev"/);
 assert.match(page,/id="homeNewsNext"/);
 assert.match(page,/NEWS\.slice\(0,10\)\.map\(homeNewsCard\)/);
 assert.match(page,/news-image-note/);
 assert.match(css,/scroll-snap-type:x mandatory/);
 assert.match(css,/height:clamp\(510px,67svh,600px\)/);
 for(const name of ['mercado','vivienda','financiamiento','normativa']){
  const art=await fs.readFile('assets/illustrations/news-'+name+'.svg','utf8');
  assert.match(art,/<svg/);
 }
});


test('las variantes responsivas existen y pesan menos que las fotos originales',async()=>{
 for(const p of catalog.filter(p=>p.imageSrcset)){
  const sources=p.imageSrcset.split(',').map(value=>value.trim().split(/\s+/));
  assert.deepEqual(sources.map(x=>x[1]),['480w','960w']);
  for(const [path] of sources){
   const optimized=await fs.stat(path);
   const original=await fs.stat(path.replace(/-(480|960)\.webp$/,'.jpg'));
   assert.ok(optimized.size>0&&optimized.size<original.size,path);
  }
 }
});
