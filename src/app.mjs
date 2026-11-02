import {compute} from './calculator.mjs';
const money=n=>new Intl.NumberFormat('ja-JP',{maximumFractionDigits:2}).format(n);
const text=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
const main=document.querySelector('[data-tool]');
if(!main){
 let filter='all';const buttons=[...document.querySelectorAll('[data-filter]')],cards=[...document.querySelectorAll('.tool-card')],search=document.querySelector('#search');
 const refresh=()=>{const q=(search?.value||'').trim().toLowerCase();let n=0;cards.forEach(c=>{c.hidden=!(filter==='all'||c.dataset.category===filter)||!c.dataset.search.toLowerCase().includes(q);if(!c.hidden)n++;});const count=document.querySelector('#visible-count');if(count)count.textContent=n;const empty=document.querySelector('#no-results');if(empty)empty.hidden=n>0;};
 buttons.forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;buttons.forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));refresh();}));search?.addEventListener('input',refresh);
}else{
 try{
 const response=await fetch('/assets/tools.json');if(!response.ok)throw new Error('Tools unavailable');const tools=await response.json();const tool=tools.find(t=>t.id===main.dataset.tool);if(!tool)throw new Error('Tool unavailable');
 const form=document.querySelector('#calc-form'),content=document.querySelector('#result-content'),summary=document.querySelector('#result-summary'),feedback=document.querySelector('#prediction-feedback');let last=null,hasEdited=false,prediction=null,announceTimer;
 const showPrediction=()=>{feedback.textContent=prediction&&last?.ok?(prediction===last.winner?'予想と同じ結果でした！ 条件を変えるとどうなる？':'予想とは違う結果に。条件と計算根拠を見てみよう。'):'';};
 function render(){
  const input=Object.fromEntries(new FormData(form));last=compute(tool,input);
  for(const f of tool.fields){const el=form.elements.namedItem(f.id),error=last.errors?.[f.id]||'';el.setAttribute('aria-invalid',error?'true':'false');document.querySelector('#error-'+f.id).textContent=error;}
  content.replaceChildren();clearTimeout(announceTimer);
  if(!last.ok){content.append(text('h2','入力を確認してください'),text('p','赤く表示された項目を直すと、結果が表示されます。'));feedback.textContent='';summary.textContent='入力エラーがあります。';return;}
  const r=last;const caption=text('p',hasEdited?'あなたの条件での比較':'計算例の結果','result-mode');const label=r.winner==='tie'?'この条件では、同じです':`${r.winner==='a'?tool.a:tool.b}が有利`;
  const headline=text('h2',label,'winner-title');const gap=text('div',r.winner==='tie'?'差額 0':r.gap<0.01?'差は0.01未満':money(r.gap),'gap-number');gap.append(text('span',r.unit));
  const metric=text('p',tool.metric+'の比較','metric');const grid=document.createElement('div');grid.className='result-values';
  for(const [key,l,n] of [['a',tool.a,r.a],['b',tool.b,r.b]]){const el=document.createElement('div');el.className=r.winner===key?'is-winner':'';el.append(text('small',l),text('strong',money(n)),text('span',r.unit));grid.append(el);}
  content.append(caption,headline,gap,metric,grid);
  if(r.cashA!==undefined)content.append(text('p',`実際の支払額：A ${money(r.cashA)}円 ／ B ${money(r.cashB)}円`,'cash-note'));
  if(r.details.length){const list=document.createElement('ul');list.className='result-details';r.details.forEach(d=>list.append(text('li',d)));content.append(list);}
  content.append(text('p',r.insight,'insight'));
  announceTimer=setTimeout(()=>summary.textContent=`${label}。差は${r.gap<0.01&&r.gap>0?'0.01未満':money(r.gap)}${r.unit}。`,250);showPrediction();
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',()=>{hasEdited=true;render();});form.addEventListener('change',()=>{hasEdited=true;render();});form.addEventListener('reset',()=>{hasEdited=false;prediction=null;document.querySelectorAll('[name="prediction"]').forEach(x=>x.checked=false);setTimeout(render,0);});
 document.querySelectorAll('[name="prediction"]').forEach(el=>el.addEventListener('change',()=>{prediction=el.value;showPrediction();}));
 document.querySelector('.show-result').addEventListener('click',()=>{const invalid=form.querySelector('[aria-invalid="true"]');if(invalid){invalid.focus();return;}const el=document.querySelector('#result');el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});el.focus({preventScroll:true});});
 const shareUrl=document.querySelector('link[rel="canonical"]').href;
 const fallback=document.querySelector('#copy-fallback'),status=document.querySelector('#share-status');
 async function copy(){try{await navigator.clipboard.writeText(shareUrl);status.textContent='比較ページのURLをコピーしました。';fallback.hidden=true;}catch{fallback.hidden=false;fallback.value=shareUrl;fallback.focus();fallback.select();status.textContent='URLを長押し、または選択してコピーしてください。';}}
 document.querySelector('#copy-link').addEventListener('click',copy);
 document.querySelector('#native-share').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:tool.title+'｜今これ、どっち？',text:'自分の条件で比べてみよう。'+tool.title,url:shareUrl});status.textContent='共有操作を終了しました。';}catch(e){if(e.name!=='AbortError')await copy();}}else await copy();});
 render();
 }catch{document.querySelector('#result-content').replaceChildren(text('h2','計算機能を読み込めませんでした'),text('p','通信状態を確認してページを再読み込みしてください。計算式は下に掲載しています。'));}
}
