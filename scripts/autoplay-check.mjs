import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const results=[];
async function check(name,options,fn){const context=await browser.newContext({viewport:{width:375,height:812},...options});try{const p=await context.newPage();await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await p.locator('#homeNews').scrollIntoViewIfNeeded();await fn(p);results.push({name,status:'ok'})}catch(e){results.push({name,status:'failed',reason:e.message});}finally{await context.close()}}
async function advance(p){
 await p.clock.fastForward(5100);
 await p.clock.runFor(100);
 // Chromium anima scroll en el compositor real, separado del reloj JavaScript.
 await new Promise(resolve=>setTimeout(resolve,800));
}
try{
 await check('avance automático cada cinco segundos y vuelta al inicio',{},async p=>{
  await advance(p);
  assert.ok(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)>20);
  await p.locator('#homeNews').evaluate(e=>e.scrollTo({left:e.scrollWidth,behavior:'instant'}));
  await advance(p);
  const deadline=Date.now()+3000;
  while(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)>=3&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
  assert.ok(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)<3);
 });
 await check('pausa explícita y reanudación',{},async p=>{
  await p.locator('#homeNewsAutoplay').click({timeout:3000});
  await p.locator('#homeNewsAutoplay').evaluate(e=>e.blur());
  await p.mouse.move(0,0);
  const left=await p.locator('#homeNews').evaluate(e=>e.scrollLeft);
  await advance(p);
  assert.equal(await p.locator('#homeNews').evaluate(e=>e.scrollLeft),left);
  await p.locator('#homeNewsAutoplay').click();
  await advance(p);
  assert.ok(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)>left);
 });
 await check('foco de teclado detiene la rotación',{},async p=>{
  await p.locator('#homeNews a').first().focus();
  const left=await p.locator('#homeNews').evaluate(e=>e.scrollLeft);
  await advance(p);
  assert.equal(await p.locator('#homeNews').evaluate(e=>e.scrollLeft),left);
 });
 await check('movimiento reducido requiere inicio voluntario',{reducedMotion:'reduce'},async p=>{
  await advance(p);
  const deadline=Date.now()+3000;
  while(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)>=3&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
  assert.ok(await p.locator('#homeNews').evaluate(e=>e.scrollLeft)<3);
  assert.match(await p.locator('#homeNewsAutoplay').innerText(),/Reproducir/);
 });
 await check('puntero encima pausa la rotación',{},async p=>{
  await p.locator('#homeNews').hover();
  const left=await p.locator('#homeNews').evaluate(e=>e.scrollLeft);
  await advance(p);
  assert.equal(await p.locator('#homeNews').evaluate(e=>e.scrollLeft),left);
 });
 console.log(JSON.stringify(results,null,2));if(results.some(r=>r.status==='failed'))process.exitCode=1;
}finally{await browser.close()}
