(() => {
  const btn=document.getElementById('resetBtn');
  if(!btn)return;
  btn.textContent='Abrir Excel';
  btn.setAttribute('aria-label','Abrir Excel de viáticos en una nueva pestaña');

  const meta={K67:{description:'Huaraz',city:'Huaraz'},B50:{description:'MegaPlaza Chimbote',city:'Chimbote'},K46:{description:'Chimbote',city:'Chimbote'},B77:{description:'Metro Balta Chiclayo',city:'Chiclayo'},K24:{description:'Real Plaza Chiclayo',city:'Chiclayo'},T81:{description:'MALL AVENTURA CHICLAYO',city:'Chiclayo'},B25:{description:'Real Plaza Piura',city:'Piura'},K21:{description:'Plaza del Sol Piura',city:'Piura'},T96:{description:'Plaza de la Luna',city:'Piura'},K53:{description:'Sullana',city:'Sullana'},T40:{description:'Costamar Plaza Tumbes',city:'Tumbes'}};
  const colors={transport:'D9EAF7',hotel:'E2F0D9',food:'FFF2CC',mobility:'FCE4D6',app:'EDE9FE'};

  function codeFor(day){const p=day.place.split('—');const c=(p[1]||'').trim().split('/')[0].trim();return /^[A-Z]\d+$/i.test(c)?c:'TRASLADO'}
  function infoFor(day){const c=codeFor(day);if(meta[c])return meta[c];if(day.place.includes('Lima → Huaraz'))return{description:'Salida Lima → Huaraz',city:'Huaraz'};if(day.place.includes('Huaraz → Chimbote'))return{description:'Traslado Huaraz → Chimbote',city:'Chimbote'};if(day.place.includes('Tumbes → Lima'))return{description:'Retorno Tumbes → Lima',city:'Lima'};return{description:day.place,city:''}}
  function hasSaved(day){return Boolean(saved?.[day.date]?.actual)}
  function stateFor(day){if(saved?.[day.date]?.closed)return'Cerrado';if(hasSaved(day))return'En curso';return'Pendiente'}
  function groupValue(day,key){const a=saved?.[day.date]?.actual;if(a&&Number.isFinite(Number(a[key])))return Number(a[key]);return Number(day.target[key])||0}
  function extraListFor(day){return typeof extraSaved!=='undefined'&&Array.isArray(extraSaved[day.date])?extraSaved[day.date]:[]}
  function extraTotalFor(day){return extraListFor(day).reduce((s,x)=>s+(Number(x?.amount)||0),0)}
  function extrasAmount(){return trip.reduce((s,d)=>s+extraTotalFor(d),0)}
  function actualTotalFor(day){return hasSaved(day)?['transport','hotel','food','mobility'].reduce((s,k)=>s+(Number(saved[day.date].actual?.[k])||0),0)+extraTotalFor(day):0}
  function styleCell(cell,o={}){if(o.bold)cell.font={...(cell.font||{}),bold:true,color:o.fontColor?{argb:o.fontColor}:undefined,size:o.fontSize};if(o.fill)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:o.fill}};if(o.align)cell.alignment={vertical:'middle',horizontal:o.align,wrapText:true};if(o.border!==false){const s={style:'thin',color:{argb:'D9E2F3'}};cell.border={top:s,left:s,bottom:s,right:s}}}

  async function buildWorkbook(){
    if(typeof ExcelJS==='undefined')throw new Error('No se pudo cargar el generador de Excel.');
    const wb=new ExcelJS.Workbook();wb.creator='Viajecillos';wb.created=new Date();
    const ws=wb.addWorksheet('V1 OPTIMIZADA',{views:[{state:'frozen',ySplit:3,xSplit:4}]});
    ws.mergeCells('A1:AF1');ws.getCell('A1').value='LÍDER 2 — VIÁTICOS OPTIMIZADOS (DATOS DE LA APP)';styleCell(ws.getCell('A1'),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',fontSize:15,align:'center'});ws.getRow(1).height=26;
    const sections=[['A2:D2','Datos del día','D9E2F3'],['E2:J2','Transporte',colors.transport],['K2:P2','Hospedaje',colors.hotel],['Q2:V2','Alimentación',colors.food],['W2:AB2','Movilidad',colors.mobility],['AC2:AF2','Datos guardados en la app',colors.app]];
    sections.forEach(([range,label,fill])=>{ws.mergeCells(range);const c=ws.getCell(range.split(':')[0]);c.value=label;styleCell(c,{fill,bold:true,align:'center'})});
    ['Fecha','Tienda','Descripción','Ciudad'].forEach((h,i)=>ws.getCell(3,i+1).value=h);
    const blockHeaders=['Presupuesto','IGV','Libre','Persona','Grupo','Ahorro'];[5,11,17,23].forEach(start=>blockHeaders.forEach((h,i)=>ws.getCell(3,start+i).value=h));
    ['Estado','Extras','Total registrado','Actualizado'].forEach((h,i)=>ws.getCell(3,29+i).value=h);
    for(let c=1;c<=32;c++)styleCell(ws.getCell(3,c),{fill:'D9E2F3',bold:true,align:'center'});
    const blocks=[{key:'transport',start:5},{key:'hotel',start:11},{key:'food',start:17},{key:'mobility',start:23}];
    trip.forEach((day,idx)=>{
      const r=4+idx,info=infoFor(day),savedDay=hasSaved(day);
      ws.getCell(r,1).value=new Date(`${day.date}T00:00:00Z`);ws.getCell(r,1).numFmt='dd/mm/yyyy';ws.getCell(r,2).value=codeFor(day);ws.getCell(r,3).value=info.description;ws.getCell(r,4).value=info.city;
      blocks.forEach(({key,start})=>{
        const gross=Number(day.gross[key])||0,igv=Math.round(gross*.18*100)/100,free=Math.round((gross-igv)*100)/100,group=groupValue(day,key),person=Math.round(group/6*100)/100,savings=Math.round((gross-group)*100)/100;
        ws.getCell(r,start).value=gross;ws.getCell(r,start+1).value=igv;ws.getCell(r,start+2).value=free;ws.getCell(r,start+3).value=person;ws.getCell(r,start+4).value=group;ws.getCell(r,start+5).value=savings;
        ws.getCell(r,start+4).note=savedDay?'Dato real guardado en Viajecillos.':'Meta/proyección porque aún no hay gasto guardado para este día.';
      });
      ws.getCell(r,29).value=stateFor(day);ws.getCell(r,30).value=extraTotalFor(day);ws.getCell(r,31).value=actualTotalFor(day);ws.getCell(r,32).value=saved?.[day.date]?.updatedAt?new Date(saved[day.date].updatedAt):'';
      for(let c=1;c<=32;c++){styleCell(ws.getCell(r,c),{align:c<=4||c===29||c===32?'left':'right'});if((c>=5&&c<=31)&&c!==29)ws.getCell(r,c).numFmt='S/ #,##0.00'}ws.getCell(r,32).numFmt='dd/mm/yyyy hh:mm';
    });
    const first=4,last=first+trip.length-1,total=last+2;ws.getCell(total,1).value='TOTALES';styleCell(ws.getCell(total,1),{fill:'D9E2F3',bold:true,align:'left'});
    for(let c=5;c<=31;c++){if(c===29)continue;let sum=0;for(let r=first;r<=last;r++)sum+=Number(ws.getCell(r,c).value)||0;ws.getCell(total,c).value=Math.round(sum*100)/100;ws.getCell(total,c).numFmt='S/ #,##0.00';styleCell(ws.getCell(total,c),{fill:'EAF2F8',bold:true,align:'right'})}
    const sr=total+2;ws.getCell(sr,1).value='Resumen';styleCell(ws.getCell(sr,1),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'left'});ws.mergeCells(sr,4,sr,6);ws.getCell(sr,4).value='AHORRO TOTAL PROYECTADO / REGISTRADO';styleCell(ws.getCell(sr,4),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'});
    const r1=sr+1,r2=sr+2,r3=sr+3,r4=sr+4,grossTotal=[5,11,17,23].reduce((s,c)=>s+(Number(ws.getCell(total,c).value)||0),0),igvTotal=[6,12,18,24].reduce((s,c)=>s+(Number(ws.getCell(total,c).value)||0),0),freeTotal=[7,13,19,25].reduce((s,c)=>s+(Number(ws.getCell(total,c).value)||0),0),savingsBeforeExtras=[10,16,22,28].reduce((s,c)=>s+(Number(ws.getCell(total,c).value)||0),0),extras=extrasAmount(),savingsTotal=Math.round((savingsBeforeExtras-extras)*100)/100,spentTotal=Math.round((grossTotal-savingsTotal)*100)/100;
    ws.getCell(r1,1).value='Presupuesto bruto';ws.getCell(r1,2).value=grossTotal;ws.getCell(r2,1).value='IGV total';ws.getCell(r2,2).value=igvTotal;ws.getCell(r3,1).value='Disponible / Libre';ws.getCell(r3,2).value=freeTotal;ws.getCell(r4,1).value='Gastos extra registrados';ws.getCell(r4,2).value=extras;
    ws.mergeCells(r1,4,r1,5);ws.getCell(r1,4).value='Ahorro total del grupo';ws.getCell(r1,6).value=savingsTotal;ws.mergeCells(r2,4,r2,5);ws.getCell(r2,4).value='Ahorro total por persona';ws.getCell(r2,6).value=Math.round(savingsTotal/6*100)/100;ws.mergeCells(r3,4,r3,5);ws.getCell(r3,4).value='Gasto total proyectado / registrado';ws.getCell(r3,6).value=spentTotal;
    [[r1,1],[r2,1],[r3,1],[r4,1],[r1,4],[r2,4],[r3,4]].forEach(([r,c])=>styleCell(ws.getCell(r,c),{bold:true,fill:'EAF2F8',align:'left'}));[[r1,2],[r2,2],[r3,2],[r4,2],[r1,6],[r2,6],[r3,6]].forEach(([r,c])=>{ws.getCell(r,c).numFmt='S/ #,##0.00';styleCell(ws.getCell(r,c),{bold:true,align:'right'})});
    const note=r4+2;ws.mergeCells(note,1,note,12);ws.getCell(note,1).value='IGV = 18% del Presupuesto. Libre = Presupuesto - IGV. Persona = Grupo / 6. Ahorro = Presupuesto - Grupo. Los gastos extra se descuentan del ahorro total.';styleCell(ws.getCell(note,1),{fill:'FFF2CC',align:'left'});ws.getRow(note).height=54;
    [13,12,34,14].forEach((w,i)=>ws.getColumn(i+1).width=w);for(let c=5;c<=28;c++)ws.getColumn(c).width=13;ws.getColumn(29).width=14;ws.getColumn(30).width=13;ws.getColumn(31).width=17;ws.getColumn(32).width=21;
    const extraWs=wb.addWorksheet('GASTOS EXTRA');extraWs.columns=[{header:'Fecha',key:'date',width:14},{header:'Destino',key:'place',width:38},{header:'Descripción',key:'description',width:38},{header:'Monto',key:'amount',width:14}];extraWs.getRow(1).eachCell(c=>styleCell(c,{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'}));let count=0;trip.forEach(day=>extraListFor(day).forEach(x=>{extraWs.addRow({date:new Date(`${day.date}T00:00:00Z`),place:day.place,description:x.description||'Gasto extra',amount:Number(x.amount)||0});count++}));if(!count)extraWs.addRow({description:'Sin gastos extra registrados',amount:0});for(let r=2;r<=extraWs.rowCount;r++){extraWs.getCell(r,1).numFmt='dd/mm/yyyy';extraWs.getCell(r,4).numFmt='S/ #,##0.00';for(let c=1;c<=4;c++)styleCell(extraWs.getCell(r,c),{align:c===4?'right':'left'})}return wb;
  }
  async function openExcel(){const old=btn.textContent;btn.disabled=true;btn.textContent='Generando…';const tab=window.open('about:blank','_blank');if(tab){tab.document.write('<title>Viajecillos — Excel</title><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:32px;color:#111827"><h2>Generando Excel…</h2><p>En unos segundos se abrirá el archivo.</p></body>');tab.document.close()}try{const wb=await buildWorkbook(),buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob);if(tab){tab.location.href=url;setTimeout(()=>URL.revokeObjectURL(url),60000)}else{const a=document.createElement('a');a.href=url;a.download=`Viajecillos_Lider_2_${new Date().toISOString().slice(0,10)}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000)}}catch(err){console.error(err);if(tab)tab.close();alert('No se pudo generar el Excel. Revisa tu conexión e inténtalo nuevamente.')}finally{btn.disabled=false;btn.textContent=old}}
  btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();await openExcel()},true);
})();