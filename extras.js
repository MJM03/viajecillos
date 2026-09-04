const EXTRA_STORAGE_KEY='viajecillos-v1-extra-expenses';

// La última hoja de Excel de Líder 2 tiene 11 filas de trabajo y no incluye
// el traslado Huaraz → Chimbote como un día independiente. Lo quitamos del
// conjunto mostrado sin alterar el formato ni la lógica de registro de la app.
const obsoleteTransferIndex=trip.findIndex(d=>d.place==='Traslado Huaraz → Chimbote');
if(obsoleteTransferIndex>=0){
  trip.splice(obsoleteTransferIndex,1);
  currentIndex=firstPendingIndex();
  if(els.daySelect){
    els.daySelect.innerHTML=trip.map((d,i)=>`<option value="${i}">${formatDate(d.date)} · ${d.place}${isClosed(d)?' ✓':hasProgress(d)?' •':''}</option>`).join('');
    els.daySelect.value=String(currentIndex);
  }
}

// El estimado base ahora sale directamente de los datos vigentes de la última hoja.
const BASELINE_PROJECTED_SPEND=sumTrip('target');
let extraSaved=loadExtraExpenses();
function loadExtraExpenses(){try{return JSON.parse(localStorage.getItem(EXTRA_STORAGE_KEY))||{}}catch{return {}}}
function persistExtraExpenses(){localStorage.setItem(EXTRA_STORAGE_KEY,JSON.stringify(extraSaved))}
function extrasFor(day){return Array.isArray(extraSaved[day.date])?extraSaved[day.date]:[]}
function extraTotal(day){return extrasFor(day).reduce((s,x)=>s+(Number(x.amount)||0),0)}
function actualTotalWithExtras(day){return sumObj(actualFor(day))+extraTotal(day)}
function hasAnyProgress(day){return hasProgress(day)||extrasFor(day).length>0}
function projectedTotalWithExtras(){
  return trip.reduce((total,d)=>{
    const target=sumObj(d.target);
    if(isClosed(d)) return total+(actualTotalWithExtras(d)-target);
    if(hasAnyProgress(d)) return total+(Math.max(target,actualTotalWithExtras(d))-target);
    return total;
  },BASELINE_PROJECTED_SPEND);
}

const originalRenderDashboard=renderDashboard;
renderDashboard=function(){
  const totalGross=sumTrip('gross'),totalNet=sumTrip('net'),closed=trip.filter(isClosed),withProgress=trip.filter(hasAnyProgress);
  const actualSpent=withProgress.reduce((s,d)=>s+actualTotalWithExtras(d),0);
  const registeredSavings=withProgress.reduce((s,d)=>s+sumObj(d.net)-actualTotalWithExtras(d),0);
  const projectedSpent=projectedTotalWithExtras();
  const projectedSavings=totalNet-projectedSpent,done=closed.length,inProgress=trip.filter(d=>hasAnyProgress(d)&&!isClosed(d)).length,usage=totalNet?projectedSpent/totalNet*100:0;
  $('realSavings').textContent=money(registeredSavings);$('realSavingsPerson').textContent=`${money(registeredSavings/PEOPLE)} por persona`;
  $('projectedSavings').textContent=money(projectedSavings);$('projectedSavingsPerson').textContent=`${money(projectedSavings/PEOPLE)} por persona`;
  $('actualSpent').textContent=money(actualSpent);$('daysDone').textContent=`${done} cerrados${inProgress?` · ${inProgress} en curso`:''}`;
  $('projectedSpent').textContent=money(projectedSpent);$('budgetUsage').textContent=`${usage.toFixed(1)}% del disponible`;
  $('grossBudgetLabel').textContent=money(totalGross);$('netBudgetLabel').textContent='Presupuesto total';$('netBudgetText').textContent=money(totalNet);$('progressBar').style.width=`${Math.max(0,Math.min(100,usage))}%`;
}

const originalRenderDaySummary=renderDaySummary;
renderDaySummary=function(){
  const d=trip[currentIndex],actual=readInputs(),target=sumObj(d.target),net=sumObj(d.net),extras=extraTotal(d),act=sumObj(actual)+extras,savings=net-act;
  $('daySummary').innerHTML=`<div class="mini-stat"><span>Gasto estimado</span><strong>${money(target)}</strong></div><div class="mini-stat"><span>Ingresado</span><strong>${money(act)}</strong>${extras?`<small> · extras ${money(extras)}</small>`:''}</div><div class="mini-stat ${act<=target?'positive':'negative'}"><span>Vs. estimado</span><strong>${act<=target?'+':''}${money(target-act)}</strong></div><div class="mini-stat ${savings>=0?'positive':'negative'}"><span>Ahorro hasta ahora</span><strong>${money(savings)}</strong><small> · ${money(savings/PEOPLE)} c/u</small></div>`;
}

const originalRenderDay=renderDay;
renderDay=function(){originalRenderDay();renderExtraExpenses()}

const originalRenderTable=renderTable;
renderTable=function(){
  els.table.innerHTML=trip.map(d=>{const closed=isClosed(d),progress=hasAnyProgress(d),actual=progress?actualTotalWithExtras(d):null,target=sumObj(d.target),savings=progress?sumObj(d.net)-actual:plannedSavings(d);let status='<span class="status pending">Pendiente</span>';if(progress&&!closed)status='<span class="status progress">En curso</span>';if(closed)status=actual<=target?'<span class="status done">Cerrado</span>':'<span class="status over">Sobre estimado</span>';return `<tr><td>${formatDate(d.date)}</td><td>${d.place}</td><td>${money(target)}</td><td>${progress?money(actual):'—'}</td><td class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</td><td>${status}</td></tr>`}).join('');
  if(els.cards)els.cards.innerHTML=trip.map(d=>{const closed=isClosed(d),progress=hasAnyProgress(d),actual=progress?actualTotalWithExtras(d):null,target=sumObj(d.target),savings=progress?sumObj(d.net)-actual:plannedSavings(d),extras=extraTotal(d);let status='<span class="status pending">Pendiente</span>';if(progress&&!closed)status='<span class="status progress">En curso</span>';if(closed)status=actual<=target?'<span class="status done">Cerrado</span>':'<span class="status over">Sobre estimado</span>';const subtitle=closed?'Día cerrado':progress?'Gastos guardados, día abierto':'Aún sin gastos registrados';return `<article class="trip-card"><div class="trip-card-head"><div><strong>${formatDate(d.date)} · ${d.place}</strong><small>${subtitle}${extras?` · Extras ${money(extras)}`:''}</small></div>${status}</div><div class="trip-card-stats"><div class="trip-card-stat"><span>Estimado</span><b>${money(target)}</b></div><div class="trip-card-stat"><span>Real</span><b>${progress?money(actual):'—'}</b></div><div class="trip-card-stat"><span>${progress?'Ahorro actual':'Ahorro estimado'}</span><b class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</b></div></div></article>`}).join('');
}

function renderExtraExpenses(){
  const d=trip[currentIndex],closed=isClosed(d),box=$('extraExpensesList');if(!box)return;
  const list=extrasFor(d);
  box.innerHTML=list.length?list.map((x,i)=>`<div class="extra-item"><div><b>${escapeHtml(x.description||'Gasto extra')}</b><small>${money(Number(x.amount)||0)}</small></div>${closed?'':`<button type="button" data-remove-extra="${i}" aria-label="Eliminar gasto">×</button>`}</div>`).join(''):'<p class="extra-empty">Todavía no hay gastos extra este día.</p>';
  $('extraDescription').disabled=closed;$('extraAmount').disabled=closed;$('addExtraBtn').disabled=closed;
  box.querySelectorAll('[data-remove-extra]').forEach(btn=>btn.addEventListener('click',()=>removeExtra(Number(btn.dataset.removeExtra))));
}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function addExtra(){const d=trip[currentIndex];if(isClosed(d))return;const description=$('extraDescription').value.trim(),amount=parseFloat($('extraAmount').value);if(!description||!Number.isFinite(amount)||amount<=0){$('extraMessage').textContent='Pon una descripción y un monto mayor a S/ 0.';return}if(!extraSaved[d.date])extraSaved[d.date]=[];extraSaved[d.date].push({description,amount,createdAt:new Date().toISOString()});persistExtraExpenses();$('extraDescription').value='';$('extraAmount').value='';$('extraMessage').textContent='Gasto extra agregado.';renderDashboard();renderDaySummary();renderTable();renderExtraExpenses()}
function removeExtra(i){const d=trip[currentIndex];extraSaved[d.date].splice(i,1);if(!extraSaved[d.date].length)delete extraSaved[d.date];persistExtraExpenses();renderDashboard();renderDaySummary();renderTable();renderExtraExpenses()}
$('addExtraBtn')?.addEventListener('click',addExtra);
$('daySelect')?.addEventListener('change',()=>setTimeout(renderExtraExpenses,0));
const originalResetData=resetData;
resetData=function(){originalResetData();extraSaved={};persistExtraExpenses();renderAll();renderExtraExpenses()}
renderDashboard();renderDay();renderDaySummary();renderTable();renderExtraExpenses();