import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']}: {})});
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const report=[];
try{
 for(const width of [375,1440])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});
  await context.addInitScript(theme=>localStorage.setItem('iech_theme',theme),theme);
  const page=await context.newPage();
  async function scan(target){
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();
   report.push({width,theme,target,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))}))});
  }
  await page.goto(base,{waitUntil:'networkidle'});
  await scan('inicio');
  for(const section of ['propiedades','noticias']){await page.evaluate(id=>go(id),section);await scan(section)}
  await page.evaluate(()=>go('propiedades'));
  await page.locator('#propertyGrid .card-options').first().click();
  await scan('dialogo');
  for(const path of ['guia.html','herramientas.html','informacion.html']){
   await page.goto(new URL(path,base).href,{waitUntil:'networkidle'});await scan(path);
  }
  await context.close();
 }
 console.log(JSON.stringify(report,null,2));
 if(report.some(r=>r.violations.length))process.exitCode=1;
}finally{await browser.close()}
