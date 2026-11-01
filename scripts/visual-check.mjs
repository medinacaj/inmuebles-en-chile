import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({headless:true});
const sizes = [
  [320,700],[375,812],[430,932],[768,1024],[1024,768],[1440,900]
];
async function navTo(page,name){const nav=page.locator('#nav');if(!(await nav.isVisible()))await page.locator('#menuToggle').click();await page.getByRole('button',{name,exact:true}).click()}
const report = [];
try {
 for (const [width,height] of sizes) {
  for (const theme of ['light','dark']) {
   const context = await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
   const page = await context.newPage();
   const failures = [];
   page.on('pageerror',error=>failures.push(error.message));
   await page.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.hero-photo').count(),1);
   const editorialHero=page.locator('.hero-photo');
   await editorialHero.evaluate(img=>img.decode());
   assert.ok(await editorialHero.evaluate(img=>img.naturalWidth>=500),'Debe cargar la fotografía de portada');
   assert.equal(await page.locator('.hero-picture source').count(),1,'La foto móvil debe tener su fuente propia');
   assert.ok(await page.locator('.hero-copy h1').isVisible(),'El titular editorial debe estar visible');
   assert.ok(await page.locator('.hero-panels .hero-panel').count()>=3);
   if(width<=680){assert.equal(await page.locator('#menuToggle').isVisible(),true);assert.equal(await page.locator('#nav').isVisible(),false)}
   if (theme==='dark') await page.locator('#theme').click();
   assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('dark')),theme==='dark');
   await navTo(page,'Propiedades');
   if(width<=680)assert.equal(await page.locator('#nav').isVisible(),false,'El menú debe cerrarse tras navegar');
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
   assert.equal(await page.locator('main').evaluate(el=>el.inert),true,'Fondo debe quedar inerte');
   assert.ok(await page.locator('.reference-facts').isVisible());
   const reportLink=page.locator('.report-link');
   assert.equal(await reportLink.count(),1);
   assert.match(await reportLink.getAttribute('href'),/reporte-referencia\.yml/);
   assert.match(await page.locator('.reference-description').innerText(),/proyecto|departamentos|parcela/i);
   assert.match(await page.locator('.reference-status').innerText(),/disponibilidad|comprobaci[oó]n/i);
   assert.ok(await page.locator('.reference-source-link[href^="https://"]').count());
   await page.getByRole('button',{name:/Añadir a comparación|Quitar de comparación/}).click();
   assert.equal(await page.locator('main').evaluate(el=>el.inert),false,'Fondo reactivado al cerrar');
   await page.getByRole('button',{name:/Favoritos/}).click();
   assert.equal(await page.getByRole('dialog').isVisible(),true);
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('dialog').isVisible(),false);
   const overflow = await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
   assert.ok(overflow<=1, 'Desbordamiento horizontal en '+width+'px: '+overflow+'px');
   await navTo(page,'Actualidad');
   assert.ok(await page.locator('#newsGrid .news').count()>0);
   assert.deepEqual(failures,[], 'Errores de JavaScript en '+width+'px, '+theme);
   report.push({width,height,theme,overflow,results:'ok'});
   await context.close();
  }
 }

 const newsContext=await browser.newContext({viewport:{width:375,height:812}});
 const newsPage=await newsContext.newPage();
 const mockNews={
   schemaVersion:1,updatedAt:new Date().toISOString(),sources:[{id:'informe-inmobiliario',name:'Informe Construcción',ok:true,count:2}],
   items:[
    {id:'test-01',title:'Nuevos proyectos inmobiliarios y viviendas en el sur de Chile',url:'https://www.informeconstruccion.com/noticias/proyectos',source:'Informe Construcción',sourceId:'informe-inmobiliario',category:'Mercado',publishedAt:new Date().toISOString()},
    {id:'test-02',title:'Avances en construcción de viviendas y oferta residencial',url:'https://www.informeconstruccion.com/noticias/obras',source:'Informe Construcción',sourceId:'informe-proyectos',category:'Proyectos',publishedAt:new Date().toISOString()}
   ]
 };
 await newsPage.route('**/data/news-feed.json',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockNews)}));
 await newsPage.goto('http://127.0.0.1:8765/',{waitUntil:'networkidle'});
 assert.equal(await newsPage.locator('#homeNews .news').count(),2,'La portada debe publicar titulares RSS');
 await navTo(newsPage,'Actualidad');
 assert.equal(await newsPage.locator('#newsGrid .news').count(),2);
 assert.match(await newsPage.locator('#newsUpdate').innerText(),/Sincronización RSS/);
 await newsPage.locator('#newsFilter').selectOption('Proyectos');
 assert.equal(await newsPage.locator('#newsGrid .news').count(),1,'El filtro Proyectos debe funcionar');
 const outgoing=await newsPage.locator('#newsGrid .news a').first().getAttribute('href');
 assert.match(outgoing,/^https:\/\/www\.informeconstruccion\.com\//);
 await newsContext.close();

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
 await navTo(page,'Propiedades');
 await page.locator('#search').fill('Rancagua');
 assert.equal(await page.evaluate(()=>window.__featuredBefore===document.querySelector('#featured .property-card')),true,'El filtro no debe reconstruir las destacadas');
 await page.locator('#search').fill('');
 await navTo(page,'Inicio');
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
 assert.equal(await page.locator('.suggest-project a[href*="proponer-proyecto.yml"]').count(),1);
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
