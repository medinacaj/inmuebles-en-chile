import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const report=[];
try{
 for(const width of [320,375,430,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  const layout=await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   return {brand:rect('.head .brand'),tools:rect('.header-tools'),copy:rect('.hero-copy'),photo:rect('.heroart'),search:rect('#homeSearch'),news:rect('#actualidad-inicio'),color:getComputedStyle(document.body).backgroundColor,overflow:document.documentElement.scrollWidth-innerWidth,font:document.fonts.check('700 20px Manrope')};
  });
  assert.ok(Math.abs(layout.brand.y+layout.brand.height/2-layout.tools.y-layout.tools.height/2)<4,`${width}: cabecera en una fila`);
  assert.equal(layout.color,'rgb(255, 249, 245)');
  assert.ok(layout.font,'La tipografía local debe cargar');
  assert.ok(layout.overflow<=1,`${width}: desbordamiento`);
  if(width>680)assert.ok(layout.photo.x>=layout.copy.right-2,`${width}: composición en dos columnas`);
  else assert.ok(layout.photo.y>=layout.copy.bottom-2,`${width}: imagen debajo del texto`);
  assert.ok(layout.search.y>=layout.copy.bottom-2,`${width}: buscador no tapa el titular`);
  assert.ok(layout.news.y>=layout.search.bottom-2,`${width}: noticias después del buscador`);
  assert.match(await page.locator('.hero-copy h1').innerText(),/Tu próximo lugar empieza aquí/);
  await page.locator('#homeQuery').fill('');
  await page.locator('#homeBudget').selectOption('3000');
  await page.locator('#homeSearch button[type="submit"]').click();
  assert.equal(await page.locator('#budget').inputValue(),'3000');
  assert.equal(await page.locator('#propertyGrid .property-card').count(),4);
  report.push({width,status:'ok'});
  await context.close();
 }
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close()}
