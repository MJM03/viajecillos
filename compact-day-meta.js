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
renderDay();