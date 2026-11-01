import assert from 'node:assert/strict';
import {firefox,webkit} from 'playwright';

const base='http://127.0.0.1:8765/';
const results=[];
for(const [name,engine] of [['Firefox',firefox],['WebKit (motor Safari)',webkit]]) {
 const browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:375,height:812},{width:1024,height:768}]){
   const context=await browser.newContext({viewport});
   const page=await context.newPage();
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'networkidle'});
   assert.ok(await page.getByRole('button',{name:'Inicio',exact:true}).isVisible());
   const image=page.locator('#featured .photo-link.has-photo img').first();
   await image.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>{
     const img=document.querySelector('#featured .photo-link.has-photo img');
     return !!img && img.complete && img.naturalWidth>0;
   },{},{timeout:12000});
   assert.ok(await image.evaluate(img=>img.naturalWidth>0),name+': imagen inválida');
   await page.getByRole('button',{name:'Propiedades',exact:true}).click();
   await page.locator('#sourceSummary > span').first().waitFor({state:'visible'});
   await page.locator('#search').fill('PENALOLEN');
   assert.equal(await page.locator('#propertyGrid .property-card').count(),1,name+': búsqueda sin tildes');
   await page.locator('#search').fill('');
   await page.locator('#budget').selectOption('3000');
   assert.ok(await page.locator('#propertyGrid .property-card').count()>=1);
   await page.locator('#propertyGrid .card-options').first().click();
   assert.equal(await page.getByRole('dialog').isVisible(),true);
   assert.ok(await page.locator('.reference-facts').isVisible());
   assert.ok(await page.locator('.reference-source-link').count());
   await page.keyboard.press('Escape');
   assert.equal(await page.getByRole('dialog').isVisible(),false);
   assert.ok(await page.locator('#propertyGrid .card-fav').first().isVisible());
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=1,name+': desbordamiento de '+overflow+'px');
   assert.deepEqual(errors,[],name+': errores JavaScript');
   results.push({browser:name,viewport:viewport.width+'x'+viewport.height,overflow,status:'ok'});
   await context.close();
  }
 }finally{await browser.close()}
}
console.log(JSON.stringify(results,null,2));
