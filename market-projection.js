// Proyección híbrida: gasto real + precios de mercado por destino.
const MARKET_HOTEL_BY_DATE={'2026-09-06':125.35,'2026-09-07':108.10,'2026-09-08':108.10,'2026-09-09':142.60,'2026-09-10':142.60,'2026-09-11':142.60,'2026-09-12':135.70,'2026-09-13':135.70,'2026-09-14':135.70,'2026-09-15':135.70,'2026-09-16':77.05,'2026-09-17':100.05,'2026-09-18':100.05};
const MARKET_FOOD_BY_DATE={'2026-09-05':108,'2026-09-06':108,'2026-09-07':108,'2026-09-08':105,'2026-09-09':105,'2026-09-10':105,'2026-09-11':105,'2026-09-12':108,'2026-09-13':108,'2026-09-14':108,'2026-09-15':108,'2026-09-16':105,'2026-09-17':110,'2026-09-18':110};
function marketDayEstimate(d){const t=d.target||{},hotel=MARKET_HOTEL_BY_DATE[d.date]??(Number(t.hotel)||0),food=MARKET_FOOD_BY_DATE[d.date]??(Number(t.food)||0);return (Number(t.transport)||0)+hotel+food+(Number(t.mobility)||0)}
function probableProjection(){
 const gross=sumTrip('gross'),closed=trip.filter(isClosed);
 // Calibramos el mercado con la experiencia real, pero gradualmente: con pocos días no dejamos que un día atípico domine todo el viaje.
 let raw=1;
 if(closed.length){const marketClosed=closed.reduce((s,d)=>s+marketDayEstimate(d),0),actualClosed=closed.reduce((s,d)=>s+actualTotalWithExtras(d),0);if(marketClosed>0)raw=actualClosed/marketClosed}
 const confidence=Math.min(1,closed.length/5);
 const calibrated=1+(raw-1)*confidence;
 const spent=trip.reduce((total,d)=>{
   const actual=actualTotalWithExtras(d);
   if(isClosed(d))return total+actual;
   const market=marketDayEstimate(d)*calibrated;
   return total+(hasAnyProgress(d)?Math.max(actual,market):market);
 },0);
 return {spent,savings:gross-spent,factor:calibrated,days:closed.length};
}
const renderDashboardBeforeMarket=renderDashboard;
renderDashboard=function(){
 renderDashboardBeforeMarket();
 const p=probableProjection();
 if($('maxProjectedSavings'))$('maxProjectedSavings').textContent=money(p.savings);
 if($('maxProjectedSavingsPerson'))$('maxProjectedSavingsPerson').textContent=`${money(p.savings/PEOPLE)} por persona`;
 if($('marketProjectionBasis'))$('marketProjectionBasis').textContent=p.days?`Mercado + ${p.days} ${p.days===1?'día real':'días reales'} · ajuste ${(p.factor*100).toFixed(0)}%`:'Airbnb + mercado + transporte previsto';
};
renderDashboard();