(() => {
  const HOTEL_DAILY = 420;
  const FOOD_DAILY = 300;

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

  const previousRenderDay = renderDay;
  renderDay = function () {
    previousRenderDay();
    const d = trip[currentIndex];
    if (!d) return;

    const hotelDays = daysFor(d, 'hotel', HOTEL_DAILY);
    const foodDays = daysFor(d, 'food', FOOD_DAILY);

    if (els.hints?.hotel) {
      els.hints.hotel.textContent = `${hotelDays} ${plural(hotelDays)} × ${money(HOTEL_DAILY)} · Presupuesto ${money(d.gross.hotel)}`;
    }
    if (els.hints?.food) {
      els.hints.food.textContent = `${foodDays} ${plural(foodDays)} × ${money(FOOD_DAILY)} · Presupuesto ${money(d.gross.food)}`;
    }

    if (els.dayMeta) {
      const old = els.dayMeta.querySelector('.daily-budget-breakdown');
      if (old) old.remove();
      const box = document.createElement('div');
      box.className = 'daily-budget-breakdown';
      box.innerHTML = `<b>Presupuesto diario</b><span>🏨 ${budgetLine(d,'hotel',HOTEL_DAILY,'Hospedaje')}</span><span>🍽️ ${budgetLine(d,'food',FOOD_DAILY,'Alimentación')}</span>`;
      els.dayMeta.appendChild(box);
    }
  };

  renderTable = function () {
    const progressFor = d => typeof hasAnyProgress === 'function' ? hasAnyProgress(d) : hasProgress(d);
    const actualForRow = d => typeof actualTotalWithExtras === 'function' ? actualTotalWithExtras(d) : sumObj(actualFor(d));

    if (els.table) {
      els.table.innerHTML = trip.map(d => {
        const progress = progressFor(d);
        const actual = progress ? actualForRow(d) : null;
        const target = sumObj(d.target);
        const savings = progress ? sumObj(d.gross) - actual : sumObj(d.gross) - target;
        const hDays = daysFor(d,'hotel',HOTEL_DAILY);
        const fDays = daysFor(d,'food',FOOD_DAILY);
        return `<tr>
          <td>${formatDate(d.date)}</td>
          <td>${d.place}</td>
          <td><b>${money(HOTEL_DAILY)}/día</b><br><small>${hDays} ${plural(hDays)} = ${money(d.gross.hotel)}</small></td>
          <td><b>${money(FOOD_DAILY)}/día</b><br><small>${fDays} ${plural(fDays)} = ${money(d.gross.food)}</small></td>
          <td>${money(d.gross.transport)}</td>
          <td>${money(d.gross.mobility)}</td>
          <td><b>${money(sumObj(d.gross))}</b></td>
          <td class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</td>
        </tr>`;
      }).join('');
    }

    if (els.cards) {
      els.cards.innerHTML = trip.map(d => {
        const closed = isClosed(d), progress = progressFor(d), actual = progress ? actualForRow(d) : null;
        const target = sumObj(d.target);
        const savings = progress ? sumObj(d.gross)-actual : sumObj(d.gross)-target;
        const hDays = daysFor(d,'hotel',HOTEL_DAILY);
        const fDays = daysFor(d,'food',FOOD_DAILY);
        let status='<span class="status pending">Pendiente</span>';
        if(progress&&!closed)status='<span class="status progress">En curso</span>';
        if(closed)status=actual<=sumObj(d.gross)?'<span class="status done">Cerrado</span>':'<span class="status over">Sobre presupuesto</span>';
        return `<article class="trip-card">
          <div class="trip-card-head"><div><strong>${formatDate(d.date)} · ${d.place}</strong><small>Presupuesto asignado ${money(sumObj(d.gross))}</small></div>${status}</div>
          <div class="trip-card-stats">
            <div class="trip-card-stat"><span>🏨 Hospedaje</span><b>${money(HOTEL_DAILY)}/día</b><small>${hDays} ${plural(hDays)} · ${money(d.gross.hotel)}</small></div>
            <div class="trip-card-stat"><span>🍽️ Alimentación</span><b>${money(FOOD_DAILY)}/día</b><small>${fDays} ${plural(fDays)} · ${money(d.gross.food)}</small></div>
            <div class="trip-card-stat"><span>${progress?'Ahorro actual':'Ahorro estimado'}</span><b class="${savings>=0?'money-good':'money-bad'}">${money(savings)}</b><small>Transp. ${money(d.gross.transport)} · Mov. ${money(d.gross.mobility)}</small></div>
          </div>
        </article>`;
      }).join('');
    }
  };

  renderDay();
  renderTable();
})();