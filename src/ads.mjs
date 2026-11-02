// Advertising is deliberately independent of all calculation code.
export function canLoadAds(config,origin){return config.enabled===true&&config.approvalStatus==='approved'&&config.policyReviewed===true&&config.approvedOrigin===origin&&config.format==='social-bar'&&typeof config.scriptUrl==='string'&&config.scriptUrl.startsWith('https://');}
export async function initAds(){
 const slots=[...document.querySelectorAll('[data-ad-slot]')];slots.forEach(s=>s.hidden=true);
 try{const response=await fetch('/assets/ads.json');if(!response.ok)return;const config=await response.json();if(!canLoadAds(config,location.origin))return;
 // Adsterra controls Social Bar creative formats; an interstitial may be included.
 // Do not infer a creative impression from the script load event.
 const script=document.createElement('script');script.src=config.scriptUrl;script.async=true;script.dataset.adProvider='adsterra';script.dataset.cfasync='false';
 const cleanup=()=>{script.remove();slots.forEach(s=>s.hidden=true);document.documentElement.classList.remove('ads-active');};
 script.addEventListener('error',cleanup,{once:true});const timeout=setTimeout(cleanup,10000);
 script.addEventListener('load',()=>{clearTimeout(timeout);/* Loading a script does not prove an ad was served. */},{once:true});
 document.body.append(script);
 }catch{/* Ad configuration must never block a calculator. */}
}
if(typeof document!=='undefined')initAds();
