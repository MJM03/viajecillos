// Proyección de ahorro basada en referencias de mercado consultadas el 06-09-2026.
// Airbnb: promedio de septiembre por destino/tipo comparable. Se añade 15% para aproximar tasas/cargos.
// Alimentación: compra de mercado para 6 personas, usando precios minoristas recientes de Perú como referencia.
const MARKET_HOTEL_BY_DATE={
 '2026-09-06':125.35, // Huaraz: S/109 + 15%
 '2026-09-07':108.10, // Chimbote: S/94 + 15%
 '2026-09-08':108.10,
 '2026-09-09':142.60, // Chiclayo/Pimentel apto.: S/124 + 15%
 '2026-09-10':142.60,
 '2026-09-11':142.60,
 '2026-09-12':135.70, // Piura familiar: S/118 + 15%
 '2026-09-13':135.70,
 '2026-09-14':135.70,
 '2026-09-15':135.70,
 '2026-09-16':77.05,  // Sullana: S/67 + 15%
 '2026-09-17':100.05, // Tumbes: S/87 + 15%
 '2026-09-18':100.05
};
const MARKET_FOOD_BY_DATE={
 '2026-09-05':108,'2026-09-06':108,'2026-09-07':108,'2026-09-08':105,
 '2026-09-09':105,'2026-09-10':105,'2026-09-11':105,'2026-09-12':108,
 '2026-09-13':108,'2026-09-14':108,'2026-09-15':108,'2026-09-16':105,
 '2026-09-17':110,'2026-09-18':110
};
function marketDayEstimate(d){
 const t=d.target||{}, hotel=MARKET_HOTEL_BY_DATE[d.date]??Number(t.hotel)||0, food=MARKET_FOOD_BY_DATE[d.date]??Number(t.food)||0;
 return (Number(t.transport)||0)+hotel+food+(Number(t.mobility)||0);
}
function marketProjection(){
 const gross=sumTrip('gross');
 const spent=trip.reduce((total,d)=>{
   const actual=actualTotalWithExtras(d);
   if(isClosed(d))return total+actual;
   const estimate=marketDayEstimate(d);
   return total+(hasAnyProgress(d)?Math.max(actual,estimate):estimate);
 },0);
 return {spent,savings:gross-spent};
}
const renderDashboardBeforeMarket=renderDashboard;
renderDashboard=function(){
 renderDashboardBeforeMarket();
 const p=marketProjection();
 if($('maxProjectedSavings'))$('maxProjectedSavings').textContent=money(p.savings);
 if($('maxProjectedSavingsPerson'))$('maxProjectedSavingsPerson').textContent=`${money(p.savings/PEOPLE)} por persona · Airbnb + mercado`;
 if($('marketProjectionBasis'))$('marketProjectionBasis').textContent='Precios de mercado por destino · se reemplaza por gasto real al cerrar cada día';
};
renderDashboard();