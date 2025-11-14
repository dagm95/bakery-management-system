// Monthly summary viewer
const DAILY_SUM_KEY = 'cashir_daily_summaries_v1';

const savedMonthlyList = document.getElementById('savedMonthlyList');
const monthHeader = document.getElementById('monthHeader');
const mTele = document.getElementById('m-tele');
const mCash = document.getElementById('m-cash');
const mBank = document.getElementById('m-bank');
const monthReceipts = document.getElementById('monthReceipts');
const monthProdBreakdown = document.getElementById('monthProdBreakdown');
const downloadMonthBtn = document.getElementById('downloadMonthBtn');

function formatBirr(v){ return Number(v||0).toFixed(2) + ' Birr'; }
function getMonthKey(d){ const dt = d instanceof Date ? new Date(d) : new Date(d); return dt.toISOString().slice(0,7); }

let dailySummaries = [];
let receipts = [];

try{ const d = localStorage.getItem(DAILY_SUM_KEY); if(d) dailySummaries = JSON.parse(d); }catch(e){ dailySummaries = []; }
try{
  const s = JSON.parse(localStorage.getItem('bakery_app_v1') || 'null');
  if(s && Array.isArray(s.sales)){
    receipts = s.sales.map(x => ({
      ...x,
      timestamp: new Date(x.saleDate || x.timestamp),
      payment: x.paymentMethod || x.payment || '',
      totalAmount: x.total || x.totalAmount || 0,
      items: Array.isArray(x.items) ? x.items.map(it => ({ productLabel: it.productName || it.productLabel || '', priceLabel: it.priceLabel || '', qty: it.quantity || it.qty || 1, price: it.price || 0, subtotal: it.subtotal || it.total || 0 })) : []
    }));
  }
}catch(e){ receipts = []; }

function computeMonthlyFromDaily(){
  const map = {};
  (dailySummaries||[]).forEach(d => {
    try{
      const mk = (new Date(d.date)).toISOString().slice(0,7);
      if(!map[mk]) map[mk] = {items:0,totalRev:0,byMethod:{Telebirr:{count:0,rev:0},Cash:{count:0,rev:0},Bank:{count:0,rev:0}}};
      map[mk].items += Number(d.items||0);
      map[mk].totalRev += Number(d.totalRev||0);
      ['Telebirr','Cash','Bank'].forEach(m => { map[mk].byMethod[m].count += Number((d.byMethod&&d.byMethod[m]&&d.byMethod[m].count)||0); map[mk].byMethod[m].rev += Number((d.byMethod&&d.byMethod[m]&&d.byMethod[m].rev)||0); });
    }catch(e){}
  });
  return map;
}

function renderSavedMonthly(){
  if(!savedMonthlyList) return;
  const map = computeMonthlyFromDaily();
  savedMonthlyList.innerHTML = '';
  const keys = Object.keys(map).sort().reverse();
  if(keys.length === 0){ savedMonthlyList.innerHTML = '<div style="color:var(--muted)">No monthly summaries</div>'; return; }
  keys.forEach(k => {
    const m = map[k];
    const el = document.createElement('div'); el.style.marginBottom='8px'; el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center';
    el.innerHTML = `<div style="font-weight:600">${k}</div><div style="color:var(--muted)">${formatBirr(m.totalRev)}</div>`;
    el.setAttribute('data-month', k);
    el.style.cursor = 'pointer';
    el.addEventListener('click', ()=>{ viewMonth(k); });
    const btn = document.createElement('button'); btn.className='side-small-btn'; btn.textContent='View'; btn.style.marginLeft='8px'; btn.addEventListener('click', (ev)=>{ ev.stopPropagation(); viewMonth(k); });
    el.appendChild(btn);
    savedMonthlyList.appendChild(el);
  });
}

function viewMonth(monthKey){
  monthHeader.textContent = `Details for ${monthKey}`;
  // compute totals for month
  const receiptsArr = (receipts||[]).filter(r => { try{ return getMonthKey(r.timestamp) === monthKey; }catch(e){ return false; } }).slice().reverse();
  if(receiptsArr.length === 0){ monthReceipts.innerHTML = '<div style="color:var(--muted)">No receipts for this month</div>'; monthProdBreakdown.innerHTML = '<div style="color:var(--muted)">No items</div>'; mTele.textContent = `0 — ${formatBirr(0)}`; mCash.textContent = `0 — ${formatBirr(0)}`; mBank.textContent = `0 — ${formatBirr(0)}`; return; }

  let tele=0,cash=0,bank=0;
  monthReceipts.innerHTML = '';
  const prodAgg = {};
  receiptsArr.forEach(r => {
    const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
    const rev = Array.isArray(r.items) ? r.items.reduce((s,it)=>s + Number(it.subtotal || (it.price*it.qty))||0,0) : Number(r.subtotal||0);
    const method = (r.payment||'').toLowerCase(); if(method.includes('tele')) tele += rev; else if(method.includes('bank')) bank += rev; else cash += rev;

    const box = document.createElement('div'); box.style.padding='8px'; box.style.border='1px solid #f0f0f0'; box.style.borderRadius='8px'; box.style.marginBottom='8px';
    const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.fontWeight='600'; header.innerHTML = `${formatBirr(r.totalAmount||0)} — ${ (Array.isArray(r.items) ? r.items.reduce((s,it)=>s+Number(it.qty||0),0) : (r.qty||0)) } item(s)`;
    const meta = document.createElement('div'); meta.style.fontSize='12px'; meta.style.color='var(--muted)'; meta.style.marginTop='6px'; meta.textContent = `${ts.toLocaleString()} • ${r.payment||''} • ${r.cashier||''}`;
    const itemsDiv = document.createElement('div'); itemsDiv.style.marginTop='8px';
    if(Array.isArray(r.items) && r.items.length){ r.items.forEach(it => { const itRev = Number(it.subtotal || (it.price * it.qty)) || 0; const row = document.createElement('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.margin='4px 0'; row.innerHTML = `<span>${it.productLabel} ${it.priceLabel ? '('+it.priceLabel+')' : ''} × ${it.qty}</span><strong>${formatBirr(itRev)}</strong>`; itemsDiv.appendChild(row); const key = (it.productLabel||'') + '|' + (it.priceLabel||''); if(!prodAgg[key]) prodAgg[key] = {productLabel: it.productLabel||'', priceLabel: it.priceLabel||'', qty:0, rev:0}; prodAgg[key].qty += Number(it.qty||0); prodAgg[key].rev += itRev; }); } else { const row = document.createElement('div'); row.style.textAlign='right'; row.textContent = `${formatBirr(r.subtotal||0)} (legacy)`; itemsDiv.appendChild(row); }
    box.appendChild(header); box.appendChild(meta); box.appendChild(itemsDiv); monthReceipts.appendChild(box);
  });

  mTele.textContent = `${0} — ${formatBirr(tele)}`; mCash.textContent = `${0} — ${formatBirr(cash)}`; mBank.textContent = `${0} — ${formatBirr(bank)}`;
  const prodRows = Object.keys(prodAgg).sort((a,b)=> prodAgg[b].rev - prodAgg[a].rev).map(k => { const p = prodAgg[k]; return `<div style="display:flex;justify-content:space-between;margin:6px 0"><span>${p.productLabel} ${p.priceLabel ? '('+p.priceLabel+')' : ''} — ${p.qty} sold</span><strong>${formatBirr(p.rev)}</strong></div>`; });
  monthProdBreakdown.innerHTML = prodRows.join('');

  downloadMonthBtn.onclick = ()=>{ downloadMonth(monthKey, receiptsArr, prodAgg); };
}

function downloadMonth(monthKey, receiptsArr, prodAgg){ let lines = []; lines.push(`Monthly Summary for ${monthKey}`); let tele=0,cash=0,bank=0; receiptsArr.forEach(r => { const rev = Array.isArray(r.items) ? r.items.reduce((s,it)=>s + Number(it.subtotal || (it.price*it.qty))||0,0) : Number(r.subtotal||0); const method = (r.payment||'').toLowerCase(); if(method.includes('tele')) tele += rev; else if(method.includes('bank')) bank += rev; else cash += rev; }); lines.push(`Telebirr revenue: ${formatBirr(tele)}`); lines.push(`Cash revenue: ${formatBirr(cash)}`); lines.push(`Bank revenue: ${formatBirr(bank)}`); lines.push(''); lines.push('Receipts:'); receiptsArr.forEach(r => { const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp); lines.push(`- ${ts.toLocaleString()} • ${r.payment||''} • ${r.cashier||''} • ${formatBirr(r.totalAmount||r.subtotal||0)}`); if(Array.isArray(r.items) && r.items.length){ r.items.forEach(it => lines.push(`   ${it.productLabel} ${it.priceLabel ? '('+it.priceLabel+')' : ''} × ${it.qty} = ${formatBirr(it.subtotal || (it.price*it.qty))}`)); } }); lines.push(''); lines.push('Product breakdown:'); Object.keys(prodAgg).sort((a,b)=> prodAgg[b].rev - prodAgg[a].rev).forEach(k => { const p = prodAgg[k]; lines.push(`${p.productLabel} ${p.priceLabel ? '('+p.priceLabel+')' : ''} — ${p.qty} sold — ${formatBirr(p.rev)}`); }); const blob = new Blob([lines.join('\n')], {type:'text/plain'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `monthly-summary-${monthKey}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// initial render
renderSavedMonthly();

// focus from dashboard
try{
  const focusMonth = localStorage.getItem('__focus_month');
  if(focusMonth){ localStorage.removeItem('__focus_month'); setTimeout(()=>{ viewMonth(focusMonth); }, 80); }
}catch(e){}
