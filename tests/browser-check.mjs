import fs from 'node:fs/promises';import assert from 'node:assert/strict';import{spawn}from'node:child_process';import{createRequire}from'node:module';import{catalog}from'../src/catalog.mjs';
const require=createRequire(import.meta.url);const{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const server=spawn(process.execPath,['src/serve.mjs'],{env:{...process.env,PORT:'4179'},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.on('error',reject);server.on('exit',c=>reject(new Error('Server exited '+c)));});
const browser=await chromium.launch({executablePath:process.env.TEST_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-webgl']});
const out='test-results';await fs.mkdir(out,{recursive:true});const results=[],errors=[];const base='http://127.0.0.1:4179';
try{
 for(const width of [360,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900},...(width<500?{isMobile:true,hasTouch:true,deviceScaleFactor:1}:{})});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));const requests=[];page.on('request',r=>requests.push(r.url()));
  await page.goto(base);await page.waitForLoadState('networkidle');
  assert.equal(await page.locator('.tool-card:visible').count(),12);
  await page.getByRole('button',{name:'旅行・交通',exact:true}).click();assert.equal(await page.locator('.tool-card:visible').count(),2);
  await page.getByRole('button',{name:'すべて',exact:true}).click();await page.getByRole('searchbox').fill('ポイント');assert.ok(await page.locator('.tool-card:visible').count()>0);await page.getByRole('searchbox').fill('見つからない語');assert.equal(await page.locator('.tool-card:visible').count(),0);await page.getByRole('searchbox').fill('');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`home overflow ${width}`);
  await page.screenshot({path:`${out}/home-${width}.png`,fullPage:width===390});
  for(const t of catalog){
   await page.goto(base+'/compare/'+t.id+'/');await page.locator('.winner-title').waitFor();assert.equal(await page.locator('[aria-invalid="true"]').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${t.id} overflow ${width}`);
   await page.locator('[name="prediction"][value="a"]').check({force:true});await page.locator('#prediction-feedback').filter({hasText:/予想/}).waitFor();
   const f=t.fields.find(f=>!f.options);await page.locator('[name="'+f.id+'"]').fill('');assert.equal(await page.locator('[name="'+f.id+'"]').getAttribute('aria-invalid'),'true');assert.match(await page.locator('#result-content').innerText(),/入力を確認/);
   await page.locator('[name="'+f.id+'"]').fill('-1');assert.equal(await page.locator('[name="'+f.id+'"]').getAttribute('aria-invalid'),'true');
   await page.getByRole('button',{name:'計算例に戻す'}).click();await page.locator('.winner-title').waitFor();
   await page.locator('[name="'+f.id+'"]').fill(String(f.value+1));assert.match(await page.locator('.result-mode').innerText(),/あなた/);
   assert.equal(await page.locator('.related .tool-card').count(),3);
   assert.equal(await page.locator('[data-ad-slot]:visible').count(),0);
   if(['points','campaign'].includes(t.id)){await page.getByRole('button',{name:'計算例に戻す'}).click();await page.screenshot({path:`${out}/${t.id}-${width}.png`,fullPage:true});}
  }
  assert.equal(requests.some(u=>!u.startsWith(base)),false,'Unexpected external request');
  results.push({width,pages:13,checks:['initial-results','prediction','live-input','invalid-input','reset','no-horizontal-overflow','related-links','no-ad-gaps','no-third-party-request']});await context.close();
 }
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();await page.goto(base+'/compare/points/');await page.locator('.winner-title').waitFor();await page.getByRole('button',{name:'URLをコピー'}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'https://ima-docchi-2x9.pages.dev/compare/points/');
 await page.getByRole('link',{name:/500円引きと10％OFF/}).click();assert.match(page.url(),/compare\/coupon\//);await page.locator('.winner-title').waitFor();
 // Clipboard denied / native share absent: manual-copy fallback remains available.
 await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}}});Object.defineProperty(navigator,'share',{value:undefined});});await page.reload();await page.locator('.winner-title').waitFor();await page.getByRole('button',{name:'結果を共有'}).click();assert.equal(await page.locator('#copy-fallback').isVisible(),true);
 await page.goto(base+'/missing-page/');assert.match(await page.locator('h1').innerText(),/見つかりません/);
 await context.close();
 // Configuration network failure must leave calculation working.
 const failure=await browser.newContext();await failure.route('**/assets/ads.json',r=>r.abort());const fp=await failure.newPage();await fp.goto(base+'/compare/points/');await fp.locator('.winner-title').waitFor();assert.equal(await fp.locator('[data-ad-slot]:visible').count(),0);await failure.close();
 assert.deepEqual(errors,[]);const report={browser:await browser.version(),date:new Date().toISOString(),viewportResults:results,additional:['clipboard-copy','share-fallback','related-navigation','404','ad-config-network-failure'],javascriptErrors:errors,androidDevice:'not tested',nativeShareSheet:'not tested'};await fs.writeFile(`${out}/browser-report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();server.kill();}
