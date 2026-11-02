// Advertising is deliberately independent of all calculation code.
export function canLoadAds(config,origin){return config.enabled===true&&config.approvalStatus==='approved'&&config.policyReviewed===true&&config.approvedOrigin===origin&&config.format==='social-bar'&&typeof config.scriptUrl==='string'&&config.scriptUrl.startsWith('https://');}
export async function initAds(){
 const slots=[...document.querySelectorAll('[data-ad-slot]')];slots.forEach(s=>s.hidden=true);
 try{const response=await fetch('/assets/ads.json');if(!response.ok)return;const config=await response.json();if(!canLoadAds(config,location.origin))return;
 // A future approved network adapter must explicitly opt in to any interstitial.
 // No interstitial is currently loaded, triggered, or simulated here.
 const script=document.createElement('script');script.src=config.scriptUrl;script.async=true;script.dataset.adProvider='adsterra';
 const cleanup=()=>{script.remove();slots.forEach(s=>s.hidden=true);document.documentElement.classList.remove('ads-active');};
 script.addEventListener('error',cleanup,{once:true});const timeout=setTimeout(cleanup,10000);
 script.addEventListener('load',()=>{clearTimeout(timeout);document.documentElement.classList.add('ads-active');},{once:true});
 document.body.append(script);
 }catch{/* Ad configuration must never block a calculator. */}
}
if(typeof document!=='undefined')initAds();
