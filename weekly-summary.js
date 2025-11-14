// Weekly summary viewer
const WEEKLY_SUM_KEY = 'cashir_weekly_summaries_v1';
const DAILY_SUM_KEY = 'cashir_daily_summaries_v1';

const savedWeeklyList = document.getElementById('savedWeeklyList');
const weekHeader = document.getElementById('weekHeader');
const wTele = document.getElementById('w-tele');
const wCash = document.getElementById('w-cash');
const wBank = document.getElementById('w-bank');
const weekReceipts = document.getElementById('weekReceipts');
const weekProdBreakdown = document.getElementById('weekProdBreakdown');
const downloadWeekBtn = document.getElementById('downloadWeekBtn');

function formatBirr(v){ return Number(v||0).toFixed(2) + ' Birr'; }

function getWeekStartISO(d){ const dt = d instanceof Date ? new Date(d) : new Date(d); const day = dt.getDay(); const diff = (day + 6) % 7; dt.setDate(dt.getDate() - diff); dt.setHours(0,0,0,0); return dt.toISOString().slice(0,10); }

let weeklySummaries = {};
let dailySummaries = [];
let receipts = [];

try{ const w = localStorage.getItem(WEEKLY_SUM_KEY); if(w) weeklySummaries = JSON.parse(w); }catch(e){ weeklySummaries = {}; }
try{ const d = localStorage.getItem(DAILY_SUM_KEY); if(d) dailySummaries = JSON.parse(d); }catch(e){ dailySummaries = []; }
try{
  const s = JSON.parse(localStorage.getItem('bakery_app_v1') || 'null');
  if(s && Array.isArray(s.sales)){
    receipts = s.sales.map(x => ({
      ...x,
      timestamp: new Date(x.saleDate || x.timestamp),
      payment: x.paymentMethod || x.payment || '',
      totalAmount: x.total || x.totalAmount || 0,
      // normalize item shape for older UI
      items: Array.isArray(x.items) ? x.items.map(it => ({ productLabel: it.productName || it.productLabel || '', priceLabel: it.priceLabel || '', qty: it.quantity || it.qty || 1, price: it.price || 0, subtotal: it.subtotal || it.total || 0 })) : []
    }));
  }
}catch(e){ receipts = []; }

function ensureWeeklyFromDaily(){
  // if weeklySummaries empty, compute from dailySummaries
  if(Object.keys(weeklySummaries||{}).length === 0 && Array.isArray(dailySummaries) && dailySummaries.length){
    const map = {};
    dailySummaries.forEach(d => {
      try{
        const date = new Date(d.date);
        const wk = getWeekStartISO(date);
        if(!map[wk]) map[wk] = {items:0,totalRev:0,byMethod:{Telebirr:{count:0,rev:0},Cash:{count:0,rev:0},Bank:{count:0,rev:0}}};
        map[wk].items += Number(d.items||0);
        map[wk].totalRev += Number(d.totalRev||0);
        ['Telebirr','Cash','Bank'].forEach(m => { map[wk].byMethod[m].count += Number((d.byMethod&&d.byMethod[m]&&d.byMethod[m].count)||0); map[wk].byMethod[m].rev += Number((d.byMethod&&d.byMethod[m]&&d.byMethod[m].rev)||0); });
      }catch(e){}
    });
    weeklySummaries = map;
  }
}

function renderSavedWeekly(){
  if(!savedWeeklyList) return;
  ensureWeeklyFromDaily();
  savedWeeklyList.innerHTML = '';
  const keys = Object.keys(weeklySummaries||{}).sort().reverse();
  if(keys.length === 0){ savedWeeklyList.innerHTML = '<div style="color:var(--muted)">No weekly summaries</div>'; return; }
  keys.forEach(k => {
    const w = weeklySummaries[k];
    const el = document.createElement('div'); el.style.marginBottom='8px'; el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center';
    el.innerHTML = `<div style="font-weight:600">Week of ${k}</div><div style="color:var(--muted)">${formatBirr(w.totalRev)}</div>`;
    el.setAttribute('data-week', k);
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{ viewWeek(k); });
    const btn = document.createElement('button'); btn.className='side-small-btn'; btn.textContent='View'; btn.style.marginLeft='8px'; btn.addEventListener('click', (ev)=>{ ev.stopPropagation(); viewWeek(k); });
    el.appendChild(btn);
    savedWeeklyList.appendChild(el);
  });
}

function viewWeek(weekKey){
  weekHeader.textContent = `Details for week starting ${weekKey}`;
  const found = (weeklySummaries||{})[weekKey];
  if(found){
    wTele.textContent = `${found.byMethod && found.byMethod.Telebirr ? found.byMethod.Telebirr.count : 0} — ${formatBirr(found.byMethod && found.byMethod.Telebirr ? found.byMethod.Telebirr.rev : 0)}`;
    wCash.textContent = `${found.byMethod && found.byMethod.Cash ? found.byMethod.Cash.count : 0} — ${formatBirr(found.byMethod && found.byMethod.Cash ? found.byMethod.Cash.rev : 0)}`;
    wBank.textContent = `${found.byMethod && found.byMethod.Bank ? found.byMethod.Bank.count : 0} — ${formatBirr(found.byMethod && found.byMethod.Bank ? found.byMethod.Bank.rev : 0)}`;
  } else {
    wTele.textContent = `0 — ${formatBirr(0)}`; wCash.textContent = `0 — ${formatBirr(0)}`; wBank.textContent = `0 — ${formatBirr(0)}`;
  }

  // filter receipts for that week
  const weekReceiptsArr = (receipts||[]).filter(r => {
    try{ const wk = getWeekStartISO(r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp)); return wk === weekKey; }catch(e){ return false; }
  }).slice().reverse();

  if(weekReceiptsArr.length === 0){ weekReceipts.innerHTML = '<div style="color:var(--muted)">No receipts for this week</div>'; weekProdBreakdown.innerHTML = '<div style="color:var(--muted)">No items</div>'; return; }

  weekReceipts.innerHTML = '';
  const prodAgg = {};
  weekReceiptsArr.forEach(r => {
    const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
    const box = document.createElement('div'); box.style.padding='8px'; box.style.border='1px solid #f0f0f0'; box.style.borderRadius='8px'; box.style.marginBottom='8px';
    const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.fontWeight='600'; header.innerHTML = `${formatBirr(r.totalAmount||0)} — ${ (Array.isArray(r.items) ? r.items.reduce((s,it)=>s+Number(it.qty||0),0) : (r.qty||0)) } item(s)`;
    const meta = document.createElement('div'); meta.style.fontSize='12px'; meta.style.color='var(--muted)'; meta.style.marginTop='6px'; meta.textContent = `${ts.toLocaleString()} • ${r.payment||''} • ${r.cashier||''}`;
    const itemsDiv = document.createElement('div'); itemsDiv.style.marginTop='8px';
    if(Array.isArray(r.items) && r.items.length){
      r.items.forEach(it => {
        const itRev = Number(it.subtotal || (it.price * it.qty)) || 0;
        const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.margin='4px 0'; row.innerHTML = `<span>${it.productLabel} ${it.priceLabel ? '('+it.priceLabel+')' : ''} × ${it.qty}</span><strong>${formatBirr(itRev)}</strong>`;
        itemsDiv.appendChild(row);
        const key = (it.productLabel||'') + '|' + (it.priceLabel||'');
        if(!prodAgg[key]) prodAgg[key] = {productLabel: it.productLabel||'', priceLabel: it.priceLabel||'', qty:0, rev:0};
        prodAgg[key].qty += Number(it.qty||0);
        prodAgg[key].rev += itRev;
      });
    } else {
      const row = document.createElement('div'); row.style.textAlign='right'; row.textContent = `${formatBirr(r.subtotal||0)} (legacy)`; itemsDiv.appendChild(row);
    }

    box.appendChild(header); box.appendChild(meta); box.appendChild(itemsDiv);
    weekReceipts.appendChild(box);
  });

  const prodRows = Object.keys(prodAgg).sort((a,b)=> prodAgg[b].rev - prodAgg[a].rev).map(k => {
    const p = prodAgg[k]; return `<div style="display:flex;justify-content:space-between;margin:6px 0"><span>${p.productLabel} ${p.priceLabel ? '('+p.priceLabel+')' : ''} — ${p.qty} sold</span><strong>${formatBirr(p.rev)}</strong></div>`;
  });
  weekProdBreakdown.innerHTML = prodRows.join('');

  downloadWeekBtn.onclick = ()=>{ downloadWeek(weekKey, weekReceiptsArr, prodAgg); };
}

function downloadWeek(weekKey, receiptsArr, prodAgg){
  let lines = [];
  lines.push(`Weekly Summary for week starting ${weekKey}`);
  let tele=0,cash=0,bank=0;
  receiptsArr.forEach(r => { const rev = Array.isArray(r.items) ? r.items.reduce((s,it)=>s + Number(it.subtotal || (it.price*it.qty))||0,0) : Number(r.subtotal||0); const method = (r.payment||'').toLowerCase(); if(method.includes('tele')) tele += rev; else if(method.includes('bank')) bank += rev; else cash += rev; });
  lines.push(`Telebirr revenue: ${formatBirr(tele)}`);
  lines.push(`Cash revenue: ${formatBirr(cash)}`);
  lines.push(`Bank revenue: ${formatBirr(bank)}`);
  lines.push(''); lines.push('Receipts:');
  receiptsArr.forEach(r => { const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp); lines.push(`- ${ts.toLocaleString()} • ${r.payment||''} • ${r.cashier||''} • ${formatBirr(r.totalAmount||r.subtotal||0)}`); if(Array.isArray(r.items) && r.items.length){ r.items.forEach(it => lines.push(`   ${it.productLabel} ${it.priceLabel ? '('+it.priceLabel+')' : ''} × ${it.qty} = ${formatBirr(it.subtotal || (it.price*it.qty))}`)); } });
  lines.push(''); lines.push('Product breakdown:'); Object.keys(prodAgg).sort((a,b)=> prodAgg[b].rev - prodAgg[a].rev).forEach(k => { const p = prodAgg[k]; lines.push(`${p.productLabel} ${p.priceLabel ? '('+p.priceLabel+')' : ''} — ${p.qty} sold — ${formatBirr(p.rev)}`); });
  const blob = new Blob([lines.join('\n')], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `weekly-summary-${weekKey}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// initial render
renderSavedWeekly();

// focus from dashboard
try{
  const focusWeek = localStorage.getItem('__focus_week');
  if(focusWeek){ localStorage.removeItem('__focus_week'); setTimeout(()=>{ viewWeek(focusWeek); }, 80); }
}catch(e){}
