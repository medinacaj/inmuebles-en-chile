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
   assert.equal(await page.locator('#propertyGrid .property-card').count(),2);
   await page.locator('.listing-tools button').first().click();
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
 console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); }
