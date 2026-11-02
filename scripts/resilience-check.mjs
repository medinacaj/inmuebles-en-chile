import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const results=[];
async function check(name,fn){const context=await browser.newContext();try{await fn(await context.newPage(),context);results.push({name,status:'ok'})}catch(e){results.push({name,status:'failed',reason:e.message});}finally{await context.close()}}
try{
 await check('primera carga fallida no publica referencias',async p=>{
  await p.route('**/data/listing-status.json',r=>r.fulfill({status:503,body:'fallo'}));
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(await p.locator('#propertyGrid .property-card').count(),0);
  assert.equal(await p.locator('#featured .property-card').count(),0);
  assert.match(await p.locator('#catalogNotice').innerText(),/no se pudo|sin comprobación/i);
 });
 await check('carga lenta no expone fichas pendientes',async p=>{
  let release;const gate=new Promise(r=>release=r);
  await p.route('**/data/listing-status.json',async r=>{await gate;await r.continue()});
  await p.goto(base,{waitUntil:'domcontentloaded'});
  try{assert.equal(await p.locator('#propertyGrid .property-card').count(),0)}finally{release()}
 });
 await check('registro inválido o incompleto no habilita catálogo',async p=>{
  for(const report of [{listings:[]},{schemaVersion:1,checkedAt:'2099-01-01',listings:[]},'invalid json']){
   await p.route('**/data/listing-status.json',r=>r.fulfill({contentType:'application/json',body:typeof report==='string'?report:JSON.stringify(report)}));
   await p.goto(base,{waitUntil:'networkidle'});
   assert.equal(await p.locator('#propertyGrid .property-card').count(),0);
   await p.unroute('**/data/listing-status.json');
  }
 });
 await check('una baja validada no reaparece con fallo posterior',async p=>{
  await p.route('**/data/listing-status.json',async r=>{
   const response=await r.fetch();const report=await response.json();
   report.listings[0].status='unavailable';report.listings[0].httpStatus=404;
   await r.fulfill({json:report});
  });
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(await p.locator('#propertyGrid [data-property-id="1001"]').count(),0);
  await p.unroute('**/data/listing-status.json');
  await p.route('**/data/listing-status.json',r=>r.fulfill({status:503,body:'fallo'}));
  await p.reload({waitUntil:'networkidle'});
  assert.equal(await p.locator('#propertyGrid [data-property-id="1001"]').count(),0);
  assert.equal(await p.locator('#propertyGrid .property-card').count(),9);
  assert.match(await p.locator('#catalogNotice').innerText(),/copia|guardad|respaldo/i);
 });
 await check('caché corrupta no habilita fichas',async(p,c)=>{
  await c.addInitScript(()=>localStorage.setItem('iech_listing_status','{"listings":[]}'));
  await p.route('**/data/listing-status.json',r=>r.fulfill({status:503,body:'fallo'}));
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(await p.locator('#propertyGrid .property-card').count(),0);
 });
 await check('región inicia exploración limpia y mueve foco',async p=>{
  await p.goto(base,{waitUntil:'networkidle'});
  await p.evaluate(()=>{document.getElementById('search').value='Concepción';document.getElementById('budget').value='3000';browseRegion('Los Lagos')});
  assert.equal(await p.locator('#search').inputValue(),'');
  assert.equal(await p.locator('#budget').inputValue(),'');
  assert.equal(await p.locator('#propertyGrid .property-card').count(),1);
  assert.equal(await p.evaluate(()=>document.activeElement===document.querySelector('#propiedades h1')),true);
 });
 await check('secciones conservan URL, historial y foco',async p=>{
  await p.goto(base,{waitUntil:'networkidle'});
  await p.getByRole('button',{name:'Propiedades',exact:true}).click();
  assert.equal(new URL(p.url()).hash,'#propiedades');
  await p.getByRole('button',{name:'Actualidad',exact:true}).click();
  assert.equal(new URL(p.url()).hash,'#noticias');
  await p.goBack();
  assert.equal(await p.locator('#propiedades').isVisible(),true);
  assert.equal(await p.evaluate(()=>document.activeElement===document.querySelector('#propiedades h1')),true);
  await p.reload({waitUntil:'networkidle'});
  assert.equal(await p.locator('#propiedades').isVisible(),true);
 });
 await check('favoritos sobreviven a la carga inicial de estados',async(p,c)=>{
  await c.addInitScript(()=>localStorage.setItem('iech_favorites','[1001]'));
  await p.goto(base,{waitUntil:'networkidle'});
  assert.equal(await p.locator('#favCount').innerText(),'1');
 });
 await check('fotografías usan variantes WebP responsivas',async p=>{
  await p.setViewportSize({width:375,height:812});
  await p.goto(base,{waitUntil:'networkidle'});
  const image=p.locator('#featured [data-property-id="1001"] img');
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(img=>img.decode());
  assert.match(await image.evaluate(img=>img.currentSrc),/-480\.webp$/);
  assert.ok((await image.getAttribute('srcset')).includes('960w'));
 });
 await check('respuesta antigua no reactiva una baja guardada más reciente',async p=>{
  let original;
  await p.route('**/data/listing-status.json',async r=>{
   const response=await r.fetch();original=await response.json();
   const report=structuredClone(original);report.checkedAt=new Date().toISOString();
   report.listings[0].status='unavailable';report.listings[0].httpStatus=404;
   await r.fulfill({json:report});
  });
  await p.goto(base,{waitUntil:'networkidle'});
  await p.unroute('**/data/listing-status.json');
  await p.route('**/data/listing-status.json',r=>r.fulfill({json:original}));
  await p.reload({waitUntil:'networkidle'});
  assert.equal(await p.locator('#propertyGrid [data-property-id="1001"]').count(),0);
 });
 await check('fondo de portada cubre toda su altura en móvil',async p=>{
  await p.setViewportSize({width:375,height:812});
  await p.goto(base,{waitUntil:'networkidle'});
  const heights=await p.evaluate(()=>({hero:document.querySelector('#inicio .hero').getBoundingClientRect().height,art:document.querySelector('#inicio .heroart').getBoundingClientRect().height}));
  assert.ok(Math.abs(heights.hero-heights.art)<=1,JSON.stringify(heights));
 });
 console.log(JSON.stringify(results,null,2));
 if(results.some(x=>x.status==='failed'))process.exitCode=1;
}finally{await browser.close()}
