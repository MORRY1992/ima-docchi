export const yenFloor=(amount,rate)=>Math.floor(amount*Math.round(rate*10)/1000+1e-9);
export function validate(tool,input){
 const values={},errors={};
 for(const f of tool.fields){const raw=input[f.id];
  if(f.options){if(!f.options.some(([v])=>v===raw))errors[f.id]='選択肢を選んでください。';else values[f.id]=raw;continue;}
  if(raw===null||raw===undefined||typeof raw==='boolean'||String(raw).trim()===''){errors[f.id]='数値を入力してください。';continue;}
  const n=Number(raw);
  if(!Number.isFinite(n)||n<f.min||n>f.max){errors[f.id]=`${f.min.toLocaleString('ja-JP')}〜${f.max.toLocaleString('ja-JP')}で入力してください。`;continue;}
  const scaled=n/f.step;
  if(Math.abs(scaled-Math.round(scaled))>1e-6){errors[f.id]=`${f.step}刻みで入力してください。`;continue;}
  values[f.id]=n;
 }
 if(tool.id==='bulk')for(const id of ['useA','useB'])if(values[id]===0)errors[id]='単価の計算には0％より大きい割合が必要です。';
 if(tool.id==='trending'&&values.resale>values.purchase+values.maintenance)errors.resale='購入価格と維持費の合計以下で入力してください。';
 return{values,errors,valid:Object.keys(errors).length===0};
}
const fmt=n=>new Intl.NumberFormat('ja-JP',{maximumFractionDigits:2}).format(n);
const equalAt=(cost,saving,unit)=>saving===0?(cost===0?'追加費用も節約額も0のため、すべて同額です。':'1回あたりの節約が0のため、回数を増やしても元は取れません。'):`${fmt(Math.ceil(cost/saving))}${unit}で同額または有利になります。`;
export function compute(tool,input){
 const checked=validate(tool,input);if(!checked.valid)return{ok:false,errors:checked.errors};
 const v=checked.values;let a,b,insight='',details=[],cashA,cashB;
 switch(tool.id){
 case 'points':{const off=yenFloor(v.price,v.discount),p=Math.min(yenFloor(v.price,v.rate),v.cap);a=v.price-off;b=v.price-p*v.use/100;cashA=a;cashB=v.price;details=[`値引き ${fmt(off)}円`, `獲得 ${fmt(p)}pt／使える価値 ${fmt(p*v.use/100)}円`];insight=p?`ポイントを${fmt(off/p*100)}％使えれば、今回の値引きと同額です。${off>p?'100％を超えるため、この条件では還元が逆転できません。':''}`:'還元ポイントが0のため、将来使える価値も0円です。';break;}
 case 'coupon':{const da=v.price>=v.minA?Math.min(v.price,v.coupon):0;const db=v.price>=v.minB?Math.min(yenFloor(v.price,v.rate),v.cap):0;a=v.price-da;b=v.price-db;details=[`Aの割引 ${fmt(da)}円${v.price<v.minA?'（最低購入額に未達）':''}`,`Bの割引 ${fmt(db)}円${v.price<v.minB?'（最低購入額に未達）':''}`];insight=v.rate===0?'パーセント割引率が0％です。':v.cap<v.coupon?'パーセント割引の上限がクーポン額より低く、両方の条件を満たす場合は金額クーポンが有利です。':`上限と最低購入額の制約がなければ、購入額${fmt(Math.ceil(v.coupon*1000/Math.round(v.rate*10)))}円が同額となる最初の目安です。`;break;}
 case 'shipping':a=v.cart+(v.cart>=v.threshold?0:v.shipping);b=v.cart+v.extra+(v.cart+v.extra>=v.threshold?0:v.shipping);insight=v.cart>=v.threshold?'すでに送料無料の条件を満たしています。':`送料無料まであと${fmt(v.threshold-v.cart)}円。${v.cart+v.extra<v.threshold?'この買い足し額では送料もかかります。':v.extra>v.shipping?'買い足し額が送料を上回っています。必要な商品かも確認しましょう。':'買い足し後の金額で送料無料条件を満たします。'}`;details=[`Aの送料 ${fmt(v.cart>=v.threshold?0:v.shipping)}円`,`Bの送料 ${fmt(v.cart+v.extra>=v.threshold?0:v.shipping)}円`];break;
 case 'bulk':a=v.priceA/(v.qtyA*v.useA/100);b=v.priceB/(v.qtyB*v.useB/100);cashA=v.priceA;cashB=v.priceB;{const needed=a===0?null:v.priceB/(v.qtyB*a)*100;insight=needed===null?'小容量の単価が0円のため、通常の分岐割合は算出できません。':`大容量を約${fmt(needed)}％使うと単価が同額。${needed>100?'100％を超えるため、この条件では大容量が逆転できません。':'保存期間もあわせて考えましょう。'}`;}break;
 case 'member':{const saving=Math.min(v.price,v.saving);a=v.price*v.times;b=(v.price-saving)*v.times+v.fee;insight=equalAt(v.fee,saving,'回');details=[`1回の実際の割引 ${fmt(saving)}円`,`年間割引合計 ${fmt(saving*v.times)}円`];break;}
 case 'subscription':a=v.monthly*v.months;b=v.annual*Math.ceil(v.months/12);{const n=v.monthly===0?null:Math.ceil(v.annual/v.monthly);insight=n===null?(v.annual===0?'月払い・年払いとも0円です。':'月払いが0円のため、年払いによる節約はありません。'):n>12?'最初の12か月以内では、年払いが月払い以下になる月はありません。':`最初の12か月では${n}か月で同額または年払いが有利。13か月目以降は年払いの更新額に注意。`;details=[`年払いの請求単位 ${Math.ceil(v.months/12)}年分`];}break;
 case 'pass':a=v.fare*v.rides;b=v.passPrice+v.outside;insight=equalAt(b,v.fare,'回');break;
 case 'hotel':{const p=v.chance/100,ca=v.early*v.cancelA/100,cb=v.flex*v.cancelB/100;a=v.early*(1-p)+ca*p;b=v.flex*(1-p)+cb*p;const slope=(ca-v.early)-(cb-v.flex);const cross=slope===0?null:(v.flex-v.early)/slope*100;insight=cross===null?(v.early===v.flex?'取消確率にかかわらず、期待支出は同額です。':'取消確率を変えても、期待支出の順位は変わりません。'):cross>=0&&cross<=100?`取消確率が約${fmt(cross)}％で期待支出が同額です。`:'0〜100％の範囲に同額となる取消確率はありません。';details=[`宿泊する場合：A ${fmt(v.early)}円 ／ B ${fmt(v.flex)}円`,`取消す場合：A ${fmt(ca)}円 ／ B ${fmt(cb)}円`];break;}
 case 'expiry':a=v.points*v.nowValue;b=v.days===0?0:v.points*v.laterValue*v.useChance/100;insight=v.days===0?'今日が有効期限という入力です。期限時刻を確認し、翌日以降へは持ち越さないでください。':v.laterValue===0?'将来の交換価値が0円のため、後で使う価値は0円です。':`将来使える見込みが${fmt(v.nowValue/v.laterValue*100)}％で同じ価値。残り${v.days}日から利用確率を自動推定していません。`;details=[`将来の利用見込み ${v.days===0?'0（持ち越し不可）':fmt(v.useChance)}％`];break;
 case 'campaign':{const calc=s=>{const eligible=v.price>=v['min'+s];const cash=v.price-(eligible?yenFloor(v.price,v['discount'+s]):0);const base=v['base'+s]==='before'?v.price:cash;const pts=eligible?Math.min(yenFloor(base,v['rate'+s]),v['cap'+s]):0;return{cash,pts,net:cash-pts*v.use/100,eligible};};const x=calc('A'),y=calc('B');a=x.net;b=y.net;cashA=x.cash;cashB=y.cash;details=[`A：${fmt(x.pts)}pt${x.eligible?'':'（最低購入額に未達）'}`,`B：${fmt(y.pts)}pt${y.eligible?'':'（最低購入額に未達）'}`];insight='割引前・割引後で還元対象額が変わります。併用可否とエントリー条件を確認してください。';break;}
 case 'season':a=v.transportA*v.people+v.hotelA*v.nights+v.extraA;b=v.transportB*v.people+v.hotelB*v.nights+v.extraB;details=[`A：交通 ${fmt(v.transportA*v.people)}円／宿泊 ${fmt(v.hotelA*v.nights)}円／その他 ${fmt(v.extraA)}円`,`B：交通 ${fmt(v.transportB*v.people)}円／宿泊 ${fmt(v.hotelB*v.nights)}円／その他 ${fmt(v.extraB)}円`];insight=`${v.people}人・${v.nights}泊の総額です。1人あたりの差は約${fmt(Math.abs(a-b)/v.people)}円。`;break;
 case 'trending':a=v.purchase+v.maintenance-v.resale;b=v.initial+v.rental*v.months+v.returnFee;{const n=v.rental===0?null:Math.max(1,Math.ceil((a-v.initial-v.returnFee)/v.rental));insight=n===null?'レンタル月額が0円のため、利用月数による分岐はありません。':`${n}か月で購入の実質負担がレンタル以下になります（売却見込額が実現した場合）。`;details=[`購入時の支出 ${fmt(v.purchase+v.maintenance)}円`,`売却見込額 ${fmt(v.resale)}円`];}break;
 default:throw new Error('Unknown calculator');
 }
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new Error('Non-finite result');
 const diff=a-b;const winner=Math.abs(diff)<1e-8?'tie':((tool.direction==='higher'?diff>0:diff<0)?'a':'b');
 return{ok:true,a,b,cashA,cashB,gap:Math.abs(diff),winner,details,insight,metric:tool.metric,unit:tool.unit||'円'};
}
