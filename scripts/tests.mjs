import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractCatalog, classifyResponse, preserveConfirmedWithdrawal, isAllowedSourceUrl, inspectSource, readHtmlResponse } from './check-listings.mjs';

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
      focus(){}, scrollIntoView(){}, setAttribute(){}, removeAttribute(){},
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
    ';return {toggleFavorite,toggleCompare,showSaved,showCompare,closeModal};')(
      document,localStorage,{scrollTo(){}},async()=>({ok:false}),()=>{});
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
