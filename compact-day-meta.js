const renderDayBeforeCompactMeta=renderDay;
renderDay=function(){
  renderDayBeforeCompactMeta();
  const d=trip[currentIndex];
  const closed=isClosed(d);
  const progress=hasAnyProgress(d);
  const registered=progress?actualTotalWithExtras(d):0;
  const gross=sumObj(d.gross);
  const status=closed?'✓ Día cerrado':progress?'• Día en curso':'Día pendiente';
  els.dayMeta.classList.toggle('is-closed',closed);
  els.dayMeta.classList.toggle('is-progress',progress&&!closed);
  els.dayMeta.innerHTML=`<div class="day-meta-compact"><strong>${status}</strong><span>Presupuesto ${money(gross)}</span><span>Registrado ${progress?money(registered):'—'}</span></div>`;
};

function resetCurrentDay(){
  const d=trip[currentIndex];
  const hadMainProgress=Boolean(saved[d.date]);
  const hadExtras=Array.isArray(extraSaved[d.date])&&extraSaved[d.date].length>0;

  if(!hadMainProgress&&!hadExtras){
    els.saveMessage.textContent='Este día ya está vacío y pendiente.';
    return;
  }

  const ok=window.confirm(`¿Reiniciar ${formatDate(d.date)}?\n\nSe borrarán solo los gastos registrados y gastos extra de este día. Los demás días no cambiarán.`);
  if(!ok)return;

  delete saved[d.date];
  delete extraSaved[d.date];
  persist();
  persistExtraExpenses();

  if($('extraDescription'))$('extraDescription').value='';
  if($('extraAmount'))$('extraAmount').value='';
  if($('extraMessage'))$('extraMessage').textContent='';

  renderAll();
  renderExtraExpenses();
  renderExtraSummary();
  els.saveMessage.textContent='Día reiniciado. Volvió a pendiente y las proyecciones se recalcularon.';
}

function ensureResetDayButton(){
  const actions=document.querySelector('.day-actions');
  if(!actions||$('resetDayBtn'))return;
  const btn=document.createElement('button');
  btn.id='resetDayBtn';
  btn.type='button';
  btn.className='secondary-btn danger-soft';
  btn.textContent='Reiniciar día';
  btn.setAttribute('aria-label','Reiniciar únicamente el día seleccionado');
  btn.addEventListener('click',resetCurrentDay);
  actions.appendChild(btn);
}

ensureResetDayButton();
renderDay();