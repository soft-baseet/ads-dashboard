'use strict';
const $ = id => document.getElementById(id);
const number = n => new Intl.NumberFormat('ar-AE',{maximumFractionDigits:2}).format(n);
const money = n => number(n) + ' USD';
function el(tag, text, cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function add(id,nodes){$(id).replaceChildren(...nodes);}
function card(cls=''){return el('article',undefined,'card '+cls);}
function chart(rows,key,title,color){
 const box=card('chart');box.append(el('h3',title));
 const values=rows.map(r=>r[key]), max=Math.max(...values,1);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 560 190');svg.setAttribute('role','img');svg.setAttribute('aria-label',title+'؛ التفاصيل في جدول البيانات أسفل الصفحة');
 for(let i=0;i<4;i++){const y=20+i*45,line=document.createElementNS(ns,'line');for(const [a,v]of Object.entries({x1:42,x2:550,y1:y,y2:y,stroke:'#e5ebe6'}))line.setAttribute(a,v);svg.append(line);const label=document.createElementNS(ns,'text');label.setAttribute('x','2');label.setAttribute('y',y+4);label.setAttribute('fill','#617571');label.setAttribute('font-size','10');label.textContent=number(max*(1-i/3));svg.append(label);}
 const points=values.map((v,i)=>[42+i*508/(values.length-1),155-v/max*135]);
 const area=document.createElementNS(ns,'polygon');area.setAttribute('points',[[42,155],...points,[550,155]].map(p=>p.join(',')).join(' '));area.setAttribute('fill',color);area.setAttribute('opacity','.09');svg.append(area);
 const path=document.createElementNS(ns,'polyline');path.setAttribute('points',points.map(p=>p.join(',')).join(' '));path.setAttribute('fill','none');path.setAttribute('stroke',color);path.setAttribute('stroke-width','3');svg.append(path);
 points.forEach((p,i)=>{const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',p[0]);dot.setAttribute('cy',p[1]);dot.setAttribute('r','3');dot.setAttribute('fill',color);const t=document.createElementNS(ns,'title');t.textContent=rows[i].date+': '+number(values[i]);dot.append(t);svg.append(dot);});
 box.append(svg);const labels=el('div',undefined,'chart-labels');labels.append(el('span',rows[0].date),el('span',rows[rows.length-1].date));box.append(labels);return box;
}
function validate(d){
 if(d.schema_version!==1||typeof d.is_sample!=='boolean'||!Number.isFinite(Date.parse(d.last_updated))||!Array.isArray(d.kpis)||d.markets?.length!==2||!Array.isArray(d.actions)||!Array.isArray(d.ads)||!Array.isArray(d.news)||!d.technical||d.history?.length!==14)throw Error('Invalid data');
 for(const r of d.history)if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(r.spend)||r.spend<0||!Number.isFinite(r.results)||r.results<0)throw Error('Invalid history');
}
function render(d){
 validate(d);
 $('updated').textContent=new Intl.DateTimeFormat('ar-AE',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Dubai'}).format(new Date(d.last_updated))+' · توقيت دبي';$('updated').dateTime=d.last_updated;
 const stale=Date.now()-Date.parse(d.last_updated)>36*60*60*1000;
 $('notice').textContent=(d.is_sample?'نسخة تجريبية — جميع الأرقام والإعلانات والتوصيات نموذجية للاختبار فقط.': 'تم تحميل البيانات بنجاح.')+(stale?' تنبيه: مضى أكثر من 36 ساعة على آخر تحديث.':'');
 $('period').textContent=d.period;
 add('kpis',d.kpis.map(k=>{const b=card('kpi');b.append(el('div',k.label,'label'),el('div',k.unit==='USD'?money(k.value):number(k.value)+(k.unit||''),'value'),el('div',k.note,'note'));return b;}));
 add('markets',d.markets.map(m=>{const b=card(),h=el('div',undefined,'card-head');h.append(el('h3',m.name),el('span',m.status_label,'pill '+(m.status==='warning'?'warning':m.status==='danger'?'danger':'')));b.append(h,el('p',m.summary));const stats=el('div',undefined,'market-stats');[['الإنفاق',money(m.spend)],['النتائج',number(m.results)],['تكلفة النتيجة',m.cpr===null?'غير متاحة':money(m.cpr)]].forEach(([label,value])=>{const s=el('div');s.append(el('span',label),el('strong',value));stats.append(s);});b.append(stats);return b;}));
 add('actions',d.actions.map(a=>{const li=el('li'),text=el('div');text.append(el('strong',a.title),el('p',a.reason));li.append(text);return li;}));
 add('ads',d.ads.map(a=>{const b=card(a.rank==='worst'?'worst':''),metrics=el('div',undefined,'ad-metrics');b.append(el('div',a.rank==='best'?'↗ أفضل إعلان':'↘ أسوأ إعلان','ad-type'),el('h3',a.name),el('p',a.market+' · '+a.description));[['تكلفة النتيجة',money(a.cpr)],['النتائج',number(a.results)]].forEach(([label,value])=>{const s=el('div',label);s.append(el('b',value));metrics.append(s);});b.append(metrics);return b;}));
 add('charts',[chart(d.history,'results','النتائج اليومية','#147d65'),chart(d.history,'spend','الإنفاق اليومي · USD','#9a7c38')]);
 add('news',d.news.map(n=>{const b=card('news-card'),text=el('div');text.append(el('h3',n.title),el('p',n.body));b.append(el('span','✦','news-icon'),text);return b;}));
 add('technical',Object.entries(d.technical).flatMap(([k,v])=>[el('dt',k),el('dd',v)]));
 add('history',d.history.map(r=>{const tr=el('tr');tr.append(el('td',r.date),el('td',number(r.spend)),el('td',number(r.results)));return tr;}));$('dashboard').hidden=false;
}
async function load(){const button=$('refresh');button.disabled=true;button.textContent='جارٍ التحديث…';try{const res=await fetch('data/latest.json',{cache:'no-store'});if(!res.ok)throw Error('HTTP '+res.status);render(await res.json());}catch(error){$('notice').textContent='تعذر تحميل البيانات. تأكد من اتصال الإنترنت ثم أعد المحاولة.';$('dashboard').hidden=true;$('updated').textContent='تعذر التحقق من آخر تحديث';$('updated').removeAttribute('datetime');}finally{button.disabled=false;button.textContent='↻ تحديث البيانات';}}
$('refresh').addEventListener('click',load);load();
