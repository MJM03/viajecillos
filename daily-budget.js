(() => {
  const HOTEL_DAILY = 420;
  const FOOD_DAILY = 300;
  const weekday = iso => new Intl.DateTimeFormat('es-PE',{weekday:'short',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`)).replace('.','');
  const dayNumber = iso => new Intl.DateTimeFormat('es-PE',{day:'2-digit',timeZone:'UTC'}).format(new Date(`${iso}T00:00:00Z`));

  const daysFor = (day, key, daily) => {
    const total = Number(day.gross?.[key]) || 0;
    if (!total || !daily) return 0;
    return Math.max(1, Math.round(total / daily));
  };

  const plural = n => n === 1 ? 'día' : 'días';
  const budgetLine = (day, key, daily, label) => {
    const days = daysFor(day, key, daily);
    const total = Number(day.gross?.[key]) || 0;
    return `${label}: ${days} ${plural(days)} × ${money(daily)} = ${money(total)}`;
  };

  function goToRegister(index){
    currentIndex=index;
    if(els.daySelect) els.daySelect.value=String(index);
    renderDay();
    if(typeof showScreen==='function') showScreen('registrar');
  }

  const previousRenderDay = renderDay;
  renderDay = function () {
    previousRenderDay();
    const d = trip[currentIndex];
    if (!d) return;

    const hotelDays = daysFor(d, 'hotel', HOTEL_DAILY);
    const foodDays = daysFor(d, 'food', FOOD_DAILY);

    if (els.hints?.hotel) els.hints.hotel.textContent = `${hotelDays} ${plural(hotelDays)} · Presupuesto ${money(d.gross.hotel)}`;
    if (els.hints?.food) els.hints.food.textContent = `${foodDays} ${plural(foodDays)} · Presupuesto ${money(d.gross.food)}`;

    if (els.dayMeta) {
      const old = els.dayMeta.querySelector('.daily-budget-breakdown');
      if (old) old.remove();
      const box = document.createElement('div');
      box.className = 'daily-budget-breakdown';
      box.innerHTML = `<b>Presupuesto del día</b><span>🏨 ${budgetLine(d,'hotel',HOTEL_DAILY,'Hospedaje')}</span><span>🍽️ ${budgetLine(d,'food',FOOD_DAILY,'Alimentación')}</span>`;
      els.dayMeta.appendChild(box);
    }
  };

  renderTable = function () {
    const progressFor = d => typeof hasAnyProgress === 'function' ? hasAnyProgress(d) : hasProgress(d);
    const actualForRow = d => typeof actualTotalWithExtras === 'function' ? actualTotalWithExtras(d) : sumObj(actualFor(d));

    if (els.table) {
      els.table.innerHTML = trip.map(d => {
        const progress = progressFor(d), actual = progress ? actualForRow(d) : null, target = sumObj(d.target);
        const savings = progress ? sumObj(d.gross) - actual : sumObj(d.gross) - target;
        const hDays = daysFor(d,'hotel',HOTEL_DAILY), fDays = daysFor(d,'food',FOOD_DAILY);
        return `<tr><td>${formatDate(d.date)}</td><td>${d.place}</td><td><b>${money(d.gross.hotel)}</b><br><small>${hDays} ${plural(hDays)}</small></td><td><b>${money(d.gross.food)}</b><br><small>${fDays} ${plural(fDays)}</small></td><td>${money(d.gross.transport)}</td><td>${money(d.gross.mobility)}</td><td><b>${money(sumObj(d.gross))}</b></td><td class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</td></tr>`;
      }).join('');
    }

    if (els.cards) {
      els.cards.innerHTML = trip.map((d,i) => {
        const closed = isClosed(d), progress = progressFor(d), actual = progress ? actualForRow(d) : null, target = sumObj(d.target);
        const savings = progress ? sumObj(d.gross)-actual : sumObj(d.gross)-target;
        const hDays = daysFor(d,'hotel',HOTEL_DAILY), fDays = daysFor(d,'food',FOOD_DAILY);
        let status='<span class="status pending">Pendiente</span>';
        if(progress&&!closed)status='<span class="status progress">En curso</span>';
        if(closed)status=actual<=sumObj(d.gross)?'<span class="status done">Completado</span>':'<span class="status over">Sobre presupuesto</span>';
        return `<article class="trip-card">
          <div class="trip-card-head">
            <div class="trip-card-title"><div class="date-badge"><span>${weekday(d.date)}</span><b>${dayNumber(d.date)}</b><small>sep</small></div><div class="trip-card-copy"><strong>${d.place}</strong><small>${d.place.toLowerCase().includes('traslado')||d.place.toLowerCase().includes('salida')||d.place.toLowerCase().includes('retorno')?'📍 Traslado':'📍 '+(d.place.split('—')[0]||'Destino').trim()}</small></div></div>${status}
          </div>
          <div class="trip-card-stats">
            <div class="trip-card-stat transport"><span>🚌 Transporte</span><b>${money(d.gross.transport)}</b><small>${d.gross.transport?'Asignado':'Sin pasaje'}</small></div>
            <div class="trip-card-stat food"><span>🍽 Alimentación</span><b>${money(d.gross.food)}</b><small>${fDays} ${plural(fDays)}</small></div>
            <div class="trip-card-stat hotel"><span>🛏 Hospedaje</span><b>${money(d.gross.hotel)}</b><small>${hDays} ${plural(hDays)}</small></div>
            <div class="trip-card-stat total"><span>Total del día</span><b>${money(sumObj(d.gross))}</b><small>Mov. ${money(d.gross.mobility)}</small></div>
          </div>
          <div class="trip-card-footer"><div class="trip-card-savings">${progress?'Ahorro actual':'Ahorro estimado'}: <b class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</b>${progress?` · Gastado ${money(actual)}`:''}</div><button class="trip-card-action" type="button" data-register-day="${i}">${closed?'Ver / corregir':'＋ Registrar gasto'}</button></div>
        </article>`;
      }).join('');
      els.cards.querySelectorAll('[data-register-day]').forEach(btn=>btn.addEventListener('click',()=>goToRegister(Number(btn.dataset.registerDay))));
    }
  };

  renderDay();
  renderTable();
})();