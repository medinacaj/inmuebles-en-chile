import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true});
const sizes = [
  [320,700],[375,812],[430,932],[768,1024],[1024,768],[1440,900]
];
const report = [];
try {
 for (const [width,height] of sizes) {
  for (const theme of ['light','dark']) {
   const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page = await context.newPage();
   const failures = [];
   page.on('pageerror',error=>failures.push(error.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   if (theme==='dark') await page.locator('#theme').click();
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('dark')),theme==='dark');
   await page.getByRole('button',{name:'Propiedades',exact:true}).click();
   assert.ok(await page.getByRole('heading',{name:'Explora el mercado inmobiliario.'}).count());
   assert.ok((await page.locator('#propertyGrid .property-card').count())>=8,'El catálogo debe mostrar al menos 8 referencias no retiradas');
   await page.locator('#sourceSummary > span').first().waitFor({state:'visible'});
   assert.match(await page.locator('#sourceSummary').innerText(),/referencias en cat[aá]logo/);
   assert.match(await page.locator('#sourceSummary').innerText(),/Consultable no significa disponible/);
   const visibleImage=page.locator('#propertyGrid .photo-link.has-photo img').first();
   await visibleImage.scrollIntoViewIfNeeded();
   assert.equal(await visibleImage.evaluate(img=>img.decode().then(()=>img.naturalWidth>0).catch(()=>false)),true,'Debe cargar la imagen de la ficha');
   await page.locator('#propertyGrid .card-fav').first().click();
   assert.equal(await page.locator('#propertyGrid .card-fav').first().getAttribute('aria-pressed'),'true');
   assert.equal(await page.evaluate(()=>document.activeElement?.classList.contains('card-fav')),true,'El foco debe permanecer en el favorito activado');
   assert.equal(await page.locator('#propertyGrid .photo-link.has-photo img').count(),await page.locator('#propertyGrid .property-card').count());
   assert.ok(await page.locator('#propertyGrid .card-options').count()>=1);
   await page.locator('#propertyGrid .card-options').first().click();
   assert.equal(await page.getByRole('dialog').isVisible(),true);
   assert.ok(await page.locator('.reference-facts').isVisible());
   assert.match(await page.locator('.reference-description').innerText(),/proyecto|departamentos|parcela/i);
   assert.match(await page.locator('.reference-status').innerText(),/disponibilidad|comprobaci[oó]n/i);
   assert.ok(await page.locator('.reference-source-link[href^="https://"]').count());
   await page.getByRole('button',{name:/Añadir a comparación|Quitar de comparación/}).click();
   await page.getByRole('button',{name:/Favoritos/}).click();
   assert.equal(await page.getByRole('dialog').isVisible(),true);
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('dialog').isVisible(),false);
   const overflow = await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
   assert.ok(overflow<=1, 'Desbordamiento horizontal en '+width+'px: '+overflow+'px');
   await page.getByRole('button',{name:'Actualidad',exact:true}).click();
   assert.ok(await page.locator('#newsGrid .news').count()>0);
   assert.deepEqual(failures,[], 'Errores de JavaScript en '+width+'px, '+theme);
   report.push({width,height,theme,overflow,results:'ok'});
   await context.close();
  }
 }

 const context=await browser.newContext({viewport:{width:375,height:812}});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:8765/#ficha=IEC-PUB-2026-000001',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#search').inputValue(),'IEC-PUB-2026-000001');
 assert.equal(await page.locator('#propertyGrid .property-card').count(),1);
 await page.locator('#propertyGrid .card-options').click();
 assert.match(await page.locator('.reference-status').innerText(),/bloque[oó]|revisi[oó]n|desconocida/i);
 await page.keyboard.press('Escape');
 const sourceCards=page.locator('#propertyGrid .property-card');
 assert.equal(await sourceCards.locator('.card-fav').count(),1);
 assert.equal(await sourceCards.locator('.card-options').count(),1);
 await sourceCards.locator('.card-options').first().click();
 assert.equal(await page.getByRole('dialog').isVisible(),true);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shareData=data;}}));
 await page.getByRole('button',{name:'Compartir enlace'}).click();
 assert.equal(await page.getByRole('dialog').isVisible(),false);
 assert.match(await page.evaluate(()=>window.__shareData?.url||''),/IEC-PUB-2026-000001$/);
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
 await page.locator('#homeQuery').fill('Ancud');
 await page.locator('#homeRegion').selectOption('Los Lagos');
 await page.locator('#homeSearch button[type="submit"]').click();
 assert.equal(await page.locator('#region').inputValue(),'Los Lagos');
 assert.equal(await page.locator('#propertyGrid .property-card').count(),1);
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
 await page.evaluate(()=>{window.__featuredBefore=document.querySelector('#featured .property-card')});
 await page.getByRole('button',{name:'Propiedades',exact:true}).click();
 await page.locator('#search').fill('Rancagua');
 assert.equal(await page.evaluate(()=>window.__featuredBefore===document.querySelector('#featured .property-card')),true,'El filtro no debe reconstruir las destacadas');
 await page.locator('#search').fill('');
 await page.getByRole('button',{name:'Inicio',exact:true}).click();
 assert.ok((await page.locator('#regionQuick .region-button').count())>=5);
 await page.locator('#regionQuick .region-button[data-region="O\'Higgins"]').click();
 assert.equal(await page.locator('#region').inputValue(),"O'Higgins");
 assert.ok((await page.locator('#propertyGrid .property-card').count())>=2);
 await page.locator('#budget').selectOption('3000');
 assert.equal(await page.locator('#propertyGrid .property-card').count(),0);
 await page.getByRole('button',{name:'Limpiar',exact:true}).click();
 await page.locator('#search').fill('penalolen');
 assert.equal(await page.locator('#propertyGrid .property-card').count(),1);
 await page.goto('http://127.0.0.1:8765/guia.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#checks input[type="checkbox"]').count(),6);
 await page.locator('#checks input[type="checkbox"]').first().check();
 assert.match(await page.locator('#progress').innerText(),/1 de 6/);
 await page.goto('http://127.0.0.1:8765/herramientas.html',{waitUntil:'domcontentloaded'});
 await page.locator('#name').fill('Departamento de ejemplo');
 await page.locator('#city').fill('Concepción');
 await page.locator('#price').fill('2500');
 await page.getByRole('button',{name:'Crear resumen'}).click();
 assert.match(await page.locator('#result').innerText(),/UF 2.500/);
 assert.match(await page.locator('#result').innerText(),/Disponibilidad por confirmar|disponibilidad por confirmar/i);
 assert.equal(await page.locator('#copy').isEnabled(),true);
 assert.ok((await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth)))<=1);
 await context.close();
 console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
