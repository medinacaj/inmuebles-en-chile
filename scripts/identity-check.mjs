import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Detecta cambios de tema al navegar y superficies incoherentes entre secciones.
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const blockRemote=context=>context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
const failures=[],report=[];
const palettes={light:{bg:'rgb(255, 249, 245)',ink:'rgb(38, 35, 34)'},dark:{bg:'rgb(33, 28, 28)',ink:'rgb(255, 243, 237)'}};
try{
 for(const width of [375,1440])for(const mode of [
  {system:'light',saved:'dark',want:'dark'},
  {system:'dark',saved:'light',want:'light'},
  {system:'dark',saved:null,want:'dark'},
  {system:'light',saved:null,want:'light'},
 ]){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:mode.system});
  await context.addInitScript(saved=>{if(saved)localStorage.setItem('iech_theme',saved);else localStorage.removeItem('iech_theme')},mode.saved);
  // El resultado no depende de noticias ni imágenes externas cambiantes.
  await blockRemote(context);
  const page=await context.newPage();
  for(const path of ['','guia.html','herramientas.html','informacion.html']){
   const label=`${width}/${mode.system}/${mode.saved||'auto'}/${path||'inicio'}`;
   await page.goto(new URL(path,base).href,{waitUntil:'networkidle'});
   const result=await page.evaluate(()=>{
    const style=el=>{const s=getComputedStyle(el);return {bg:s.backgroundColor,ink:s.color}};
    const body=style(document.body),surfaces=[...document.querySelectorAll('.home-actualidad,.market-home,.decision-guide,.panel,.card,footer')].map(style);
    const icons=[...document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]')].map(el=>({href:el.href,type:el.type}));
    return {body,surfaces,icons,overflow:document.documentElement.scrollWidth-innerWidth};
   });
   try{
    assert.deepEqual(result.body,palettes[mode.want],'Respetar apariencia al navegar entre páginas');
    assert.ok(result.surfaces.every(s=>s.bg===result.surfaces[0].bg),'Paneles y pie deben compartir superficie');
    assert.ok(result.overflow<=1,'No desbordar la pantalla');
    assert.ok(result.icons.length>=3,'Favicon SVG, ICO y Apple declarados');
    for(const icon of result.icons){
     assert.ok(icon.href.startsWith(new URL('assets/icons/',base).href),'Icono dentro del subdirectorio del portal');
     const response=await context.request.get(icon.href);
     assert.equal(response.status(),200,'Icono disponible');
     assert.doesNotMatch(response.headers()['content-type']||'',/text\/html/,'El icono no debe devolver una página HTML');
    }
    report.push({label,status:'ok'});
   }catch(error){failures.push({label,error:error.message});}
  }
  await context.close();
 }
 // Un cambio de apariencia se conserva al navegar y se propaga a otra pestaña.
 {
  const context=await browser.newContext({colorScheme:'light'});
  await blockRemote(context);
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'networkidle'});
  await page.emulateMedia({colorScheme:'dark'});
  await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(33, 28, 28)');
  await page.emulateMedia({colorScheme:'light'});
  await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 249, 245)');
  await page.locator('#theme').click();
  const other=await context.newPage();
  await other.goto(new URL('guia.html',base).href,{waitUntil:'networkidle'});
  assert.equal(await other.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),palettes.dark.bg);
  await other.locator('#theme').click();
  await page.waitForFunction(()=>getComputedStyle(document.body).backgroundColor==='rgb(255, 249, 245)');
  report.push({label:'sistema, navegación, cambio y sincronización entre pestañas',status:'ok'});
  await context.close();
 }
 // Privacidad estricta: sin localStorage, aún funcionan el sistema y el botón.
 {
  const context=await browser.newContext({colorScheme:'dark'});
  await blockRemote(context);
  await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('herramientas.html',base).href,{waitUntil:'networkidle'});
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),palettes.dark.bg);
  await page.locator('#theme').click();
  assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),palettes.light.bg);
  assert.deepEqual(errors,[],'Sin errores cuando el almacenamiento está bloqueado');
  report.push({label:'almacenamiento bloqueado',status:'ok'});
  await context.close();
 }
 {
  const context=await browser.newContext({javaScriptEnabled:false,colorScheme:'dark'});
  const page=await context.newPage();
  await page.emulateMedia({contrast:'more'});
  await page.goto(new URL('informacion.html',base).href,{waitUntil:'networkidle'});
  const contrast=await page.evaluate(()=>{
   const luminance=color=>{
    const rgb=color.match(/\d+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
   };
   const fg=luminance(getComputedStyle(document.querySelector('.sub')).color),bg=luminance(getComputedStyle(document.body).backgroundColor);
   return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
  });
  assert.ok(contrast>=4.5,'La información estática debe ser legible también sin JavaScript y con contraste aumentado');
  report.push({label:'oscuro sin JavaScript y con contraste aumentado',status:'ok'});
  await context.close();
 }
 // El favorito conserva una superficie clara también en modo oscuro.
 {
  const context=await browser.newContext({colorScheme:'dark'});
  await blockRemote(context);
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'networkidle'});
  const favorite=page.locator('#featured .card-fav').first();
  const contrast=()=>favorite.evaluate(el=>{
   const luminance=color=>{
    const rgb=color.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
   };
   const style=getComputedStyle(el),a=luminance(style.color),b=luminance(style.backgroundColor);
   return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
  await favorite.hover();
  assert.ok(await contrast()>=3,'Favorito sin guardar: corazón legible con hover en oscuro');
  await page.mouse.move(0,0);
  await page.keyboard.press('Tab');
  await favorite.focus();
  assert.ok(await favorite.evaluate(el=>el.matches(':focus-visible')),'Probar el foco de teclado real');
  assert.ok(await contrast()>=3,'Favorito sin guardar: corazón legible con foco en oscuro');
  await favorite.click();
  assert.ok(await contrast()>=3,'Favorito guardado: conservar contraste en oscuro');
  report.push({label:'contraste de favoritos oscuros con puntero y teclado',status:'ok'});
  await context.close();
 }
 console.log(JSON.stringify({report,failures},null,2));
 assert.deepEqual(failures,[],'Identidad coherente en todas las páginas y preferencias');
}finally{await browser.close();}
