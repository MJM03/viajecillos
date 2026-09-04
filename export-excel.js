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
    K53: {description:'Sullana', city:'Piura'},
    T40: {description:'Costamar Plaza Tumbes', city:'Tumbes'}
  };

  const sectionColors = {
    transport: 'D9EAF7',
    hotel: 'E2F0D9',
    food: 'FFF2CC',
    mobility: 'FCE4D6'
  };

  function codeFor(day) {
    const parts = day.place.split('—');
    return (parts[1] || '').trim();
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
    if (opts.bold) cell.font = { ...(cell.font || {}), bold: true, color: opts.fontColor ? {argb: opts.fontColor} : undefined, size: opts.fontSize };
    if (opts.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } };
    if (opts.align) cell.alignment = { vertical:'middle', horizontal:opts.align, wrapText:true };
    if (opts.border !== false) {
      const side = { style:'thin', color:{argb:'D9E2F3'} };
      cell.border = { top:side, left:side, bottom:side, right:side };
    }
  }

  async function buildWorkbook() {
    if (typeof ExcelJS === 'undefined') throw new Error('No se pudo cargar el generador de Excel.');

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Viajecillos';
    wb.created = new Date();
    wb.calcProperties.fullCalcOnLoad = true;

    const ws = wb.addWorksheet('V1 OPTIMIZADA', {views:[{state:'frozen', ySplit:3, xSplit:4}]});

    ws.mergeCells('A1:AB1');
    ws.getCell('A1').value = 'LÍDER 2 — VIÁTICOS OPTIMIZADOS';
    styleCell(ws.getCell('A1'), {fill:'1F4E78', bold:true, fontColor:'FFFFFFFF', fontSize:15, align:'center'});
    ws.getRow(1).height = 26;

    const sections = [
      ['A2:D2','Datos de tienda','D9E2F3'],
      ['E2:J2','Transporte',sectionColors.transport],
      ['K2:P2','Hospedaje',sectionColors.hotel],
      ['Q2:V2','Alimentación',sectionColors.food],
      ['W2:AB2','Movilidad',sectionColors.mobility]
    ];
    for (const [range, label, fill] of sections) {
      ws.mergeCells(range);
      const c = ws.getCell(range.split(':')[0]);
      c.value = label;
      styleCell(c,{fill,bold:true,align:'center'});
    }

    const headers = ['Fecha','Tienda','Descripción','Ciudad'];
    for (let i=0;i<4;i++) ws.getCell(3,i+1).value = headers[i];
    const blockHeaders = ['Presupuesto','IGV','Libre','Persona','Grupo','Ahorro'];
    [5,11,17,23].forEach(start => blockHeaders.forEach((h,i)=> ws.getCell(3,start+i).value=h));
    for (let col=1;col<=28;col++) styleCell(ws.getCell(3,col),{fill:'D9E2F3',bold:true,align:'center'});

    const blocks = [
      {key:'transport', start:5},
      {key:'hotel', start:11},
      {key:'food', start:17},
      {key:'mobility', start:23}
    ];

    trip.forEach((day, idx) => {
      const r = 4 + idx;
      const code = codeFor(day);
      const info = meta[code] || {description:day.place.split('—')[0].trim(), city:''};
      ws.getCell(r,1).value = new Date(`${day.date}T00:00:00Z`);
      ws.getCell(r,1).numFmt = 'dd/mm/yyyy';
      ws.getCell(r,2).value = code;
      ws.getCell(r,3).value = info.description;
      ws.getCell(r,4).value = info.city;

      blocks.forEach(({key,start}) => {
        const gross = Number(day.gross[key]) || 0;
        const group = groupValue(day,key);
        ws.getCell(r,start).value = gross;
        ws.getCell(r,start+1).value = {formula:`${ws.getCell(r,start).address}*18%`};
        ws.getCell(r,start+2).value = {formula:`${ws.getCell(r,start).address}-${ws.getCell(r,start+1).address}`};
        ws.getCell(r,start+3).value = {formula:`${ws.getCell(r,start+4).address}/6`};
        ws.getCell(r,start+4).value = group;
        ws.getCell(r,start+5).value = {formula:`${ws.getCell(r,start+2).address}-${ws.getCell(r,start+4).address}`};
      });

      for (let c=1;c<=28;c++) {
        styleCell(ws.getCell(r,c),{align:c<=4?'left':'right'});
        if (c>=5) ws.getCell(r,c).numFmt = 'S/ #,##0.00';
      }
    });

    const totalRow = 16;
    ws.getCell(totalRow,1).value = 'TOTALES';
    styleCell(ws.getCell(totalRow,1),{fill:'D9E2F3',bold:true,align:'left'});
    for (let c=5;c<=28;c++) {
      const letter = ws.getColumn(c).letter;
      ws.getCell(totalRow,c).value = {formula:`SUM(${letter}4:${letter}14)`};
      ws.getCell(totalRow,c).numFmt = 'S/ #,##0.00';
      styleCell(ws.getCell(totalRow,c),{fill:'EAF2F8',bold:true,align:'right'});
    }

    ws.getCell('A18').value = 'Resumen';
    styleCell(ws.getCell('A18'),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'left'});
    ws.mergeCells('D18:F18');
    ws.getCell('D18').value = 'AHORRO TOTAL PROYECTADO / REGISTRADO';
    styleCell(ws.getCell('D18'),{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'});

    ws.getCell('A19').value='Presupuesto bruto';
    ws.getCell('B19').value={formula:'SUM(E16,K16,Q16,W16)'};
    ws.getCell('A20').value='IGV total';
    ws.getCell('B20').value={formula:'SUM(F16,L16,R16,X16)'};
    ws.getCell('A21').value='Disponible / Libre';
    ws.getCell('B21').value={formula:'SUM(G16,M16,S16,Y16)'};
    ws.getCell('A22').value='Gastos extra registrados';
    ws.getCell('B22').value=extrasAmount();

    ws.mergeCells('D19:E19'); ws.getCell('D19').value='Ahorro total del grupo';
    ws.getCell('F19').value={formula:'SUM(J16,P16,V16,AB16)-B22'};
    ws.mergeCells('D20:E20'); ws.getCell('D20').value='Ahorro total por persona';
    ws.getCell('F20').value={formula:'F19/6'};
    ws.mergeCells('D21:E21'); ws.getCell('D21').value='Gasto total proyectado / registrado';
    ws.getCell('F21').value={formula:'B21-F19'};

    ['A19','A20','A21','A22','D19','D20','D21'].forEach(a=>styleCell(ws.getCell(a),{bold:true,fill:'EAF2F8',align:'left'}));
    ['B19','B20','B21','B22','F19','F20','F21'].forEach(a=>{ws.getCell(a).numFmt='S/ #,##0.00';styleCell(ws.getCell(a),{bold:true,align:'right'});});

    ws.mergeCells('A24:F24');
    ws.getCell('A24').value='Grupo usa el gasto real guardado cuando existe; si aún no hay registro, usa la proyección vigente de la app. Los gastos extra se descuentan del ahorro final.';
    styleCell(ws.getCell('A24'),{fill:'FFF2CC',align:'left'});
    ws.getRow(24).height=34;

    const widths = [13,10,28,14];
    widths.forEach((w,i)=>ws.getColumn(i+1).width=w);
    for (let c=5;c<=28;c++) ws.getColumn(c).width=13;
    for (let r=2;r<=24;r++) if (!ws.getRow(r).height) ws.getRow(r).height=20;

    const extraWs = wb.addWorksheet('GASTOS EXTRA');
    extraWs.columns = [
      {header:'Fecha', key:'date', width:14},
      {header:'Destino', key:'place', width:32},
      {header:'Descripción', key:'description', width:38},
      {header:'Monto', key:'amount', width:14}
    ];
    extraWs.getRow(1).eachCell(c=>styleCell(c,{fill:'1F4E78',bold:true,fontColor:'FFFFFFFF',align:'center'}));
    let extraCount=0;
    if (typeof extraSaved !== 'undefined') {
      trip.forEach(day => {
        const list = Array.isArray(extraSaved[day.date]) ? extraSaved[day.date] : [];
        list.forEach(x => {
          extraWs.addRow({date:new Date(`${day.date}T00:00:00Z`),place:day.place,description:x.description||'Gasto extra',amount:Number(x.amount)||0});
          extraCount++;
        });
      });
    }
    if (!extraCount) extraWs.addRow({description:'Sin gastos extra registrados',amount:0});
    for (let r=2;r<=extraWs.rowCount;r++) {
      extraWs.getCell(r,1).numFmt='dd/mm/yyyy';
      extraWs.getCell(r,4).numFmt='S/ #,##0.00';
      for(let c=1;c<=4;c++) styleCell(extraWs.getCell(r,c),{align:c===4?'right':'left'});
    }

    return wb;
  }

  async function downloadExcel() {
    const oldText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Generando…';
    try {
      const wb = await buildWorkbook();
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Viajecillos_Lider_2_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 1500);
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el Excel. Revisa tu conexión e inténtalo nuevamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    await downloadExcel();
  }, true);
})();