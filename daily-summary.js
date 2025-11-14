// daily-summary.js
// Reads sales from localStorage 'bakery_app_v1' and renders a searchable, paginated daily summary.
// Listens for new sales via 'salesUpdated' event or storage events.

(function(){
  const STORE_KEY = 'bakery_app_v1';
  const DEBOUNCE_MS = 300;

  // DOM
  const dateFilter = document.getElementById('dateFilter');
  const receiptsTbody = document.querySelector('#receiptsTable tbody');
  const teleTotalEl = document.getElementById('teleTotal');
  const cashTotalEl = document.getElementById('cashTotal');
  const bankTotalEl = document.getElementById('bankTotal');
  const overallTotalEl = document.getElementById('overallTotal');
  const searchInput = document.getElementById('searchInput');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resetDayBtn = document.getElementById('resetDayBtn');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const pageSizeSelect = document.getElementById('pageSize');
  const simulateSaleBtn = document.getElementById('simulateSaleBtn');

  // chart canvases
  const paymentChartEl = document.getElementById('paymentChart').getContext('2d');
  const cashierChartEl = document.getElementById('cashierChart').getContext('2d');

  // modal
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const closeModalBtn = document.getElementById('closeModal');
  const printBtn = document.getElementById('printBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // state
  let store = null;
  let sales = [];
  let filtered = [];
  let page = 1;
  const SAVED_SUM_KEY = 'cashir_daily_summaries_v1';
  let savedSummaries = [];

  // accessibility focus trap helpers (simple)
  let _prevActive = null;
  let _trapContainer = null;
  function focusableElements(container){ if(!container) return []; return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled')); }
  function focusTrap(container){ _trapContainer = container; _prevActive = document.activeElement; const foc = focusableElements(container); if(foc.length) foc[0].focus(); document.addEventListener('keydown', _handleTrapKey); }
  function releaseFocusTrap(){ document.removeEventListener('keydown', _handleTrapKey); try{ if(_prevActive && typeof _prevActive.focus === 'function') _prevActive.focus(); }catch(e){} _prevActive = null; _trapContainer = null; }
  function _handleTrapKey(e){ if(e.key === 'Escape'){ if(modal && modal.getAttribute('aria-hidden') === 'false'){ modal.setAttribute('aria-hidden','true'); modalBody.innerHTML=''; releaseFocusTrap(); e.preventDefault(); } } if(!_trapContainer) return; if(e.key !== 'Tab') return; const foc = focusableElements(_trapContainer); if(foc.length === 0){ e.preventDefault(); return; } const idx = foc.indexOf(document.activeElement); if(e.shiftKey){ const next = (idx <= 0) ? foc[foc.length-1] : foc[idx-1]; next.focus(); e.preventDefault(); } else { const next = (idx === -1 || idx === foc.length-1) ? foc[0] : foc[idx+1]; next.focus(); e.preventDefault(); } }

  // saved summaries helpers
  function loadSavedSummaries(){ try{ const s = localStorage.getItem(SAVED_SUM_KEY); savedSummaries = s ? JSON.parse(s) : []; }catch(e){ savedSummaries = []; } }
  function saveSavedSummaries(){ try{ localStorage.setItem(SAVED_SUM_KEY, JSON.stringify(savedSummaries)); }catch(e){ console.error('saveSavedSummaries', e); } }
  function renderSavedDailyList(){ const el = document.getElementById('savedDailyList'); if(!el) return; el.innerHTML = ''; if(!savedSummaries || savedSummaries.length===0){ el.innerHTML = '<div style="color:var(--muted)">No saved daily summaries</div>'; return; } const list = savedSummaries.slice().sort((a,b)=> b.createdAt.localeCompare(a.createdAt)); list.forEach(snap => { const day = (snap.date||'').slice(0,10); const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px'; row.style.border='1px solid var(--border)'; row.style.borderRadius='8px'; row.style.marginBottom='8px'; row.innerHTML = `<div><strong>${day}</strong><div style="font-size:12px;color:var(--muted)">${snap.total ? Number(snap.total).toFixed(2) + ' Birr' : ''}</div></div>`; const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; const view = document.createElement('button'); view.className='side-small-btn'; view.textContent='View'; view.addEventListener('click', ()=> openSavedSnapshot(snap)); const loadBtn = document.createElement('button'); loadBtn.className='side-small-btn'; loadBtn.textContent='Load'; loadBtn.addEventListener('click', ()=>{ dateFilter.value = day; applyFilters(); }); const exp = document.createElement('button'); exp.className='side-small-btn'; exp.textContent='Export'; exp.addEventListener('click', ()=> exportSnapshot(snap)); const del = document.createElement('button'); del.className='side-small-btn'; del.textContent='Delete'; del.addEventListener('click', ()=>{ if(confirm('Delete saved summary for '+day+'?')){ savedSummaries = savedSummaries.filter(x => (x.date||'').slice(0,10) !== day); saveSavedSummaries(); renderSavedDailyList(); } }); actions.appendChild(view); actions.appendChild(loadBtn); actions.appendChild(exp); actions.appendChild(del); row.appendChild(actions); el.appendChild(row); }); }

  function openSavedSnapshot(snap){ let html = `<div><strong>Saved Summary for ${snap.date}</strong></div><div style="margin-top:8px">Total: <strong>${Number(snap.total||0).toFixed(2)} Birr</strong></div><hr/>`; if(snap.byMethod){ html += '<div style="display:flex;gap:8px;margin-top:8px">'; Object.keys(snap.byMethod).forEach(k=>{ const v = snap.byMethod[k]; html += `<div style="padding:6px;border-radius:6px;border:1px solid var(--border)"><div style="font-size:12px;color:var(--muted)">${k}</div><div style="font-weight:700">${Number(v.rev||0).toFixed(2)} Birr</div></div>`; }); html += '</div>'; } if(Array.isArray(snap.receipts) && snap.receipts.length){ html += '<hr/><div><strong>Receipts</strong></div>'; snap.receipts.forEach(r => { const dt = new Date(r.saleDate || r.saleDateISO || r.timestamp || r.createdAt); html += `<div style="margin-top:8px;padding:8px;border:1px solid #f3f3f3;border-radius:6px"><div style="display:flex;justify-content:space-between"><div><strong>${r.saleId||r.id||''}</strong> • ${r.cashier||''}</div><div>${(dt).toLocaleString()}</div></div>`; if(Array.isArray(r.items)) r.items.forEach(it=> html += `<div style="display:flex;justify-content:space-between;margin-top:6px"><div>${it.productName||it.productLabel||''} × ${it.quantity||it.qty||1}</div><div>${Number(it.subtotal||it.total||0).toFixed(2)} Birr</div></div>`); html += '</div>'; }); }
    modalBody.innerHTML = html; modal.setAttribute('aria-hidden','false'); try{ focusTrap(modal.querySelector('.modal-inner') || modal); }catch(e){} }

  function exportSnapshot(snap){ // download JSON by default
    try{ const txt = JSON.stringify(snap, null, 2); const blob = new Blob([txt], {type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `saved-summary-${(snap.date||'summary')}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }catch(e){ console.error(e); } }

  function readStore(){
    try{ return JSON.parse(localStorage.getItem(STORE_KEY)); }catch(e){return null;}
  }

  function load(){
    if(typeof seedData === 'function') seedData();
    store = readStore() || {products:[],productPrices:[],sales:[]};
    sales = (store.sales || []).map(s => ({...s, saleDateObj: new Date(s.saleDate)}));
  }

  function fmtMoney(v){ return Number(v||0).toFixed(2) + ' Birr'; }
  function isoDate(d){ return (d instanceof Date ? d : new Date(d)).toISOString().slice(0,10); }

  // default date filter to today
  dateFilter.value = isoDate(new Date());

  let searchTimer = null;
  searchInput.addEventListener('input', ()=>{ clearTimeout(searchTimer); searchTimer = setTimeout(()=>{ page = 1; applyFilters(); }, DEBOUNCE_MS); });
  dateFilter.addEventListener('change', ()=>{ page = 1; applyFilters(); });
  pageSizeSelect.addEventListener('change', ()=>{ page = 1; render(); });
  prevPageBtn.addEventListener('click', ()=>{ if(page>1){ page--; render(); }});
  nextPageBtn.addEventListener('click', ()=>{ const psize = Number(pageSizeSelect.value); const totalPages = Math.ceil((filtered.length||0)/psize); if(page < totalPages){ page++; render(); }});
  exportCsvBtn.addEventListener('click', ()=>{ exportCsv(); });
  resetDayBtn.addEventListener('click', ()=>{ resetDay(); });

  closeModalBtn.addEventListener('click', ()=>{ modal.setAttribute('aria-hidden','true'); modalBody.innerHTML=''; try{ releaseFocusTrap(); }catch(e){} });
  printBtn.addEventListener('click', ()=>{ const w = window.open('','_blank'); w.document.write(`<html><head><title>Receipt</title></head><body>${modalBody.innerHTML}</body></html>`); w.document.close(); w.print(); });
  downloadBtn.addEventListener('click', ()=>{ const text = modalBody.innerText || modalBody.textContent || ''; const blob = new Blob([text], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`receipt-${Date.now()}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });

  simulateSaleBtn.addEventListener('click', ()=>{ simulateSale(); });

  // Save current aggregated snapshot for the selected date
  const saveBtn = document.getElementById('saveSummaryBtn');
  function saveCurrentSummary(){
    const d = dateFilter.value || isoDate(new Date());
    // build snapshot from filtered (current day)
    const snapshot = { date: d, createdAt: new Date().toISOString(), total:0, byMethod:{}, receipts:[] };
    (filtered||[]).forEach(s => { const rev = Number(s.total||s.totalAmount||0); snapshot.total += rev; const pm = s.paymentMethod || s.payment || 'Other'; snapshot.byMethod[pm] = snapshot.byMethod[pm] || {count:0,rev:0}; snapshot.byMethod[pm].count += 1; snapshot.byMethod[pm].rev += rev; snapshot.receipts.push(JSON.parse(JSON.stringify(s))); });
    savedSummaries = savedSummaries.filter(x => (x.date||'').slice(0,10) !== d).concat([snapshot]); saveSavedSummaries(); renderSavedDailyList();
    alert('Saved summary for '+d);
  }
  if(saveBtn) saveBtn.addEventListener('click', ()=>{ saveCurrentSummary(); });

  // Autosave snapshot at next midnight and then every 24h (best-effort while page is open)
  function scheduleAutosave(){ try{ const now = new Date(); const next = new Date(now); next.setHours(24,0,5,0); const ms = next.getTime() - now.getTime(); setTimeout(()=>{ try{ saveCurrentSummary(); }catch(e){} scheduleAutosave(); }, ms); }catch(e){} }
  // start autosave (non-critical)
  try{ scheduleAutosave(); }catch(e){}

  function applyFilters(){
    const dateKey = dateFilter.value;
    const q = (searchInput.value||'').trim().toLowerCase();
    filtered = sales.filter(s => {
      try{
        if(dateKey && isoDate(s.saleDateObj) !== dateKey) return false;
        if(!q) return true;
        if((s.saleId||'').toLowerCase().includes(q)) return true;
        if((s.cashier||'').toLowerCase().includes(q)) return true;
        if((s.paymentMethod||'').toLowerCase().includes(q)) return true;
        if(Array.isArray(s.items) && s.items.some(it => (it.productName||'').toLowerCase().includes(q))) return true;
        return false;
      }catch(e){ return false; }
    });
    aggregateAndRender();
    render();
  }

  function aggregateAndRender(){
    let tele=0, cash=0, bank=0, overall=0;
    const byCashier = {}, byProduct = {};
    filtered.forEach(s => {
      const rev = Number(s.total||0);
      overall += rev;
      const pm = (s.paymentMethod||'').toLowerCase();
      if(pm.includes('tele')) tele += rev; else if(pm.includes('bank')) bank += rev; else cash += rev;
      const c = s.cashier || 'Cashier'; byCashier[c] = (byCashier[c] || 0) + rev;
      if(Array.isArray(s.items)) s.items.forEach(it => { const key = `${it.productName} (${Number(it.price).toFixed(2)})`; byProduct[key] = (byProduct[key] || 0) + Number(it.subtotal || 0); });
    });
    teleTotalEl.textContent = fmtMoney(tele); cashTotalEl.textContent = fmtMoney(cash); bankTotalEl.textContent = fmtMoney(bank); overallTotalEl.textContent = fmtMoney(overall);
    renderPaymentChart({Telebirr:tele,Cash:cash,Bank:bank});
    renderCashierChart(byCashier);
  }

  let paymentChart=null, cashierChart=null;
  function renderPaymentChart(dataObj){ const labels = Object.keys(dataObj); const data = labels.map(k=>dataObj[k]); if(paymentChart) paymentChart.destroy(); paymentChart = new Chart(paymentChartEl, { type:'pie', data:{labels, datasets:[{data,backgroundColor:['#f4a261','#2a9d8f','#264653']}]}, options:{plugins:{legend:{position:'bottom'}}} }); }
  function renderCashierChart(byCashier){ const labels = Object.keys(byCashier); const data = labels.map(k=>byCashier[k]); if(cashierChart) cashierChart.destroy(); cashierChart = new Chart(cashierChartEl, { type:'bar', data:{labels, datasets:[{label:'Revenue',data,backgroundColor:'#c77d60'}]}, options:{scales:{y:{beginAtZero:true}}} }); }

  function render(){ const psize = Number(pageSizeSelect.value) || 50; const totalPages = Math.max(1, Math.ceil((filtered.length||0)/psize)); if(page > totalPages) page = totalPages; const start = (page-1)*psize; const pageItems = (filtered||[]).slice(start, start+psize); receiptsTbody.innerHTML = ''; pageItems.forEach(s => { const tr = document.createElement('tr'); const dt = new Date(s.saleDate); tr.innerHTML = `<td>${s.saleId}</td><td>${s.cashier||''}</td><td>${s.paymentMethod||''}</td><td>${dt.toLocaleTimeString()}</td><td>${fmtMoney(s.total)}</td><td><button class="view-btn" data-id="${s.saleId}">View</button></td>`; receiptsTbody.appendChild(tr); }); pageInfo.textContent = `Page ${page} / ${totalPages}`; document.querySelectorAll('#receiptsTable .view-btn').forEach(b => { b.addEventListener('click', ()=>{ const id = b.getAttribute('data-id'); const s = (filtered||[]).find(x => x.saleId === id); if(s) openModal(s); }); }); }

  function openModal(sale){ modalBody.innerHTML = buildReceiptHtml(sale); modal.setAttribute('aria-hidden','false'); try{ focusTrap(modal.querySelector('.modal-inner') || modal); }catch(e){} }
  function buildReceiptHtml(s){ const dt = new Date(s.saleDate); let html = `<div><strong>Receipt:</strong> ${s.saleId}</div><div><strong>Cashier:</strong> ${s.cashier}</div><div><strong>Date:</strong> ${dt.toLocaleString()}</div><hr/>`; if(Array.isArray(s.items)){ s.items.forEach(it => { html += `<div style="display:flex;justify-content:space-between;margin:6px 0"><div>${it.productName} × ${it.quantity}</div><div>${Number(it.subtotal).toFixed(2)} Birr</div></div>`; }); } html += `<hr/><div style="display:flex;justify-content:space-between;font-weight:700"><div>Payment</div><div>${s.paymentMethod||''}</div></div>`; html += `<div style="display:flex;justify-content:space-between;margin-top:6px;font-weight:800"><div>Total</div><div>${Number(s.total).toFixed(2)} Birr</div></div>`; return html; }

  function exportCsv(){ const rows = [['saleId','cashier','paymentMethod','saleDate','total','items']]; filtered.forEach(s => { const itemsText = (s.items||[]).map(it=>`${it.productName} (${it.quantity}x @${it.price})`).join(' | '); rows.push([s.saleId,s.cashier,s.paymentMethod,s.saleDate,s.total,itemsText]); }); const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob = new Blob([csv], {type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sales-${dateFilter.value||'all'}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

  function resetDay(){ if(!confirm('Delete all sales for selected day? This cannot be undone.')) return; const d = dateFilter.value; if(!d) return; store = readStore() || {sales:[]}; store.sales = (store.sales||[]).filter(s => { try{ return new Date(s.saleDate).toISOString().slice(0,10) !== d; }catch(e){ return true; } }); localStorage.setItem(STORE_KEY, JSON.stringify(store)); load(); applyFilters(); }

  function simulateSale(){ try{ const s = readStore(); if(!s || !s.products || s.products.length===0) return alert('No products seeded'); const p = s.products[Math.floor(Math.random()*s.products.length)]; const variants = (s.productPrices||[]).filter(v=>v.productId===p.productId); const v = variants[Math.floor(Math.random()*variants.length)] || {price:10,label:'10'}; const q = Math.floor(Math.random()*5)+1; const sale = { saleId:`S-${Date.now()}`, cashier:'Sim', paymentMethod:['Telebirr','Bank','Cash'][Math.floor(Math.random()*3)], saleDate:new Date().toISOString(), items:[{productId:p.productId,productName:p.name,price:v.price,quantity:q,subtotal:Number((v.price*q).toFixed(2)), priceLabel:v.label}], total:Number((v.price*q).toFixed(2)) }; const storeObj = readStore() || {products:[],productPrices:[],sales:[]}; storeObj.sales = storeObj.sales || []; storeObj.sales.push(sale); localStorage.setItem(STORE_KEY, JSON.stringify(storeObj)); window.dispatchEvent(new Event('salesUpdated')); alert('Simulated sale created'); }catch(e){ console.error(e); } }

  function init(){ load(); applyFilters(); // load saved snapshots
    loadSavedSummaries(); renderSavedDailyList();
    window.addEventListener('salesUpdated', ()=>{ load(); applyFilters(); }); window.addEventListener('storage', (e)=>{ if(e.key === STORE_KEY){ load(); applyFilters(); } }); try{ const focusDay = localStorage.getItem('__focus_day'); const focusTs = localStorage.getItem('__focus_timestamp'); const focusWeek = localStorage.getItem('__focus_week'); const focusMonth = localStorage.getItem('__focus_month'); if(focusDay){ dateFilter.value = focusDay; localStorage.removeItem('__focus_day'); } else if(focusTs){ const ts = new Date(focusTs); dateFilter.value = ts.toISOString().slice(0,10); localStorage.removeItem('__focus_timestamp'); } else if(focusWeek){ dateFilter.value = focusWeek; localStorage.removeItem('__focus_week'); } else if(focusMonth){ dateFilter.value = focusMonth + '-01'; localStorage.removeItem('__focus_month'); } applyFilters(); }catch(e){} }

  init();

})();
