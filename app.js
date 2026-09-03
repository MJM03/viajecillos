const PEOPLE = 6;
const STORAGE_KEY = 'viajecillos-v1-expenses';

const trip = [
  {date:'2026-09-06',place:'Huaraz — K67',gross:{transport:720,hotel:420,food:600,mobility:108},net:{transport:590.40,hotel:344.40,food:492,mobility:88.56},target:{transport:382.50,hotel:160,food:100.02,mobility:44.28}},
  {date:'2026-09-07',place:'Traslado Huaraz → Chimbote',gross:{transport:0,hotel:0,food:0,mobility:0},net:{transport:0,hotel:0,food:0,mobility:0},target:{transport:0,hotel:0,food:0,mobility:0}},
  {date:'2026-09-08',place:'MegaPlaza Chimbote — B50',gross:{transport:480,hotel:840,food:300,mobility:108},net:{transport:393.60,hotel:688.80,food:246,mobility:88.56},target:{transport:300,hotel:150,food:94.98,mobility:44.28}},
  {date:'2026-09-09',place:'Chimbote — K46',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:150,food:94.98,mobility:44.28}},
  {date:'2026-09-10',place:'Metro Balta Chiclayo — B77',gross:{transport:480,hotel:420,food:300,mobility:108},net:{transport:393.60,hotel:344.40,food:246,mobility:88.56},target:{transport:262.50,hotel:160,food:100.02,mobility:44.28}},
  {date:'2026-09-11',place:'Real Plaza Chiclayo — K24',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:160,food:100.02,mobility:44.28}},
  {date:'2026-09-12',place:'Mall Aventura Chiclayo — T81',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:160,food:100.02,mobility:44.28}},
  {date:'2026-09-13',place:'Open Plaza Piura II — T72',gross:{transport:480,hotel:420,food:300,mobility:108},net:{transport:393.60,hotel:344.40,food:246,mobility:88.56},target:{transport:169.50,hotel:0,food:94.98,mobility:44.28}},
  {date:'2026-09-14',place:'Real Plaza Piura — B25',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:150,food:94.98,mobility:44.28}},
  {date:'2026-09-15',place:'Plaza del Sol Piura — K21',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:150,food:94.98,mobility:44.28}},
  {date:'2026-09-16',place:'Plaza de la Luna — T96',gross:{transport:0,hotel:420,food:300,mobility:108},net:{transport:0,hotel:344.40,food:246,mobility:88.56},target:{transport:0,hotel:150,food:94.98,mobility:44.28}},
  {date:'2026-09-17',place:'Sullana — K53',gross:{transport:480,hotel:420,food:300,mobility:108},net:{transport:393.60,hotel:344.40,food:246,mobility:88.56},target:{transport:71.25,hotel:140,food:94.98,mobility:44.28}},
  {date:'2026-09-18',place:'Costamar Plaza Tumbes — T40',gross:{transport:480,hotel:420,food:300,mobility:108},net:{transport:393.60,hotel:344.40,food:246,mobility:88.56},target:{transport:482.40,hotel:180,food:105,mobility:44.28}},
  {date:'2026-09-19',place:'Av. Bolívar, Tumbes — H33',gross:{transport:1290,hotel:840,food:600,mobility:108},net:{transport:1057.80,hotel:688.80,food:492,mobility:88.56},target:{transport:0,hotel:180,food:105,mobility:44.28}},
  {date:'2026-09-20',place:'Retorno Tumbes → Lima',gross:{transport:0,hotel:0,food:0,mobility:0},net:{transport:0,hotel:0,food:0,mobility:0},target:{transport:0,hotel:0,food:0,mobility:0}}
];

const keys = ['transport','hotel','food','mobility'];
const money = n => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',minimumFractionDigits:2}).format(Number.isFinite(n)?n:0);
const sumObj = obj => keys.reduce((s,k)=>s+(Number(obj[k])||0),0);
const sumTrip = field => trip.reduce((s,d)=>s+sumObj(d[field]),0);
const formatDate = iso => new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`));

let saved = load();
let currentIndex = firstPendingIndex();

const $ = id => document.getElementById(id);
const els = {
  daySelect:$('daySelect'),dayMeta:$('dayMeta'),form:$('expenseForm'),saveMessage:$('saveMessage'),table:$('tripTableBody'),cards:$('tripCards'),
  inputs:{transport:$('transportInput'),hotel:$('hotelInput'),food:$('foodInput'),mobility:$('mobilityInput')},
  hints:{transport:$('transportHint'),hotel:$('hotelHint'),food:$('foodHint'),mobility:$('mobilityHint')}
};

function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{}}catch{return {}}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(saved))}
function firstPendingIndex(){const i=trip.findIndex(d=>!saved[d.date]?.closed);return i>=0?i:trip.length-1}
function actualFor(day){return saved[day.date]?.actual || {transport:0,hotel:0,food:0,mobility:0}}
function isClosed(day){return Boolean(saved[day.date]?.closed)}
function plannedSavings(day){return sumObj(day.net)-sumObj(day.target)}
function actualSavings(day){return sumObj(day.net)-sumObj(actualFor(day))}

function init(){
  els.daySelect.innerHTML=trip.map((d,i)=>`<option value="${i}">${formatDate(d.date)} · ${d.place}${isClosed(d)?' ✓':''}</option>`).join('');
  els.daySelect.value=String(currentIndex);
  els.daySelect.addEventListener('change',()=>{currentIndex=Number(els.daySelect.value);renderDay()});
  els.form.addEventListener('submit',saveDay);
  $('resetBtn').addEventListener('click',resetData);
  keys.forEach(k=>els.inputs[k].addEventListener('input',renderDaySummary));
  document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>showScreen(btn.dataset.go)));
  renderAll();
}

function showScreen(name){
  if(window.innerWidth>600) return;
  document.querySelectorAll('.app-screen').forEach(s=>s.classList.toggle('active',s.dataset.screen===name));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.go===name));
  window.scrollTo({top:0,behavior:'smooth'});
}

function renderAll(){renderDashboard();renderDay();renderTable();refreshSelectLabels()}
function refreshSelectLabels(){[...els.daySelect.options].forEach((o,i)=>{const d=trip[i];o.textContent=`${formatDate(d.date)} · ${d.place}${isClosed(d)?' ✓':''}`})}

function renderDashboard(){
  const totalNet=sumTrip('net');
  const closed=trip.filter(isClosed);
  const actualSpent=closed.reduce((s,d)=>s+sumObj(actualFor(d)),0);
  const realSavings=closed.reduce((s,d)=>s+actualSavings(d),0);
  const projectedSpent=trip.reduce((s,d)=>s+(isClosed(d)?sumObj(actualFor(d)):sumObj(d.target)),0);
  const projectedSavings=totalNet-projectedSpent;
  const done=closed.length;
  const usage=totalNet?projectedSpent/totalNet*100:0;
  $('realSavings').textContent=money(realSavings);
  $('realSavingsPerson').textContent=`${money(realSavings/PEOPLE)} por persona`;
  $('projectedSavings').textContent=money(projectedSavings);
  $('projectedSavingsPerson').textContent=`${money(projectedSavings/PEOPLE)} por persona`;
  $('actualSpent').textContent=money(actualSpent);
  $('daysDone').textContent=`${done} de ${trip.length} días`;
  $('projectedSpent').textContent=money(projectedSpent);
  $('budgetUsage').textContent=`${usage.toFixed(1)}% del disponible`;
  $('netBudgetLabel').textContent=money(totalNet);
  $('progressBar').style.width=`${Math.max(0,Math.min(100,usage))}%`;
}

function renderDay(){
  const d=trip[currentIndex]; const actual=actualFor(d); const closed=isClosed(d);
  els.dayMeta.innerHTML=`<strong>${formatDate(d.date)} · ${d.place}</strong><br>Bruto ${money(sumObj(d.gross))} · Neto ${money(sumObj(d.net))} · Objetivo ${money(sumObj(d.target))}`;
  keys.forEach(k=>{
    els.inputs[k].value=closed?String(actual[k]??0):'';
    els.hints[k].textContent=`Objetivo ${money(d.target[k])} · Disp. ${money(d.net[k])}`;
  });
  els.saveMessage.textContent=closed?'Día guardado. Puedes editarlo.':'';
  renderDaySummary();
}

function readInputs(){const out={};for(const k of keys){const v=parseFloat(els.inputs[k].value);out[k]=Number.isFinite(v)&&v>=0?v:0}return out}
function renderDaySummary(){
  const d=trip[currentIndex],actual=readInputs(); const target=sumObj(d.target), net=sumObj(d.net), act=sumObj(actual), savings=net-act;
  $('daySummary').innerHTML=`
    <div class="mini-stat"><span>Objetivo</span><strong>${money(target)}</strong></div>
    <div class="mini-stat"><span>Ingresado</span><strong>${money(act)}</strong></div>
    <div class="mini-stat ${act<=target?'positive':'negative'}"><span>Vs. objetivo</span><strong>${act<=target?'+':''}${money(target-act)}</strong></div>
    <div class="mini-stat ${savings>=0?'positive':'negative'}"><span>Ahorro grupo</span><strong>${money(savings)}</strong><small> · ${money(savings/PEOPLE)} c/u</small></div>`;
}

function saveDay(e){
  e.preventDefault(); const d=trip[currentIndex]; const actual=readInputs();
  saved[d.date]={actual,closed:true,updatedAt:new Date().toISOString()}; persist();
  els.saveMessage.textContent='Guardado correctamente.';
  renderDashboard();renderTable();refreshSelectLabels();
}

function renderTable(){
  els.table.innerHTML=trip.map(d=>{
    const closed=isClosed(d), actual=closed?sumObj(actualFor(d)):null, target=sumObj(d.target), savings=closed?actualSavings(d):plannedSavings(d);
    let status='<span class="status pending">Pendiente</span>';
    if(closed) status=actual<=target?'<span class="status done">Cerrado</span>':'<span class="status over">Sobre objetivo</span>';
    return `<tr><td>${formatDate(d.date)}</td><td>${d.place}</td><td>${money(target)}</td><td>${closed?money(actual):'—'}</td><td class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</td><td>${status}</td></tr>`
  }).join('');

  if(els.cards) els.cards.innerHTML=trip.map(d=>{
    const closed=isClosed(d), actual=closed?sumObj(actualFor(d)):null, target=sumObj(d.target), savings=closed?actualSavings(d):plannedSavings(d);
    const status=closed?(actual<=target?'<span class="status done">Cerrado</span>':'<span class="status over">Sobre objetivo</span>'):'<span class="status pending">Pendiente</span>';
    return `<article class="trip-card"><div class="trip-card-head"><div><strong>${formatDate(d.date)} · ${d.place}</strong><small>${closed?'Gasto real registrado':'Aún sin cerrar'}</small></div>${status}</div><div class="trip-card-stats"><div class="trip-card-stat"><span>Objetivo</span><b>${money(target)}</b></div><div class="trip-card-stat"><span>Real</span><b>${closed?money(actual):'—'}</b></div><div class="trip-card-stat"><span>${closed?'Ahorro':'Ahorro estimado'}</span><b class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</b></div></div></article>`;
  }).join('');
}

function resetData(){
  if(!confirm('¿Borrar todos los gastos reales guardados en este dispositivo?')) return;
  saved={};persist();currentIndex=0;els.daySelect.value='0';renderAll();els.saveMessage.textContent='Datos reiniciados.';
}

init();
