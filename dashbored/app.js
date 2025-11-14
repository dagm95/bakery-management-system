// Shared small helper to render a sample Chart.js chart into canvases with class 'sample-chart'
function renderSampleBar(canvasId, labels, data, label){
  if(typeof Chart === 'undefined') return;
  const ctx = document.getElementById(canvasId).getContext('2d');
  const colors = ['rgba(59,130,246,0.9)','rgba(16,185,129,0.9)','rgba(245,158,11,0.9)','rgba(239,68,68,0.9)'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: label || 'Value',
        data: data,
        backgroundColor: labels.map((_,i)=> colors[i % colors.length]),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins:{
        legend:{display:false},
        tooltip: { callbacks: { label: ctx => `${label ? label + ': ' : ''}${Number(ctx.raw).toFixed(2)} Birr` } }
      },
      scales: { y: { beginAtZero: true } }
    }
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  // Each page uses a canvas with id pattern chart-<page>
  const chartEl = document.querySelector('canvas.sample-chart');
  if(!chartEl) return;
  const id = chartEl.id;
  const page = chartEl.dataset.page || 'sales';

  // If this is the Sales page, wire it to localStorage data (if available)
  if(page === 'sales'){
    renderSalesPage(id);
    return;
  }

  // default: generate simple sample data per page
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const randomData = () => Array.from({length:12},()=>Math.round(Math.random()*900)+100);
  switch(page){
    case 'inventory': renderInventoryPage(id); break;
    case 'employees': renderSampleBar(id, months, randomData(), 'Transactions per cashier'); break;
    case 'profits': renderSampleBar(id, months, randomData(), 'Profit (sample)'); break;
    case 'production': renderSampleBar(id, months, randomData(), 'Units produced'); break;
    case 'expenses': renderSampleBar(id, months, randomData(), 'Expenses'); break;
    case 'reports': renderSampleBar(id, months, randomData(), 'Report metric'); break;
    case 'security': renderSampleBar(id, months, randomData(), 'Events logged'); break;
    default: renderSampleBar(id, months, randomData(), 'Value');
  }
});

// --- Sales page wiring ---
function getSalesFromStorage(){
  try{
    const raw = localStorage.getItem('bakery_app_v1');
    if(!raw) return [];
    const obj = JSON.parse(raw);
    return Array.isArray(obj.sales) ? obj.sales : [];
  }catch(e){ return []; }
}

function renderSalesPage(canvasId){
  const canvas = document.getElementById(canvasId);
  const filtersWrap = document.querySelector('.filters');
  const topElId = 'topItems';
  let lastFilteredSales = [];

  const dateInput = filtersWrap ? filtersWrap.querySelector('input[type="date"]') : null;
  const selects = filtersWrap ? Array.from(filtersWrap.querySelectorAll('select')) : [];
  const cashierSelect = selects[0] || null;
  const paymentSelect = selects[1] || null;

  // element to show top items
  let topEl = document.getElementById(topElId);
  if(!topEl){
    const card = canvas.closest('.card');
    if(card){
      topEl = document.createElement('div'); topEl.id = topElId; topEl.style.marginTop = '12px'; card.appendChild(topEl);
    }
  }

  // helper to compute revenue for a sale
  const saleRevenue = s => {
    try{
      let rev = 0;
      if(Array.isArray(s.items) && s.items.length){ s.items.forEach(it => { rev += Number(it.subtotal || (it.price * it.quantity)) || 0; }); }
      else rev = Number(s.total || s.totalAmount || 0) || 0;
      return rev;
    }catch(e){ return 0; }
  };

  // render function (updates chart + top items)
  function render(){
    const allSales = getSalesFromStorage();
    // collect cashiers & payments
    const cashiers = new Set();
    const payments = new Set();
    allSales.forEach(s => { try{ if(s.cashier) cashiers.add(s.cashier); const pm = s.paymentMethod || s.payment || s.method; if(pm) payments.add(pm); }catch(e){} });

    // populate selects
    if(cashierSelect){
      const prev = cashierSelect.value;
      cashierSelect.innerHTML = '<option value="">All cashiers</option>' + Array.from(cashiers).map(c=> `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if(Array.from(cashiers).indexOf(prev) >= 0) cashierSelect.value = prev;
    }
    if(paymentSelect){
      const prev = paymentSelect.value;
      paymentSelect.innerHTML = '<option value="">All payments</option>' + Array.from(payments).map(c=> `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      if(Array.from(payments).indexOf(prev) >= 0) paymentSelect.value = prev;
    }

    // apply filters
    let filtered = allSales.slice();
    if(cashierSelect && cashierSelect.value) filtered = filtered.filter(s => (s.cashier||'') === cashierSelect.value);
    if(paymentSelect && paymentSelect.value) filtered = filtered.filter(s => { const pm = s.paymentMethod || s.payment || s.method || ''; return pm === paymentSelect.value; });
    const dateVal = dateInput && dateInput.value ? String(dateInput.value) : null;

    if(dateVal){
      // render hourly chart for selected date
      const hourMap = Array.from({length:24},()=>0);
      filtered.forEach(s => { try{ const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now()); if(d.toISOString().slice(0,10) !== dateVal) return; hourMap[d.getHours()] += saleRevenue(s); }catch(e){} });
      const labels = Array.from({length:24}, (_,i)=> i + ':00');
      const data = hourMap.map(v => Number(v.toFixed(2)));
      // draw
      drawSalesChart(canvas, labels, data, 'Revenue');
    } else {
      // render month-by-name across Jan..Dec
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const months = new Array(12).fill(0);
      filtered.forEach(s => { try{ const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now()); const m = d.getMonth(); months[m] += saleRevenue(s); }catch(e){} });
      const data = months.map(v => Number(v.toFixed(2)));
      drawSalesChart(canvas, monthNames, data, 'Revenue (Birr)');
    }

    // compute top products for the currently filtered data
    const prodMap = {};
    filtered.forEach(s => {
      try{
        if(Array.isArray(s.items)){
          s.items.forEach(it => {
            const name = it.productName || it.name || 'Unknown';
            const qty = Number(it.quantity || 0);
            const rev = Number(it.subtotal || (it.price * it.quantity)) || 0;
            const key = name;
            if(!prodMap[key]) prodMap[key] = { label: name, qty: 0, rev: 0 };
            prodMap[key].qty += qty; prodMap[key].rev += rev;
          });
        }
      }catch(e){}
    });
    const top = Object.keys(prodMap).map(k=> prodMap[k]).sort((a,b)=> b.rev - a.rev).slice(0,8);
    if(topEl){
      if(!top.length) topEl.innerHTML = '<div style="color:#666">No top items</div>';
      else topEl.innerHTML = `<h4 style="margin:8px 0">Top items</h4><div>${top.map(t => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f6fb"><div><strong>${escapeHtml(t.label)}</strong><div style="font-size:12px;color:#666">${t.qty} sold</div></div><div style="font-weight:700">${t.rev.toFixed(2)} Birr</div></div>`).join('')}</div>`;
    }
    // store filtered for export
    lastFilteredSales = filtered.slice();
  }

  // attach filter handlers
  if(filtersWrap){
    filtersWrap.addEventListener('change', ()=>{ render(); });
    const dateInputEl = filtersWrap.querySelector('input[type="date"]');
    if(dateInputEl) dateInputEl.addEventListener('change', ()=>{ render(); });
    const exportBtn = filtersWrap.querySelector('#exportCsvBtn');
    if(exportBtn){
      exportBtn.addEventListener('click', ()=>{
        try{
          // use lastFilteredSales if available
          const rows = (lastFilteredSales && lastFilteredSales.length) ? lastFilteredSales : getSalesFromStorage();
          if(!rows.length){ alert('No sales to export'); return; }
          const csv = exportSalesToCSV(rows);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const now = new Date();
          a.download = `sales_export_${now.toISOString().slice(0,10)}.csv`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }catch(e){ console.error(e); alert('Export failed'); }
      });
    }
  }

  // initial render
  render();
}

function drawSalesChart(canvas, labels, data, label){
  try{
    if(window.salesChartInstance && typeof window.salesChartInstance.destroy === 'function'){ try{ window.salesChartInstance.destroy(); }catch(e){} window.salesChartInstance = null; }
    if(typeof Chart === 'undefined' || !canvas) return;
    const ctx = canvas.getContext('2d');
    const bg = labels.map((_,i)=> ['rgba(59,130,246,0.95)','rgba(16,185,129,0.95)','rgba(245,158,11,0.95)','rgba(239,68,68,0.95)'][i%4]);
    window.salesChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: [{ label: label, data: data, backgroundColor: bg, borderRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${label ? label + ': ' : ''}${Number(ctx.raw).toFixed(2)} Birr` } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => Number(v).toFixed(2) } } } }
    });
  }catch(e){ console.error(e); }
}

// small helper to escape text for option/html insertion
function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// Export sales rows (array) to CSV string
function exportSalesToCSV(rows){
  const cols = ['saleDate','cashier','paymentMethod','total','items'];
  const lines = [];
  lines.push(cols.join(','));
  rows.forEach(r => {
    try{
      const saleDate = r.saleDate || r.timestamp || r.ts || '';
      const cashier = (r.cashier||'').toString().replace(/"/g,'""');
      const pm = (r.paymentMethod || r.payment || r.method || '').toString().replace(/"/g,'""');
      const total = Number(r.total || r.totalAmount || (Array.isArray(r.items)? r.items.reduce((a,b)=> a + (Number(b.subtotal || (b.price*b.quantity))||0),0):0) ) || 0;
      const items = Array.isArray(r.items) ? r.items.map(it=> `${(it.productName||it.name||'').toString()} x${Number(it.quantity||0)}`).join('; ') : '';
      const row = [`"${saleDate}"`,`"${cashier}"`,`"${pm}"`,`"${total.toFixed(2)}"`,`"${items.replace(/"/g,'""')}"`];
      lines.push(row.join(','));
    }catch(e){}
  });
  return lines.join('\n');
}

// --- Inventory page wiring ---
function renderInventoryPage(canvasId){
  const canvas = document.getElementById(canvasId);
  const lowEl = document.getElementById('lowStock');
  // read storage
  let obj = {};
  try{ obj = JSON.parse(localStorage.getItem('bakery_app_v1') || '{}') || {}; }catch(e){ obj = {}; }
  const inventory = Array.isArray(obj.inventory) ? obj.inventory : (Array.isArray(obj.stock) ? obj.stock : []);
  const sales = Array.isArray(obj.sales) ? obj.sales : [];

  if(inventory && inventory.length){
    // show inventory table and low-stock highlights
    const rows = inventory.map(it => {
      const name = it.name || it.productName || it.item || 'Unknown';
      const qty = Number(it.qty || it.quantity || it.qty_on_hand || 0);
      const th = Number(it.threshold || it.reorder_level || 5);
      const status = qty <= th ? 'LOW' : 'OK';
      return { name, qty, th, status };
    });
    const low = rows.filter(r=> r.status === 'LOW');
    if(lowEl){
      lowEl.innerHTML = `<h4 style="margin:6px 0">Low stock items</h4>` + (low.length ? `<div>${low.map(l=> `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f6fb"><div><strong>${escapeHtml(l.name)}</strong><div style="font-size:12px;color:#666">Threshold: ${l.th}</div></div><div style="color:#b91c1c;font-weight:700">${l.qty}</div></div>`).join('')}</div>` : '<div style="color:#666">No low-stock items detected.</div>');
    }

    // chart of stock levels (top 12)
    const sorted = rows.slice().sort((a,b)=> a.qty - b.qty).slice(0,12);
    const labels = sorted.map(r=> r.name);
    const data = sorted.map(r=> r.qty);
    drawSalesChart(canvas, labels, data, 'Stock level');
    return;
  }

  // fallback: no inventory array found - show demand (top sold items)
  const prodMap = {};
  // use last 90 days as sample
  const cutoff = (new Date()).getTime() - (90*24*60*60*1000);
  sales.forEach(s => {
    try{
      if(Array.isArray(s.items)){
        s.items.forEach(it => {
          const name = it.productName || it.name || 'Unknown';
          const qty = Number(it.quantity||0);
          if(!prodMap[name]) prodMap[name] = { label: name, qty: 0 };
          prodMap[name].qty += qty;
        });
      }
    }catch(e){}
  });
  const top = Object.keys(prodMap).map(k=> prodMap[k]).sort((a,b)=> b.qty - a.qty).slice(0,12);
  if(lowEl){
    if(!top.length) lowEl.innerHTML = '<div style="color:#666">No sales data available to infer stock needs.</div>';
    else lowEl.innerHTML = `<h4 style="margin:6px 0">Top sold items (last 90 days)</h4><div>${top.map(t=> `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f3f6fb"><div>${escapeHtml(t.label)}</div><div style="font-weight:700">${t.qty}</div></div>`).join('')}</div><div style="margin-top:8px;color:#666">No explicit inventory found — add an 'inventory' array in localStorage.bakery_app_v1 to enable low-stock alerts.</div>`;
  }
  // show chart of demand
  const labels = top.map(t=> t.label);
  const data = top.map(t=> t.qty);
  drawSalesChart(canvas, labels, data, 'Units sold');
}
