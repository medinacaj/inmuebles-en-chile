import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const now=new Date().toISOString();
const article='https://eldiarioinmobiliario.cl/mercado/viviendas-chile/';
const photo='https://eldiarioinmobiliario.cl/wp-content/uploads/news-photo.jpg';
const report=[];
try{
 for(const scenario of ['photo','unavailable','unsafe','mismatched','no-image']){
  const context=await browser.newContext({viewport:{width:375,height:812}});
  const page=await context.newPage();
  const item={id:'image-test',title:'Proyectos de viviendas nuevas y mercado inmobiliario en Chile',url:article,source:'El Diario Inmobiliario',sourceId:'diario-inmobiliario',category:'Mercado',publishedAt:now};
  if(scenario!=='no-image')item.image={url:scenario==='unsafe'?'https://evil.example/track.jpg':photo,sourceUrl:scenario==='mismatched'?'https://eldiarioinmobiliario.cl/otra-noticia/':article,credit:'El Diario Inmobiliario',origin:'rss',checkedAt:now,alt:'Viviendas en Chile'};
  let untrustedRequests=0;
  await page.route('https://evil.example/**',r=>{untrustedRequests++;return r.abort()});
  await page.route(photo,r=>scenario==='unavailable'?r.fulfill({status:404,body:'not found'}):r.fulfill({path:'assets/photos/nueva-maipu.jpg',contentType:'image/jpeg'}));
  await page.route('**/data/news-feed.json',r=>r.fulfill({json:{schemaVersion:1,updatedAt:now,items:[item]}}));
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('#homeNews').scrollIntoViewIfNeeded();
  const homeImage=page.locator('#homeNews img').first();
  await homeImage.evaluate(img=>img.decode());
  if(scenario==='photo'){
   assert.equal(await homeImage.getAttribute('src'),photo,'Debe usar la foto asociada al artículo');
   assert.match(await page.locator('#homeNews .news-image-note').innerText(),/El Diario Inmobiliario/);
   assert.equal(await homeImage.getAttribute('referrerpolicy'),'no-referrer');
   const axe=await new AxeBuilder({page}).include('#homeNews').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
   assert.deepEqual(axe.violations,[]);
  }else{
   assert.match(await homeImage.getAttribute('src'),/^assets\/illustrations\/news-/);
   assert.match(await page.locator('#homeNews .news-image-note').innerText(),/ilustrativa/i);
  }
  await page.evaluate(()=>go('noticias'));
  const newsImage=page.locator('#newsGrid img').first();
  assert.equal(await newsImage.count(),1,'Actualidad también debe mostrar imágenes');
  await newsImage.scrollIntoViewIfNeeded();
  await newsImage.evaluate(img=>img.decode());
  if(scenario==='photo')assert.equal(await newsImage.getAttribute('src'),photo);
  assert.equal(untrustedRequests,0,'No consultar hosts ajenos al medio');
  report.push({scenario,status:'ok'});
  await context.close();
 }
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
