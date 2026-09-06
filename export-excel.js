(() => {
  const btn = document.getElementById('resetBtn');
  if (!btn) return;

  btn.textContent = 'Descargar Excel';
  btn.setAttribute('aria-label', 'Descargar Excel de viáticos');

  const meta = {
    K67: {description:'Huaraz', city:'Huaraz'},
    B50: {description:'MegaPlaza Chimbote', city:'Chimbote'},
    K46: {description:'Chimbote', city:'Chimbote'},
    B77: {description:'Metro Balta Chiclayo', city:'Chiclayo'},
    K24: {description:'Real Plaza Chiclayo', city:'Chiclayo'},
    T81: {description:'MALL AVENTURA CHICLAYO', city:'Chiclayo'},
    B25: {description:'Real Plaza Piura', city:'Piura'},
    K21: {description:'Plaza del Sol Piura', city:'Piura'},
    T96: {description:'Plaza de la Luna', city:'Piura'},
    K53: {description:'Sullana', city:'Sullana'},
    T40: {description:'Costamar Plaza Tumbes', city:'Tumbes'}
  };

  const sectionColors = {transport:'D9EAF7',hotel:'E2F0D9',food:'FFF2CC',mobility:'FCE4D6'};

  function codeFor(day) {
    const parts = day.place.split('—');
    return (parts[1] || '').trim().split('/')[0].trim();
  }
  function groupValue(day, key) {
    const progress = saved?.[day.date]?.actual;
    if (progress && Number.isFinite(Number(progress[key]))) return Number(progress[key]);
    return Number(day.target[key]) || 0;
  }
  function extrasAmount() {
    if (typeof extraSaved === 'undefined') return 0;
    return Object.values(extraSaved).flat().reduce((s, x) => s + (Number(x?.amount) || 0), 0);
  }
  function styleCell(cell, opts = {}) {
    if (opts.bold) cell.font = { ...(cell.font || {}), bold:true, color:opts.fontColor ? {argb:opts.fontColor} : undefined, size:opts.fontSize };
    if (opts.fill) cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:opts.fill}};
    if (opts.align) cell.alignment = {vertical:'middle',horizontal:opts.align,wrapText:true};
    if (opts.border !== false) {
      const side={style:'thin',color:{argb:'D9E2F3'}};
      cell.border={top:side,left:side,bottom:side,right:side};
    }
  }

  async function buildWorkbook() {
    if (typeof ExcelJS === 'undefined') throw new Error('No se pudo cargar el generador de Excel.');
    const wb=new ExcelJS.Workbook();
    wb.creator='Viajecillos'; wb.created=new Date(); wb.calcProperties.fullCalcOnLoad=true;
    const ws=wb.addWorksheet('V1 OPTIMIZADA',{views:[{state:'frozen',ySplit:3,xSplit:4}]});

    ws.mergeCells('A1:AB1');
    ws.getCell('A1').value='LÍDER 2 — VIÁTICOS OPTIMIZADOS (PRESUPUESTO DIARIO)';
    styleCell(ws.getCell('A1'),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',fontSize:15,align:'center'});
    ws.getRow(1).height=26;

    const sections=[['A2:D2','Datos del día','D9E2F3'],['E2:J2','Transporte',sectionColors.transport],['K2:P2','Hospedaje',sectionColors.hotel],['Q2:V2','Alimentación',sectionColors.food],['W2:AB2','Movilidad',sectionColors.mobility]];
    for(const [range,label,fill] of sections){ws.mergeCells(range);const c=ws.getCell(range.split(':')[0]);c.value=label;styleCell(c,{fill,bold:true,align:'center'});}

    const headers=['Fecha','Tienda','Descripción','Ciudad'];
    for(let i=0;i<4;i++) ws.getCell(3,i+1).value=headers[i];
    const blockHeaders=['Presupuesto','IGV','Libre','Persona','Grupo','Ahorro'];
    [5,11,17,23].forEach(start=>blockHeaders.forEach((h,i)=>ws.getCell(3,start+i).value=h));
    for(let col=1;col<=28;col++) styleCell(ws.getCell(3,col),{fill:'D9E2F3',bold:true,align:'center'});

    const blocks=[{key:'transport',start:5},{key:'hotel',start:11},{key:'food',start:17},{key:'mobility',start:23}];
    trip.forEach((day,idx)=>{
      const r=4+idx, code=codeFor(day);
      const info=meta[code]||{description:day.place,city:''};
      ws.getCell(r,1).value=new Date(`${day.date}T00:00:00Z`); ws.getCell(r,1).numFmt='dd/mm/yyyy';
      ws.getCell(r,2).value=code;
      ws.getCell(r,3).value=info.description;
      ws.getCell(r,4).value=info.city;
      blocks.forEach(({key,start})=>{
        const gross=Number(day.gross[key])||0, group=groupValue(day,key);
        ws.getCell(r,start).value=gross;
        ws.getCell(r,start+1).value={formula:`${ws.getCell(r,start).address}*18%`};
        ws.getCell(r,start+2).value={formula:`${ws.getCell(r,start).address}-${ws.getCell(r,start+1).address}`};
        ws.getCell(r,start+3).value={formula:`${ws.getCell(r,start+4).address}/6`};
        ws.getCell(r,start+4).value=group;
        ws.getCell(r,start+5).value={formula:`${ws.getCell(r,start+2).address}-${ws.getCell(r,start+4).address}`};
      });
      for(let c=1;c<=28;c++){styleCell(ws.getCell(r,c),{align:c<=4?'left':'right'});if(c>=5)ws.getCell(r,c).numFmt='S/ #,##0.00';}
    });

    const firstDataRow=4;
    const lastDataRow=firstDataRow+trip.length-1;
    const totalRow=lastDataRow+2;
    ws.getCell(totalRow,1).value='TOTALES';
    styleCell(ws.getCell(totalRow,1),{fill:'D9E2F3',bold:true,align:'left'});
    for(let c=5;c<=28;c++){
      const letter=ws.getColumn(c).letter;
      ws.getCell(totalRow,c).value={formula:`SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`};
      ws.getCell(totalRow,c).numFmt='S/ #,##0.00';
      styleCell(ws.getCell(totalRow,c),{fill:'EAF2F8',bold:true,align:'right'});
    }

    const summaryRow=totalRow+2;
    ws.getCell(summaryRow,1).value='Resumen';
    styleCell(ws.getCell(summaryRow,1),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'left'});
    ws.mergeCells(summaryRow,4,summaryRow,6);
    ws.getCell(summaryRow,4).value='AHORRO TOTAL PROYECTADO / REGISTRADO';
    styleCell(ws.getCell(summaryRow,4),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'});

    const r1=summaryRow+1,r2=summaryRow+2,r3=summaryRow+3,r4=summaryRow+4;
    ws.getCell(r1,1).value='Presupuesto bruto'; ws.getCell(r1,2).value={formula:`SUM(E${totalRow},K${totalRow},Q${totalRow},W${totalRow})`};
    ws.getCell(r2,1).value='IGV total'; ws.getCell(r2,2).value={formula:`SUM(F${totalRow},L${totalRow},R${totalRow},X${totalRow})`};
    ws.getCell(r3,1).value='Disponible / Libre'; ws.getCell(r3,2).value={formula:`SUM(G${totalRow},M${totalRow},S${totalRow},Y${totalRow})`};
    ws.getCell(r4,1).value='Gastos extra registrados'; ws.getCell(r4,2).value=extrasAmount();

    ws.mergeCells(r1,4,r1,5); ws.getCell(r1,4).value='Ahorro total del grupo'; ws.getCell(r1,6).value={formula:`SUM(J${totalRow},P${totalRow},V${totalRow},AB${totalRow})-B${r4}`};
    ws.mergeCells(r2,4,r2,5); ws.getCell(r2,4).value='Ahorro total por persona'; ws.getCell(r2,6).value={formula:`F${r1}/6`};
    ws.mergeCells(r3,4,r3,5); ws.getCell(r3,4).value='Gasto total proyectado / registrado'; ws.getCell(r3,6).value={formula:`B${r3}-F${r1}`};

    [[r1,1],[r2,1],[r3,1],[r4,1],[r1,4],[r2,4],[r3,4]].forEach(([r,c])=>styleCell(ws.getCell(r,c),{bold:true,fill:'EAF2F8',align:'left'}));
    [[r1,2],[r2,2],[r3,2],[r4,2],[r1,6],[r2,6],[r3,6]].forEach(([r,c])=>{ws.getCell(r,c).numFmt='S/ #,##0.00';styleCell(ws.getCell(r,c),{bold:true,align:'right'});});

    const noteRow=r4+2;
    ws.mergeCells(noteRow,1,noteRow,6);
    ws.getCell(noteRow,1).value='Cada fila corresponde a un día del viaje. Hospedaje presupuestado: S/420 por día; alimentación: S/300 por día. Grupo usa el gasto real guardado cuando existe y, si no, la meta vigente de la app.';
    styleCell(ws.getCell(noteRow,1),{fill:'FFF2CC',align:'left'}); ws.getRow(noteRow).height=42;

    [13,10,32,14].forEach((w,i)=>ws.getColumn(i+1).width=w);
    for(let c=5;c<=28;c++)ws.getColumn(c).width=13;

    const extraWs=wb.addWorksheet('GASTOS EXTRA');
    extraWs.columns=[{header:'Fecha',key:'date',width:14},{header:'Destino',key:'place',width:38},{header:'Descripción',key:'description',width:38},{header:'Monto',key:'amount',width:14}];
    extraWs.getRow(1).eachCell(c=>styleCell(c,{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'}));
    let extraCount=0;
    if(typeof extraSaved!=='undefined') trip.forEach(day=>{const list=Array.isArray(extraSaved[day.date])?extraSaved[day.date]:[];list.forEach(x=>{extraWs.addRow({date:new Date(`${day.date}T00:00:00Z`),place:day.place,description:x.description||'Gasto extra',amount:Number(x.amount)||0});extraCount++;});});
    if(!extraCount)extraWs.addRow({description:'Sin gastos extra registrados',amount:0});
    for(let r=2;r<=extraWs.rowCount;r++){extraWs.getCell(r,1).numFmt='dd/mm/yyyy';extraWs.getCell(r,4).numFmt='S/ #,##0.00';for(let c=1;c<=4;c++)styleCell(extraWs.getCell(r,c),{align:c===4?'right':'left'});}
    return wb;
  }

  async function downloadExcel(){
    const oldText=btn.textContent; btn.disabled=true; btn.textContent='Generando…';
    try{
      const wb=await buildWorkbook(),buffer=await wb.xlsx.writeBuffer();
      const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`Viajecillos_Lider_2_${new Date().toISOString().slice(0,10)}.xlsx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    }catch(err){console.error(err);alert('No se pudo generar el Excel. Revisa tu conexión e inténtalo nuevamente.');}
    finally{btn.disabled=false;btn.textContent=oldText;}
  }

  btn.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();await downloadExcel();},true);
})();