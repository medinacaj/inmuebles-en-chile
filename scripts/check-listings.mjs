import fs from 'node:fs/promises';
const html=await fs.readFile('index.html','utf8');
const match=html.match(/const REAL=(\[[^;]*\]);\s*let props;/);
if(!match)throw new Error('No se encontró el catálogo REAL');
const properties=JSON.parse(match[1]);
const results=[];
const gone=[/esta propiedad ya no se encuentra disponible/i,/esta publicaci[oó]n ya no est[aá] disponible/i,/propiedad no disponible/i,/aviso ya no est[aá] disponible/i,/publicaci[oó]n finalizada/i];
for(const p of properties){
 let status='unknown',reason='No se pudo confirmar disponibilidad',httpStatus=null;
 try{
  const response=await fetch(p.url,{signal:AbortSignal.timeout(14000),headers:{'User-Agent':'Mozilla/5.0 (compatible; InmueblesEnChileStatusCheck/1.0)'}});
  httpStatus=response.status;
  if([404,410].includes(response.status)){status='unavailable';reason='La ficha responde '+response.status}
  else if(response.ok){
   const html=(await response.text()).slice(0,1200000);
   const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');
   if(gone.some(rx=>rx.test(visible))){status='unavailable';reason='La ficha indica que la publicación no está disponible'}
   else {status='unknown';reason='Página accesible; disponibilidad no confirmada'}
  }else{reason='Respuesta HTTP '+response.status+'; requiere revisión manual'}
 }catch(e){reason='Error de conexión o bloqueo; requiere revisión manual'}
 results.push({id:p.publicationId,status,reason,httpStatus,source:p.source});
}
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/listing-status.json',JSON.stringify({checkedAt:new Date().toISOString(),listings:results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
