// Summaries dashboard: shows quick totals and links to daily/weekly/monthly pages
const DAILY_SUM_KEY = 'cashir_daily_summaries_v1';

const todayRevEl = document.getElementById('todayRev');
const todayItemsEl = document.getElementById('todayItems');
const weekRevEl = document.getElementById('weekRev');
const weekItemsEl = document.getElementById('weekItems');
const monthRevEl = document.getElementById('monthRev');
const monthItemsEl = document.getElementById('monthItems');
const recentDaysEl = document.getElementById('recentDays');
const recentReceiptsEl = document.getElementById('recentReceipts');
const viewDailyBtn = document.getElementById('viewDailyBtn');
const viewWeekBtn = document.getElementById('viewWeekBtn');
const viewMonthBtn = document.getElementById('viewMonthBtn');

function formatBirr(v){ return Number(v||0).toFixed(2) + ' Birr'; }
function isToday(d){ const dt = d instanceof Date ? d : new Date(d); const n = new Date(); return dt.getFullYear()===n.getFullYear() && dt.getMonth()===n.getMonth() && dt.getDate()===n.getDate(); }
function getWeekStartISO(d){ const dt = d instanceof Date ? new Date(d) : new Date(d); const day = dt.getDay(); const diff = (day + 6) % 7; dt.setDate(dt.getDate() - diff); dt.setHours(0,0,0,0); return dt.toISOString().slice(0,10); }
function getMonthKey(d){ const dt = d instanceof Date ? new Date(d) : new Date(d); return dt.toISOString().slice(0,7); }

let receipts = [];
let dailySummaries = [];
try{
  const s = JSON.parse(localStorage.getItem('bakery_app_v1') || 'null');
  if(s && Array.isArray(s.sales)){
    receipts = s.sales.map(x => ({ ...x, timestamp: new Date(x.saleDate || x.timestamp), payment: x.paymentMethod || x.payment || '', totalAmount: x.total || x.totalAmount || 0, items: Array.isArray(x.items) ? x.items.map(it => ({ productLabel: it.productName || it.productLabel || '', priceLabel: it.priceLabel || '', qty: it.quantity || it.qty || 1, price: it.price || 0, subtotal: it.subtotal || it.total || 0 })) : [] }));
  }
}catch(e){ receipts = []; }
try{ const d = localStorage.getItem(DAILY_SUM_KEY); if(d) dailySummaries = JSON.parse(d); }catch(e){ dailySummaries = []; }

// Compute today, this week, this month
(function computeAndRender(){
  const now = new Date();
  const weekKey = getWeekStartISO(now);
  const monthKey = getMonthKey(now);

  let todayItems = 0, todayRev = 0;
  let weekItems = 0, weekRev = 0;
  let monthItems = 0, monthRev = 0;

  receipts.forEach(r => {
    try{
      const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
      const rev = Array.isArray(r.items) ? r.items.reduce((s,it)=> s + Number(it.subtotal || (it.price*it.qty))||0, 0) : Number(r.subtotal||0);
      const itemsCount = Array.isArray(r.items) ? r.items.reduce((s,it)=> s + Number(it.qty||0), 0) : Number(r.qty||0);
      if(isToday(ts)){ todayItems += itemsCount; todayRev += rev; }
      if(getWeekStartISO(ts) === weekKey){ weekItems += itemsCount; weekRev += rev; }
      if(getMonthKey(ts) === monthKey){ monthItems += itemsCount; monthRev += rev; }
    }catch(e){}
  });

  todayItemsEl.textContent = todayItems;
  todayRevEl.textContent = formatBirr(todayRev);
  weekItemsEl.textContent = weekItems;
  weekRevEl.textContent = formatBirr(weekRev);
  monthItemsEl.textContent = monthItems;
  monthRevEl.textContent = formatBirr(monthRev);

  // recent daily summaries list (show last 7 days if available)
  recentDaysEl.innerHTML = '';
  const days = (dailySummaries||[]).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||'')).slice(0,7);
  if(days.length === 0){ recentDaysEl.innerHTML = '<div style="color:var(--muted)">No saved daily summaries</div>'; }
  days.forEach(d => {
    const day = (d.date||'').slice(0,10);
    const el = document.createElement('div'); el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.marginBottom='8px';
    el.innerHTML = `<div style="font-weight:600">${day}</div><div style="color:var(--muted)">${formatBirr(d.totalRev)}</div>`;
    const btn = document.createElement('button'); btn.className='side-small-btn'; btn.textContent='View';
    btn.addEventListener('click', ()=>{ try{ localStorage.setItem('__focus_day', day); }catch(e){}; window.location.href='daily-summary.html'; });
    el.appendChild(btn);
    recentDaysEl.appendChild(el);
  });

  // recent receipts (last 10)
  recentReceiptsEl.innerHTML = '';
  const recent = (receipts||[]).slice().reverse().slice(0,10);
  if(recent.length === 0){ recentReceiptsEl.innerHTML = '<div style="color:var(--muted)">No receipts</div>'; }
  recent.forEach(r => {
    const ts = r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp);
    const rev = Array.isArray(r.items) ? r.items.reduce((s,it)=> s + Number(it.subtotal || (it.price*it.qty))||0,0) : Number(r.subtotal||0);
    const box = document.createElement('div'); box.style.display='flex'; box.style.justifyContent='space-between'; box.style.alignItems='center'; box.style.marginBottom='8px';
    box.innerHTML = `<div style="font-weight:600">${formatBirr(rev)}</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleString()} • ${r.payment||''}</div>`;
    const btn = document.createElement('button'); btn.className='side-small-btn'; btn.textContent='View';
    btn.addEventListener('click', ()=>{ try{ localStorage.setItem('__focus_timestamp', r.timestamp instanceof Date ? r.timestamp.toISOString() : r.timestamp); }catch(e){}; window.location.href='daily-summary.html'; });
    box.appendChild(btn);
    recentReceiptsEl.appendChild(box);
  });
})();

// Navigation handlers
if(viewDailyBtn) viewDailyBtn.addEventListener('click', ()=>{ window.location.href='daily-summary.html'; });
if(viewWeekBtn) viewWeekBtn.addEventListener('click', ()=>{ window.location.href='weekly-summary.html'; });
if(viewMonthBtn) viewMonthBtn.addEventListener('click', ()=>{ window.location.href='monthly-summary.html'; });
// Support focusing week/month when navigating from this dashboard
if(viewWeekBtn) viewWeekBtn.addEventListener('click', ()=>{ try{ const now = new Date(); localStorage.setItem('__focus_week', getWeekStartISO(now)); }catch(e){}; window.location.href='weekly-summary.html'; });
if(viewMonthBtn) viewMonthBtn.addEventListener('click', ()=>{ try{ const now = new Date(); localStorage.setItem('__focus_month', getMonthKey(now)); }catch(e){}; window.location.href='monthly-summary.html'; });

// If the daily-summary page supports focusing a day/timestamp via localStorage keys, we set __focus_day or __focus_timestamp before redirecting.
