const POS   = ['HH','HB','VB','VG','VH','VD'];
const VERT  = [2,3,4,5];
const HORIZ = [0,1];
let balType = 'raquetterie';
let has24h  = false;

function buildRows(tbodyId, pfx) {
  document.getElementById(tbodyId).innerHTML = POS.map(p => `
    <tr>
      <td class="pos-lbl">${p}</td>
      <td class="t-inp-cell"><input class="t-inp" type="number" id="${pfx}-a-${p}" placeholder="°"   step="1"   oninput="recalc('${pfx}')"></td>
      <td class="t-inp-cell"><input class="t-inp" type="number" id="${pfx}-m-${p}" placeholder="s/j" step="0.1" oninput="recalc('${pfx}')"></td>
      <td class="t-inp-cell"><input class="t-inp" type="number" id="${pfx}-r-${p}" placeholder="ms"  step="0.1" oninput="recalc('${pfx}')"></td>
    </tr>`).join('');
}

function buildRecap(tbodyId, pfx) {
  const rows = [{id:'X',lbl:'X'},{id:'D',lbl:'Δ'},{id:'DVH',lbl:'DVH'},{id:'Di',lbl:'Di'}];
  const vis  = rows.map(r => `
    <tr>
      <td class="r-row-lbl">${r.lbl}</td>
      <td class="r-cell"><span class="rv" id="${pfx}-ra-${r.id}">—</span></td>
      <td class="r-cell"><span class="rv" id="${pfx}-rm-${r.id}">—</span></td>
      <td class="r-cell"><span class="rv" id="${pfx}-rr-${r.id}">—</span></td>
    </tr>`).join('');
  const dx = `
    <tr id="${pfx}-dxrow" style="display:none">
      <td class="r-row-lbl">DX</td>
      <td class="r-cell"><span class="rv" id="${pfx}-ra-DX">—</span></td>
      <td class="r-cell"><span class="rv" id="${pfx}-rm-DX">—</span></td>
      <td class="r-cell"><span class="rv" id="${pfx}-rr-DX">—</span></td>
    </tr>`;
  document.getElementById(tbodyId).innerHTML = vis + dx;
}

function readCol(pfx, col) {
  return POS.map(p => { const v=parseFloat(document.getElementById(`${pfx}-${col}-${p}`)?.value); return isNaN(v)?null:v; });
}
function avg(arr)    { const v=arr.filter(x=>x!==null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; }
function dlt(arr)    { const v=arr.filter(x=>x!==null); return v.length>=2?Math.max(...v)-Math.min(...v):null; }
function dvh(arr)    { const av=avg(VERT.map(i=>arr[i])),ah=avg(HORIZ.map(i=>arr[i])); return (av!==null&&ah!==null)?av-ah:null; }
function fmt(v,d=1)  { if(v===null||isNaN(v))return'—'; return Number.isInteger(v)?String(v):v.toFixed(d); }
function setRV(id,val,d=1) { const el=document.getElementById(id); if(!el)return; el.textContent=fmt(val,d); el.className='rv'+(val!==null&&!isNaN(val)?' calc':''); }

function recalc(pfx) {
  const a=readCol(pfx,'a'),m=readCol(pfx,'m'),r=readCol(pfx,'r');
  setRV(`${pfx}-ra-X`,avg(a)); setRV(`${pfx}-rm-X`,avg(m)); setRV(`${pfx}-rr-X`,avg(r));
  setRV(`${pfx}-ra-D`,dlt(a),0); setRV(`${pfx}-rm-D`,dlt(m)); setRV(`${pfx}-rr-D`,dlt(r));
  setRV(`${pfx}-ra-DVH`,dvh(a)); setRV(`${pfx}-rm-DVH`,dvh(m)); setRV(`${pfx}-rr-DVH`,dvh(r));
  const dia=(a[3]!==null&&a[1]!==null)?Math.abs(a[3]-a[1]):null;
  const dim=(m[3]!==null&&m[1]!==null)?Math.abs(m[3]-m[1]):null;
  const dir=(r[3]!==null&&r[1]!==null)?Math.abs(r[3]-r[1]):null;
  setRV(`${pfx}-ra-Di`,dia,0); setRV(`${pfx}-rm-Di`,dim); setRV(`${pfx}-rr-Di`,dir);
  if(has24h) recalcDX();
}

function recalcDX() {
  [['a','ra'],['m','rm'],['r','rr']].forEach(([col,pre])=>{
    const dx=(avg(readCol('0h',col))!==null&&avg(readCol('24h',col))!==null)?avg(readCol('0h',col))-avg(readCol('24h',col)):null;
    setRV(`0h-${pre}-DX`,dx);
  });
}

function toggle24() {
  has24h=!has24h;
  document.getElementById('tog24').classList.toggle('on',has24h);
  document.getElementById('t24-wrap').classList.toggle('open',has24h);
  const r=document.getElementById('0h-dxrow'); if(r) r.style.display=has24h?'':'none';
  if(has24h) recalcDX();
}

function setBal(t) {
  balType=t;
  document.getElementById('btn-raq').classList.toggle('active',t==='raquetterie');
  document.getElementById('btn-iv').classList.toggle('active',t==='inertie');
}

function openSidebar(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('overlay').classList.add('open'); }
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }
function openGlos()  { document.getElementById('glos-modal').classList.add('open'); }
function closeGlos() { document.getElementById('glos-modal').classList.remove('open'); }

function resetAll() {
  document.querySelectorAll('.t-inp').forEach(el=>el.value='');
  document.querySelectorAll('.rv').forEach(el=>{el.textContent='—';el.className='rv';});
  document.getElementById('results').innerHTML='';
  if(has24h) toggle24();
}

function getTols() {
  return {
    repMax:parseFloat(document.getElementById('tol-rep').value)||0.6,
    dltMax:parseFloat(document.getElementById('tol-delta').value)||12,
    mMin:parseFloat(document.getElementById('tol-mmin').value)||-5,
    mMax:parseFloat(document.getElementById('tol-mmax').value)||15,
    a0Max:parseFloat(document.getElementById('tol-a0').value)||320,
    a24Min:parseFloat(document.getElementById('tol-a24').value)||210,
  };
}

function analyser() {
  const T=getTols();
  const a0=readCol('0h','a'),m0=readCol('0h','m'),r0=readCol('0h','r');
  const m24=has24h?readCol('24h','m'):null;
  const a24=has24h?readCol('24h','a'):null;
  const repMax0=(()=>{const v=r0.filter(x=>x!==null);return v.length?Math.max(...v.map(Math.abs)):null;})();
  const dlt0=dlt(m0), X0=avg(m0), dvh0=dvh(m0);
  const DX_m=(X0!==null&&avg(m24)!==null)?X0-avg(m24):null;
  const ampMax0=(()=>{const v=a0.filter(x=>x!==null);return v.length?Math.max(...v):null;})();
  const ampMin24=has24h?(()=>{const v=a24.filter(x=>x!==null);return v.length?Math.min(...v):null;})():null;
  const issues=[];

  // CHANGEMENT : Remplacement des 'else if' par des 'if' pour afficher tous les défauts simultanément
  if(repMax0!==null&&repMax0>T.repMax) {
    issues.push({icon:'⧖',title:'Repère hors tolérance',badge:'Critique',bcls:'b-err',items:[
      {num:null,txt:`Valeur maximale du repère : <em>${repMax0.toFixed(1)} ms</em> (tolérance : ${T.repMax} ms). Déplacer le porte-piton pour se rapprocher le plus possible du <em>0,0 ms</em>. Au plus le repère est proche de zéro, au plus le réglage est précis.`}
    ]});
  }
  
  if(dlt0!==null&&dlt0>T.dltMax) {
    const items=[];
    const dvhNeg=dvh0!==null&&dvh0<0, dvhPos=dvh0!==null&&dvh0>0;
    const dxPos=DX_m!==null&&DX_m>0, dxNeg=DX_m!==null&&DX_m<0;
    if(dvhNeg||dxPos) items.push({num:'01',txt:`DVH marche = <em>${dvh0!==null?dvh0.toFixed(1):'?'} s/j</em>${DX_m!==null?' — DX = <em>'+DX_m.toFixed(1)+' s/j</em>':''}. DVH négatif et/ou DX positif : <em>serrer les goupilles de la raquette</em>.`});
    if(dvhPos||dxNeg) items.push({num:'02',txt:`DVH marche = <em>${dvh0!==null?dvh0.toFixed(1):'?'} s/j</em>${DX_m!==null?' — DX = <em>'+DX_m.toFixed(1)+' s/j</em>':''}. DVH positif et/ou DX négatif : <em>ouvrir les goupilles de la raquette</em>.`});
    if(!items.length){
      items.push({num:'01',txt:`Si DVH négatif et/ou DX positif : <em>serrer les goupilles de la raquette</em>.`});
      items.push({num:'02',txt:`Si DVH positif et/ou DX négatif : <em>ouvrir les goupilles de la raquette</em>.`});
    }
    items.push({num:'03',txt:`Delta aberrant (<em>${dlt0.toFixed(1)} s/j</em>) — vérifier l'<em>équilibrage du balancier</em>.`,eq:true});
    issues.push({icon:'⚖',title:'Delta de marche hors tolérance',badge:'Action requise',bcls:'b-err',items});
  }
  
  if(X0!==null&&(X0<T.mMin||X0>T.mMax)) {
    const sens=X0<T.mMin?'retard':'avance';
    const txt=balType==='raquetterie'
      ?`Marche moyenne = <em>${X0.toFixed(1)} s/j</em> (tolérance : ${T.mMin} à ${T.mMax} s/j). Le mouvement prend du <em>${sens}</em>. Agir sur les <em>goupilles de la raquette</em> vers l'avance ou le retard selon le sens de correction.`
      :`Marche moyenne = <em>${X0.toFixed(1)} s/j</em> (tolérance : ${T.mMin} à ${T.mMax} s/j). Le mouvement prend du <em>${sens}</em>. Agir sur la <em>courbe terminale du spiral</em> en modifiant l'angle entre ses points d'attaches (uniquement si courbe terminale levée).`;
    issues.push({icon:'⟳',title:'Marche hors tolérance',badge:'Correction',bcls:'b-warn',items:[{num:null,txt}]});
  }
  
  if(ampMax0!==null&&ampMax0>T.a0Max) {
    issues.push({icon:'⚠',title:'Amplitude 0H excessive — Risque de rebat',badge:'Attention',bcls:'b-warn',items:[
      {num:null,txt:`Amplitude max = <em>${ampMax0}°</em> (seuil : ${T.a0Max}°). Risque ou phase de <em>rebat</em>. Attendre <em>30 minutes</em> de stabilisation après armage. Si le rebat persiste, modifier la <em>pénétration des palettes</em>. Sinon, prévenir le responsable de zone.`}
    ]});
  }
  
  if(has24h&&ampMin24!==null&&ampMin24<T.a24Min) {
    issues.push({icon:'↓',title:'Amplitude 24H insuffisante',badge:'Intervention requise',bcls:'b-err',items:[
      {num:null,txt:`Amplitude min 24H = <em>${ampMin24}°</em> (seuil : ${T.a24Min}°). Une amplitude &lt; ${T.a24Min}° témoigne d'une <em>perte d'énergie</em> dans le mouvement — un <em>décottage</em> est nécessaire.`}
    ]});
  }

  const out=document.getElementById('results');
  if(!issues.length){
    out.innerHTML=`<div class="res-ok"><div class="res-ok-icon">✦</div><div class="res-ok-txt">Réglage conforme</div><div class="res-ok-sub">Tous les paramètres sont dans les tolérances définies.</div></div>`;
  } else {
    out.innerHTML=issues.map((iss,i)=>{
      const ih=iss.items.map(it=>`
        <div class="c-item"><span class="c-num">${it.num||''}</span>
          <div><div class="c-txt">${it.txt}</div>
          ${it.eq?`<button class="btn-eq" onclick="toggleEq('eq${i}')">⚙ Équilibrage du balancier</button>
            <div class="eq-panel" id="eq${i}"><div class="eq-head">Règles d'équilibrage dynamique</div>
            <div class="eq-body">${getEqContent()}</div></div>`:''}
          </div></div>`).join('');
      return `<div class="d-card" style="animation-delay:${i*.07}s">
        <div class="d-head"><span class="d-icon">${iss.icon}</span><span class="d-title">${iss.title}</span><span class="d-badge ${iss.bcls}">${iss.badge}</span></div>
        <div class="d-body">${ih}</div></div>`;
    }).join('');
  }
  out.scrollIntoView({behavior:'smooth',block:'start'});
}

function toggleEq(id){ document.getElementById(id).classList.toggle('open'); }
function getEqContent(){
  return balType==='raquetterie'?`
    <div class="eq-rule"><strong>Balancier annulaire</strong></div>
    <div class="eq-rule">• Grandes amplitudes (A° verticale &gt; 240°) : <strong>fraiser le retard</strong></div>
    <div class="eq-rule">• Petites amplitudes (A° verticale &lt; 180°) : <strong>fraiser l'avance</strong></div>`
  :`<div class="eq-rule"><strong>Balancier à vis (inertie variable)</strong></div>
    <div class="eq-rule">• Grandes amplitudes : <strong>visser le retard</strong> ou dévisser l'avance</div>
    <div class="eq-rule">• Petites amplitudes : <strong>visser l'avance</strong> ou dévisser le retard</div>`;
}

buildRows('rows-0h','0h'); buildRows('rows-24h','24h');
buildRecap('recap-0h','0h'); buildRecap('recap-24h','24h');
