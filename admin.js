(function(){
  const ROLE_KEY = 'bakery_user_role';
  const adminNameEl = document.getElementById('adminName');
  const quickStatsEl = document.getElementById('quickStats');
  const btnLogout = document.getElementById('btnLogout');
  const btnLogoutSide = document.getElementById('btnLogoutSide');
  const contentArea = document.getElementById('contentArea');
  const navLinks = Array.from(document.querySelectorAll('.nav a'));

  function guard(){
    try{
      const role = localStorage.getItem(ROLE_KEY);
      if(role !== 'admin'){
        // not authorized for admin page
        window.location.href = 'login.html';
        return false;
      }
      return true;
    }catch(e){ window.location.href = 'login.html'; return false; }
  }

  function renderQuickStats(){
    try{
      const raw = localStorage.getItem('bakery_app_v1');
      const obj = raw ? JSON.parse(raw) : null;
      const sales = (obj && obj.sales) ? obj.sales : [];
      const today = new Date().toISOString().slice(0,10);
      const todays = sales.filter(s => (s.saleDate||'').slice(0,10) === today);
      quickStatsEl.innerHTML = `<div>All-time sales: ${sales.length}</div><div>Today's sales: ${todays.length}</div>`;
    }catch(e){ quickStatsEl.textContent = 'Unable to load stats'; }
  }

  function renderContent(target){
    if(!contentArea) return;
    // basic content templates
    if(target === 'dashboard'){
      // load store data
      let store = null;
      try{ store = JSON.parse(localStorage.getItem('bakery_app_v1')) || {}; }catch(e){ store = {}; }
      const sales = Array.isArray(store.sales) ? store.sales : [];
      const totalSalesCount = sales.length;
      // today's stats
  const todayKey = new Date().toISOString().slice(0,10);
  // period starts
  const now = new Date();
  const weekStartDate = new Date(now); weekStartDate.setDate(now.getDate() - 6); // last 7 days inclusive
  const monthStartDate = new Date(now); monthStartDate.setDate(now.getDate() - 29); // last 30 days inclusive

  let todaysRev = 0; let todaysCount = 0;
  let weeklyRev = 0; let weeklyCount = 0;
  let monthlyRev = 0; let monthlyCount = 0;
      const prodAgg = {}; // key -> {label, qty, rev}
      // iterate
      sales.forEach(s => {
        try{
          const saleDateObj = new Date(s.saleDate || s.timestamp || s.ts || Date.now());
          const date = saleDateObj.toISOString().slice(0,10);
          // compute receipt revenue
          let rev = 0; let qty = 0;
          if(Array.isArray(s.items) && s.items.length){
            s.items.forEach(it => { const itemRev = Number(it.subtotal|| (it.price * it.quantity) ) || 0; rev += itemRev; qty += Number(it.quantity||0); const key = (it.productName||'') + '|' + (it.price||''); if(!prodAgg[key]) prodAgg[key] = {label: it.productName||'', price: it.price||0, qty:0, rev:0}; prodAgg[key].qty += Number(it.quantity||0); prodAgg[key].rev += itemRev; });
          } else {
            rev = Number(s.total || 0);
          }
          // update daily/weekly/monthly totals
          try{
            if(date === todayKey){ todaysRev += rev; todaysCount += 1; }
            const saleTime = saleDateObj.getTime();
            if(saleTime >= weekStartDate.getTime()){ weeklyRev += rev; weeklyCount += 1; }
            if(saleTime >= monthStartDate.getTime()){ monthlyRev += rev; monthlyCount += 1; }
          }catch(e){}
        }catch(e){}
      });

      // top products
      const topProducts = Object.keys(prodAgg).map(k => prodAgg[k]).sort((a,b)=> b.rev - a.rev).slice(0,6);

      // recent receipts (most recent 8)
      const recent = sales.slice().sort((a,b)=> new Date(b.saleDate||b.timestamp).getTime() - new Date(a.saleDate||a.timestamp).getTime()).slice(0,8);

      contentArea.innerHTML = `
        <div class="dash-grid">
          <div class="dash-card" data-target="dashbored/sales.html" style="--dash-color:#3b82f6"><div class="dash-icon">🧾</div><div class="dash-body"><div class="dash-title">Sales / POS Insights</div><div class="dash-desc">Analyze daily sales, cashier transactions and top items</div></div></div>
          <div class="dash-card" data-target="dashbored/inventory.html" style="--dash-color:#10b981"><div class="dash-icon">📦</div><div class="dash-body"><div class="dash-title">Inventory / Stock Status</div><div class="dash-desc">Monitor stock levels, low-stock alerts and reorder suggestions</div></div></div>
          <div class="dash-card" data-target="dashbored/employees.html" style="--dash-color:#8b5cf6"><div class="dash-icon">👥</div><div class="dash-body"><div class="dash-title">Employees / Performance</div><div class="dash-desc">Track user activity, transaction counts and manage roles</div></div></div>
          <div class="dash-card" data-target="dashbored/profits.html" style="--dash-color:#f97316"><div class="dash-icon">💰</div><div class="dash-body"><div class="dash-title">Profits / Financial Analytics</div><div class="dash-desc">Income vs expenses, profit margins and growth trends</div></div></div>
          <div class="dash-card" data-target="dashbored/production.html" style="--dash-color:#a57a48"><div class="dash-icon">🍞</div><div class="dash-body"><div class="dash-title">Bakery Production Overview</div><div class="dash-desc">Production logs, ingredient usage and waste reports</div></div></div>
          <div class="dash-card" data-target="dashbored/security.html" style="--dash-color:#ef4444"><div class="dash-icon">🔐</div><div class="dash-body"><div class="dash-title">Security / System Settings</div><div class="dash-desc">Manage accounts, backups and role-based access control</div></div></div>
          <div class="dash-card" data-target="dashbored/expenses.html" style="--dash-color:#f59e0b"><div class="dash-icon">💳</div><div class="dash-body"><div class="dash-title">Expenses / Cost Tracking</div><div class="dash-desc">Ingredient purchases, utilities and expense categorization</div></div></div>
          <div class="dash-card" data-target="dashbored/reports.html" style="--dash-color:#06b6d4"><div class="dash-icon">📊</div><div class="dash-body"><div class="dash-title">Reports / Business Summaries</div><div class="dash-desc">Generate exports and auto-summarized business reports</div></div></div>
        </div>

        <div class="summary-grid">
          <div class="card summary-card">
            <h4 class="summary-label">All-time sales</h4>
            <div class="summary-value">${totalSalesCount}</div>
          </div>
          <div class="card summary-card">
            <h4 class="summary-label">Today's revenue</h4>
            <div class="summary-value">${(Number(todaysRev)||0).toFixed(2)} Birr</div>
          </div>
          <div class="card summary-card">
            <h4 class="summary-label">Weekly revenue (7d)</h4>
            <div class="summary-value">${(Number(weeklyRev)||0).toFixed(2)} Birr</div>
          </div>
          <div class="card summary-card">
            <h4 class="summary-label">Monthly revenue (30d)</h4>
            <div class="summary-value">${(Number(monthlyRev)||0).toFixed(2)} Birr</div>
          </div>
          <div class="card summary-card">
            <h4 class="summary-label">Today's receipts</h4>
            <div class="summary-value">${todaysCount}</div>
          </div>
        </div>

        
        
        <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-top:12px">
          <div class="card" style="flex:1;min-width:320px;max-width:720px">
            <h3>Revenue (last 14 days)</h3>
            <div class="chart-wrap">
              <canvas id="revChart" class="chart-canvas" style="height:220px"></canvas>
            </div>
          </div>

          <div class="card" style="flex:1;min-width:320px;max-width:520px">
            <h3>Top products</h3>
            <div class="chart-wrap">
              <canvas id="prodChart" class="chart-canvas" style="height:220px"></canvas>
            </div>
          </div>
        </div>
      `;
      // render quick stats area if needed
      try{ renderQuickStats(); }catch(e){}

      // wire dashboard tile clicks
      try{
        const dashCards = Array.from(document.querySelectorAll('.dash-card'));
        dashCards.forEach(card => {
          card.addEventListener('click', ()=>{
            try{
              const tgt = card.dataset.target || '';
              if(!tgt) return;
              if(tgt.endsWith('.html')){ window.location.href = tgt; return; }
              // otherwise call renderContent for internal targets
              renderContent(tgt);
            }catch(e){}
          });
        });
      }catch(e){}

      // --- chart rendering (Chart.js must be available) ---
      try{
        // safe guards: destroy previous instances if present
        if(window.revChartInstance && typeof window.revChartInstance.destroy === 'function'){ try{ window.revChartInstance.destroy(); }catch(e){} window.revChartInstance = null; }
        if(window.prodChartInstance && typeof window.prodChartInstance.destroy === 'function'){ try{ window.prodChartInstance.destroy(); }catch(e){} window.prodChartInstance = null; }

        if(typeof Chart === 'undefined'){
          // Chart.js not loaded; skip charting
        } else {
          // build last N days revenue series
          const N = 14;
          const toDate = (d)=> d.toISOString().slice(0,10);
          const labels = [];
          const dayMap = {};
          for(let i=N-1;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); const k = toDate(d); labels.push(k); dayMap[k]=0; }

          // populate dayMap and product aggregation
          const prodMap = {};
          sales.forEach(s => {
            try{
              const dateKey = (s.saleDate||'').slice(0,10) || (new Date(s.timestamp||s.ts||Date.now()).toISOString().slice(0,10));
              let rev = 0;
              if(Array.isArray(s.items) && s.items.length){
                s.items.forEach(it => { const itemRev = Number(it.subtotal || (it.price * it.quantity)) || 0; rev += itemRev; const pname = it.productName||it.name||'Unknown'; const key = pname + '|' + (it.price||''); if(!prodMap[key]) prodMap[key] = { label: pname, price: Number(it.price||0), qty:0, rev:0 }; prodMap[key].qty += Number(it.quantity||0); prodMap[key].rev += itemRev; });
              } else {
                rev = Number(s.total || s.totalAmount || 0) || 0;
              }
              if(dayMap.hasOwnProperty(dateKey)) dayMap[dateKey] += rev;
            }catch(e){}
          });

          // revenue dataset
          const revData = labels.map(l => Number((dayMap[l]||0).toFixed(2)));

          // top products from prodMap
          const prodArr = Object.keys(prodMap).map(k=> prodMap[k]).sort((a,b)=> b.rev - a.rev).slice(0,8);
          const prodLabels = prodArr.map(p=> p.label);
          const prodData = prodArr.map(p=> Number(p.rev.toFixed(2)));

          // create revenue line/area chart
          try{
            const ctx = document.getElementById('revChart') && document.getElementById('revChart').getContext ? document.getElementById('revChart').getContext('2d') : null;
            if(ctx){
              window.revChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                  labels: labels.map(l=> new Date(l).toLocaleDateString()),
                  datasets: [{
                    label: 'Revenue',
                    data: revData,
                    backgroundColor: 'rgba(54,162,235,0.15)',
                    borderColor: 'rgba(54,162,235,1)',
                    pointBackgroundColor: 'rgba(54,162,235,1)',
                    fill: true,
                    tension: 0.25,
                  }]
                },
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { ticks: { maxRotation: 0, autoSkip: true } }, y: { beginAtZero: true } }
                }
              });
            }
          }catch(e){}

          // create top-products bar chart
          try{
            const ctx2 = document.getElementById('prodChart') && document.getElementById('prodChart').getContext ? document.getElementById('prodChart').getContext('2d') : null;
            if(ctx2){
              const colors = ['#3b82f6','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316'];
              window.prodChartInstance = new Chart(ctx2, {
                type: 'bar',
                data: {
                  labels: prodLabels,
                  datasets: [{ label: 'Revenue', data: prodData, backgroundColor: prodLabels.map((_,i)=> colors[i%colors.length]) }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
              });
            }
          }catch(e){}
        }
      }catch(e){}
    } else if(target === 'settings'){
      // load existing passwords from storage
      const pwdKey = 'bakery_role_passwords';
      let stored = { admin: 'admin123', cashir: 'cashir123', manager: 'manager123' };
      try{ const raw = localStorage.getItem(pwdKey); if(raw) stored = Object.assign(stored, JSON.parse(raw)); }catch(e){}
      contentArea.innerHTML = `
        <section class="card">
          <h3>Settings</h3>
          <p class="muted">Change role passwords below. These are stored locally in your browser.</p>
          <div style="max-width:560px">
            <label style="display:block;margin:8px 0;font-weight:600">Admin password</label>
            <input id="pwdAdmin" type="password" value="${stored.admin||''}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6e6e6" />
            <label style="display:block;margin:8px 0;font-weight:600">Cashir password</label>
            <input id="pwdCashir" type="password" value="${stored.cashir||''}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6e6e6" />
            <label style="display:block;margin:8px 0;font-weight:600">Bakery Manager password</label>
            <input id="pwdManager" type="password" value="${stored.manager||''}" style="width:100%;padding:8px;border-radius:6px;border:1px solid #e6e6e6" />

            <div class="pw-toggle" style="margin-top:10px;align-items:center">
              <input id="showPwToggle" type="checkbox" />
              <label for="showPwToggle" style="margin-left:8px">Show passwords</label>
            </div>

            <div style="margin-top:12px">
              <button id="savePwBtn" class="btn">Save passwords</button>
              <span id="settingsNotice" style="margin-left:12px;color:green;display:none">Saved</span>
            </div>
          </div>
        </section>
      `;
      // bind save handler
      try{
        const saveBtn = document.getElementById('savePwBtn');
        const n = document.getElementById('settingsNotice');
        if(saveBtn){
          saveBtn.addEventListener('click', ()=>{
            const a = document.getElementById('pwdAdmin');
            const c = document.getElementById('pwdCashir');
            const m = document.getElementById('pwdManager');
            const obj = { admin: a ? (a.value||'') : '', cashir: c ? (c.value||'') : '', manager: m ? (m.value||'') : '' };
            try{ localStorage.setItem(pwdKey, JSON.stringify(obj)); if(n){ n.style.display = 'inline-block'; n.textContent = 'Saved'; setTimeout(()=>{ if(n) n.style.display='none'; }, 2500); } }
            catch(e){ if(n){ n.style.display='inline-block'; n.textContent='Unable to save'; setTimeout(()=>{ if(n) n.style.display='none'; }, 2500); } }
          });
        }
        // bind show/hide toggle
        try{
          const toggle = document.getElementById('showPwToggle');
          if(toggle){
            toggle.addEventListener('change', ()=>{
              const show = !!toggle.checked;
              ['pwdAdmin','pwdCashir','pwdManager'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.type = show ? 'text' : 'password';
              });
            });
          }
        }catch(e){}
      }catch(e){}
    } else if(target === 'users'){
      contentArea.innerHTML = `<section class="card"><h3>Users</h3><p class="muted">Manage users - add/remove/edit (placeholder).</p></section>`;
    } else if(target === 'products'){
      contentArea.innerHTML = `<section class="card"><h3>Products</h3><p class="muted">Product catalog management (placeholder).</p></section>`;
    } else if(target === 'reports'){
      // Reports panel: months-by-name chart + month boxes that open receipts for that month
      let storeRpt = {};
      try{ storeRpt = JSON.parse(localStorage.getItem('bakery_app_v1')) || {}; }catch(e){ storeRpt = {}; }
      const salesRpt = Array.isArray(storeRpt.sales) ? storeRpt.sales : [];
      // prepare month buckets
      const monthBucketsRpt = new Array(12).fill(0);
      salesRpt.forEach(s=>{ try{ const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now()); const m = d.getMonth(); let rev = 0; if(Array.isArray(s.items) && s.items.length){ s.items.forEach(it=> { rev += Number(it.subtotal || (it.price*it.quantity)) || 0; }); } else rev = Number(s.total || s.totalAmount || 0) || 0; monthBucketsRpt[m] += rev; }catch(e){} });

      contentArea.innerHTML = `
        <section class="card">
          <h3>Reports</h3>
          <p class="muted">Monthly overview and per-month receipts. Click a month to view receipts saved for that month.</p>
          <div style="margin-top:8px" class="chart-wrap"><canvas id="monthsByNameChartReports" class="chart-canvas" style="height:220px"></canvas></div>
          <div id="monthBoxesReports" class="month-grid" style="margin-top:12px"></div>
          <div id="monthDetailsReports" style="margin-top:12px"></div>
        </section>
      `;

      // render months chart in reports
      try{
        if(window.monthsChartInstance && typeof window.monthsChartInstance.destroy === 'function'){ try{ window.monthsChartInstance.destroy(); }catch(e){} window.monthsChartInstance = null; }
        if(typeof Chart !== 'undefined'){
          const el = document.getElementById('monthsByNameChartReports');
          const ctx = el && el.getContext ? el.getContext('2d') : null;
          if(ctx){
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            window.monthsChartInstance = new Chart(ctx, {
              type: 'bar',
              data: { labels: monthNames, datasets: [{ label: 'Revenue (Birr)', data: monthBucketsRpt.map(v=> Number(v.toFixed(2))), backgroundColor: monthNames.map((_,i)=> i%2? 'rgba(59,130,246,0.9)' : 'rgba(99,102,241,0.9)') }] },
              options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => `${Number(ctx.raw).toFixed(2)} Birr` } } }, scales:{ y:{ beginAtZero:true } } }
            });
          }
        }
      }catch(e){}

      // populate month boxes and wire click -> open month details in reports
      try{
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const boxesEl = document.getElementById('monthBoxesReports');
        const detailsEl = document.getElementById('monthDetailsReports');
        if(boxesEl){
          boxesEl.innerHTML = monthNames.map((name,i)=> {
            const v = Number((monthBucketsRpt[i]||0).toFixed(2));
            return `<div class="month-card" data-month="${i}"><div class="month-name">${name}</div><div class="month-val">${v} Birr</div></div>`;
          }).join('');

          const cards = boxesEl.querySelectorAll('.month-card');
          function clearSelected(){ cards.forEach(c=> c.classList.remove('selected')); }
          function renderMonthDetails(monthIndex){
            clearSelected();
            const card = boxesEl.querySelector(`.month-card[data-month="${monthIndex}"]`);
            if(card) card.classList.add('selected');
            const receipts = salesRpt.filter(s=>{ try{ const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now()); return d.getMonth() === monthIndex; }catch(e){ return false; } }).sort((a,b)=> new Date(b.saleDate||b.timestamp||Date.now()).getTime() - new Date(a.saleDate||a.timestamp||Date.now()).getTime());
            if(!detailsEl) return;
            if(!receipts.length){ detailsEl.innerHTML = `<div style="color:var(--muted);padding:8px">No receipts for ${monthNames[monthIndex]}</div>`; return; }
            const rows = receipts.map(r=>{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); const total = Number(r.total|| r.totalAmount || (Array.isArray(r.items)? r.items.reduce((a,b)=> a + (Number(b.subtotal || (b.price*b.quantity))||0),0):0)).toFixed(2); const method = r.paymentMethod || r.payment || ''; const cashier = r.cashier || ''; return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${total} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleString()}</div></div><div style="font-size:13px;color:var(--muted)">${method} • ${cashier}</div></div>` }).join('');
            detailsEl.innerHTML = `<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">Receipts — ${monthNames[monthIndex]}</div><button id="monthBackBtnReports" class="btn">Back</button></div><div>${rows}</div>`;
            const back = document.getElementById('monthBackBtnReports');
            if(back){ back.addEventListener('click', ()=>{ detailsEl.innerHTML = ''; clearSelected(); }); }
          }
          cards.forEach(c=> c.addEventListener('click', ()=>{ const m = Number(c.dataset.month); renderMonthDetails(m); }));
        }
      }catch(e){}

    } else if(target === 'summary-daily'){
      // Daily summary (today) with hourly chart and receipts
      let store = {}; try{ store = JSON.parse(localStorage.getItem('bakery_app_v1')) || {}; }catch(e){ store = {}; }
      const sales = Array.isArray(store.sales) ? store.sales : [];
      const todayKey = new Date().toISOString().slice(0,10);
      const hourMap = {}; for(let h=0;h<24;h++) hourMap[h]=0;
      const todays = [];
      sales.forEach(s=>{
        try{
          const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now());
          if(d.toISOString().slice(0,10) !== todayKey) return;
          let rev = 0;
          if(Array.isArray(s.items) && s.items.length){ s.items.forEach(it=> { rev += Number(it.subtotal || (it.price*it.quantity)) || 0; }); }
          else rev = Number(s.total || s.totalAmount || 0) || 0;
          const h = d.getHours(); hourMap[h] += rev;
          todays.push(Object.assign({}, s, { _rev: rev, _ts: d.getTime() }));
        }catch(e){}
      });
      const totalToday = todays.reduce((a,b)=> a + (Number(b._rev)||0), 0);

      // classify by payment method
      const paymentMap = {}; // method -> { label, rev, count, receipts: [] }
      todays.forEach(r => {
        try{
          const method = (r.paymentMethod || r.payment || r.method || 'Unknown').toString();
          if(!paymentMap[method]) paymentMap[method] = { label: method, rev: 0, count: 0, receipts: [] };
          const rev = Number(r._rev || r.total || r.totalAmount || 0) || 0;
          paymentMap[method].rev += rev;
          paymentMap[method].count += 1;
          paymentMap[method].receipts.push(r);
        }catch(e){}
      });

      // build HTML for payment summary and grouped receipts
      // build vertical, colored payment cards
      const paymentSummaryHtml = (()=>{
        const keys = Object.keys(paymentMap);
        if(!keys.length) return '<div style="color:var(--muted)">No payments recorded today</div>';
        const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
        const items = keys.map((k, idx)=>{
          const p = paymentMap[k];
          const color = colors[idx % colors.length];
          return `<div class="payment-card" data-method="${k}" style="--card-color:${color}"><div class="payment-label">${p.label}</div><div class="payment-meta"><div class="payment-rev">${p.rev.toFixed(2)} Birr</div><div class="payment-count">${p.count} receipts</div></div></div>`;
        });
        return `<div class="payment-list">${items.join('')}</div>`;
      })();

      const groupedReceiptsHtml = Object.keys(paymentMap).length ? Object.keys(paymentMap).map(k=>{
        const p = paymentMap[k];
        const rows = p.receipts.sort((a,b)=> (b._ts||0) - (a._ts||0)).map(r=>{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${(Number(r._rev)||0).toFixed(2)} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleTimeString()}</div></div></div>` }).join('');
        return `<div style="margin-top:10px"><h4 style="margin:6px 0">${p.label} — ${p.count} receipts</h4>${rows}</div>`;
      }).join('') : '<div style="color:var(--muted)">No receipts today</div>';

      contentArea.innerHTML = `
        <section class="card">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <h3 style="margin:0">Daily summary — <span id="selectedDateTitle">${new Date().toLocaleDateString()}</span></h3>
            <div style="display:flex;gap:8px;align-items:center">
              <button id="prevDayBtn" class="btn">◀ Prev</button>
              <button id="nextDayBtn" class="btn">Next ▶</button>
            </div>
          </div>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px">
            <div id="dailyTotalSummary" style="font-weight:700;font-size:18px">${totalToday.toFixed(2)} Birr</div>
            <div id="dailyCountSummary" style="color:var(--muted)">(${todays.length} receipts)</div>
          </div>
          <div style="margin-top:12px" class="chart-wrap"><canvas id="dailyChart" class="chart-canvas" style="height:200px"></canvas></div>
          <h4 style="margin-top:12px">Payments</h4>
          <div id="dailyPayments">${paymentSummaryHtml}</div>
          <h4 style="margin-top:12px">Receipts by payment method</h4>
          <div id="dailyReceipts">${groupedReceiptsHtml}</div>
        </section>
      `;
      // chart
      try{
        if(window.periodChartInstance && typeof window.periodChartInstance.destroy === 'function'){ try{ window.periodChartInstance.destroy(); }catch(e){} window.periodChartInstance = null; }
        if(typeof Chart !== 'undefined'){
          const ctx = document.getElementById('dailyChart') && document.getElementById('dailyChart').getContext ? document.getElementById('dailyChart').getContext('2d') : null;
          if(ctx){
            window.periodChartInstance = new Chart(ctx, { type: 'bar', data: { labels: Array.from({length:24}).map((_,i)=> i+':00'), datasets:[{ label:'Revenue', data: Array.from({length:24}).map((_,i)=> Number((hourMap[i]||0).toFixed(2))), backgroundColor:'rgba(59,130,246,0.9)' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
          }
        }
      }catch(e){}

      // --- add prev/next day navigation and dynamic daily rendering ---
      try{
        const salesAll = sales; // reuse sales array from above
        const selDateTitle = document.getElementById('selectedDateTitle');
        const prevBtn = document.getElementById('prevDayBtn');
        const nextBtn = document.getElementById('nextDayBtn');
        const totalEl = document.getElementById('dailyTotalSummary');
        const countEl = document.getElementById('dailyCountSummary');
        const paymentsEl = document.getElementById('dailyPayments');
        const receiptsEl = document.getElementById('dailyReceipts');

        const formatKey = d => d.toISOString().slice(0,10);
        let selectedDate = new Date();
        let selectedKey = formatKey(selectedDate);

        function renderDailyFor(key){
          // compute data for given date key (YYYY-MM-DD)
          const hourMapLocal = {}; for(let h=0;h<24;h++) hourMapLocal[h]=0;
          const dayReceipts = [];
          salesAll.forEach(s=>{
            try{
              const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now());
              if(d.toISOString().slice(0,10) !== key) return;
              let rev = 0;
              if(Array.isArray(s.items) && s.items.length){ s.items.forEach(it=> { rev += Number(it.subtotal || (it.price*it.quantity)) || 0; }); }
              else rev = Number(s.total || s.totalAmount || 0) || 0;
              hourMapLocal[d.getHours()] += rev;
              dayReceipts.push(Object.assign({}, s, {_rev: rev, _ts: d.getTime()}));
            }catch(e){}
          });

          const total = dayReceipts.reduce((a,b)=> a + (Number(b._rev)||0), 0);
          totalEl.textContent = `${total.toFixed(2)} Birr`;
          countEl.textContent = `(${dayReceipts.length} receipts)`;
          selDateTitle.textContent = new Date(key).toLocaleDateString();

          // payments summary
          const paymentMapLocal = {};
          dayReceipts.forEach(r=>{
            try{ const method = (r.paymentMethod || r.payment || r.method || 'Unknown').toString(); if(!paymentMapLocal[method]) paymentMapLocal[method] = { label: method, rev:0, count:0, receipts: [] }; const rev = Number(r._rev || r.total || r.totalAmount || 0) || 0; paymentMapLocal[method].rev += rev; paymentMapLocal[method].count +=1; paymentMapLocal[method].receipts.push(r); }catch(e){}
          });
          paymentsEl.innerHTML = (()=>{
            const keys = Object.keys(paymentMapLocal);
            if(!keys.length) return '<div style="color:var(--muted)">No payments recorded for this day</div>';
            const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316'];
            const items = keys.map((k, idx)=>{
              const p = paymentMapLocal[k];
              const color = colors[idx % colors.length];
              return `<div class="payment-card" data-method="${k}" style="--card-color:${color}"><div class="payment-label">${p.label}</div><div class="payment-meta"><div class="payment-rev">${p.rev.toFixed(2)} Birr</div><div class="payment-count">${p.count} receipts</div></div></div>`;
            });
            return `<div class="payment-list">${items.join('')}</div>`;
          })();

          // attach click handlers to payment cards to filter receipts by payment method
          try{
            const cards = paymentsEl.querySelectorAll('.payment-card');
            cards.forEach(card => {
              card.addEventListener('click', ()=>{
                try{
                  const method = card.dataset.method || '';
                  // highlight selected
                  cards.forEach(c=> c.classList.remove('selected'));
                  card.classList.add('selected');

                  // filter the day's receipts by this payment method
                  const filtered = (typeof dayReceipts !== 'undefined' ? dayReceipts : []).filter(r => {
                    try{ const m = (r.paymentMethod || r.payment || r.method || 'Unknown').toString(); return m === method; }catch(e){ return false; }
                  });

                  if(!receiptsEl) return;
                  if(!filtered.length){ receiptsEl.innerHTML = `<div style="color:var(--muted)">No receipts for ${method} on this day</div>`; return; }
                  const rows = filtered.map(r=>{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); const total = Number(r._rev || r.total || r.totalAmount || (Array.isArray(r.items)? r.items.reduce((a,b)=> a + (Number(b.subtotal || (b.price*b.quantity))||0),0):0)).toFixed(2); const cashier = r.cashier||''; return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${total} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleString()}</div></div><div style="font-size:13px;color:var(--muted)">${method} • ${cashier}</div></div>` }).join('');
                  receiptsEl.innerHTML = `<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">${method} receipts</div><button id="paymentBackBtn" class="btn">Back</button></div>${rows}`;
                  const back = document.getElementById('paymentBackBtn');
                  if(back) back.addEventListener('click', ()=>{ // restore full day's receipts
                    cards.forEach(c=> c.classList.remove('selected'));
                    if(typeof renderDailyFor === 'function') renderDailyFor(selectedKey); else receiptsEl.innerHTML = (dayReceipts.length ? dayReceipts.map(r=>{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${(Number(r._rev)||0).toFixed(2)} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleTimeString()}</div></div></div>` }).join('') : '<div style="color:var(--muted)">No receipts for this day</div>');
                  });
                }catch(e){}
              });
            });
          }catch(e){}

          // receipts list
          if(!dayReceipts.length){ receiptsEl.innerHTML = '<div style="color:var(--muted)">No receipts for this day</div>'; }
          else{
            const rows = dayReceipts.sort((a,b)=> (b._ts||0) - (a._ts||0)).map(r=>{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${(Number(r._rev)||0).toFixed(2)} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleTimeString()}</div></div></div>` }).join('');
            receiptsEl.innerHTML = rows;
          }

          // update chart (hourMap)
          try{
            if(window.periodChartInstance && typeof window.periodChartInstance.destroy === 'function'){ try{ window.periodChartInstance.destroy(); }catch(e){} window.periodChartInstance = null; }
            if(typeof Chart !== 'undefined'){
              const ctx2 = document.getElementById('dailyChart') && document.getElementById('dailyChart').getContext ? document.getElementById('dailyChart').getContext('2d') : null;
              if(ctx2){
                const data = Array.from({length:24}).map((_,i)=> Number((hourMapLocal[i]||0).toFixed(2)));
                window.periodChartInstance = new Chart(ctx2, { type: 'bar', data: { labels: Array.from({length:24}).map((_,i)=> i+':00'), datasets:[{ label:'Revenue', data: data, backgroundColor:'rgba(59,130,246,0.9)' }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } });
              }
            }
          }catch(e){}

          // next button disabled when selected is today
          const todayKey = formatKey(new Date());
          if(key === todayKey) nextBtn.disabled = true; else nextBtn.disabled = false;
        }

        // wire buttons
        if(prevBtn) prevBtn.addEventListener('click', ()=>{ const d = new Date(selectedKey); d.setDate(d.getDate() - 1); selectedKey = formatKey(d); renderDailyFor(selectedKey); });
        if(nextBtn) nextBtn.addEventListener('click', ()=>{ const d = new Date(selectedKey); d.setDate(d.getDate() + 1); const todayKey = formatKey(new Date()); const newKey = formatKey(d); if(newKey > todayKey) return; selectedKey = newKey; renderDailyFor(selectedKey); });

        // initial render for today
        renderDailyFor(formatKey(new Date()));
      }catch(e){}
    } else if(target === 'summary-weekly'){
      // Weekly summary: group data by weeks starting Monday and ending Sunday
      let store = {}; try{ store = JSON.parse(localStorage.getItem('bakery_app_v1')) || {}; }catch(e){ store = {}; }
      const sales = Array.isArray(store.sales) ? store.sales : [];

      // helper: get Monday of week for a given date
      function getMonday(d){ const dd = new Date(d); const day = dd.getDay(); const diff = (day === 0 ? -6 : 1) - day; dd.setDate(dd.getDate() + diff); dd.setHours(0,0,0,0); return dd; }
      // helper: get Sunday of week for a given monday
      function getSundayFromMonday(m){ const s = new Date(m); s.setDate(s.getDate() + 6); s.setHours(23,59,59,999); return s; }

      // build recent weeks (including current ongoing week). We'll show last 12 weeks by default.
      const weeksToShow = 12;
      const weeks = [];
      const today = new Date();
      // find current week's Monday
      const currentMonday = getMonday(today);
      for(let i=0;i<weeksToShow;i++){
        const monday = new Date(currentMonday); monday.setDate(currentMonday.getDate() - (i * 7)); monday.setHours(0,0,0,0);
        const sunday = getSundayFromMonday(monday);
        weeks.push({ start: monday, end: sunday });
      }

      // compute receipts and totals per week
      const weeksData = weeks.map(w => {
        const receipts = sales.filter(s => {
          try{
            const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now());
            return d.getTime() >= w.start.getTime() && d.getTime() <= w.end.getTime();
          }catch(e){ return false; }
        }).sort((a,b) => new Date(b.saleDate||b.timestamp||Date.now()).getTime() - new Date(a.saleDate||a.timestamp||Date.now()).getTime());
        const total = receipts.reduce((acc, r) => {
          try{
            if(Array.isArray(r.items) && r.items.length) return acc + r.items.reduce((a,b)=> a + (Number(b.subtotal || (b.price*b.quantity))||0), 0);
            return acc + (Number(r.total || r.totalAmount) || 0);
          }catch(e){ return acc; }
        }, 0);
        return { start: w.start, end: w.end, receipts, total };
      });

      // persist archived weeks array key
      const ARCHIVE_KEY = 'bakery_archived_weeks';

      // render UI: chart + week list
      contentArea.innerHTML = `
        <section class="card">
          <h3>Weekly summaries — Monday to Sunday</h3>
          <p class="muted">Weeks run Monday → Sunday. Click a week to view its receipts or archive it.</p>
          <div style="margin-top:8px" class="chart-wrap"><canvas id="weeklyChart" class="chart-canvas" style="height:220px"></canvas></div>
          <div id="weeksList" style="margin-top:12px"></div>
          <div id="weekDetails" style="margin-top:12px"></div>
        </section>
      `;

      // prepare chart data
      try{
        if(window.weeklyChartInstance && typeof window.weeklyChartInstance.destroy === 'function'){ try{ window.weeklyChartInstance.destroy(); }catch(e){} window.weeklyChartInstance = null; }
        if(typeof Chart !== 'undefined'){
          const labels = weeksData.map(w => {
            const s = w.start; const e = w.end;
            const fmt = d => `${d.getDate()}/${d.getMonth()+1}`;
            return `${fmt(s)} - ${fmt(e)}`;
          }).reverse(); // show oldest → newest left→right
          const data = weeksData.map(w => Number(w.total.toFixed(2))).reverse();
          const ctx = document.getElementById('weeklyChart') && document.getElementById('weeklyChart').getContext ? document.getElementById('weeklyChart').getContext('2d') : null;
          if(ctx){
            window.weeklyChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Weekly Revenue', data, backgroundColor: labels.map((_,i)=> i%2? 'rgba(59,130,246,0.9)': 'rgba(99,102,241,0.9)') }] }, options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => `${Number(ctx.raw).toFixed(2)} Birr` } } }, scales:{ y:{ beginAtZero:true } } } });
          }
        }
      }catch(e){}

      // render week list
      try{
        const weeksList = document.getElementById('weeksList');
        const detailsEl = document.getElementById('weekDetails');
        if(weeksList){
          weeksList.innerHTML = weeksData.map((w, idx) => {
            const s = w.start; const e = w.end;
            const label = `${s.toLocaleDateString(undefined,{weekday:'short'})} ${s.toLocaleDateString()} → ${e.toLocaleDateString(undefined,{weekday:'short'})} ${e.toLocaleDateString()}`;
            return `<div class="card" style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-weight:700">Week ${idx+1}</div><div style="font-size:13px;color:var(--muted)">${label}</div></div><div style="text-align:right"><div style="font-weight:800">${w.total.toFixed(2)} Birr</div><div style="margin-top:6px;display:flex;gap:8px;justify-content:flex-end"><button class="btn view-week" data-idx="${idx}">View Receipts</button><button class="btn archive-week" data-idx="${idx}">Archive</button></div></div></div></div>`;
          }).join('');

          // wire view and archive buttons
          weeksList.querySelectorAll('.view-week').forEach(b => b.addEventListener('click', ()=>{
            const idx = Number(b.dataset.idx);
            const w = weeksData[idx];
            if(!detailsEl) return;
            if(!w.receipts.length){ detailsEl.innerHTML = `<div style="color:var(--muted)">No receipts for this week</div>`; return; }
            const rows = w.receipts.map(r=>{ try{ const ts = new Date(r.saleDate||r.timestamp||Date.now()); const total = (Array.isArray(r.items) && r.items.length) ? r.items.reduce((a,b)=> a + (Number(b.subtotal || (b.price*b.quantity))||0),0) : (Number(r.total || r.totalAmount) || 0); return `<div style="padding:8px 0;border-bottom:1px solid #f3f6fb"><div style="display:flex;justify-content:space-between"><div style="font-weight:600">${total.toFixed(2)} Birr</div><div style="font-size:12px;color:var(--muted)">${ts.toLocaleString()}</div></div></div>` }catch(e){ return ''; } }).join('');
            detailsEl.innerHTML = `<div style="margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div style="font-weight:700">Receipts — ${w.start.toLocaleDateString()} → ${w.end.toLocaleDateString()}</div><button id="weekBackBtn" class="btn">Back</button></div><div>${rows}</div>`;
            const back = document.getElementById('weekBackBtn'); if(back) back.addEventListener('click', ()=>{ detailsEl.innerHTML = ''; });
          }));

          weeksList.querySelectorAll('.archive-week').forEach(b => b.addEventListener('click', ()=>{
            const idx = Number(b.dataset.idx);
            const w = weeksData[idx];
            // store archived week in localStorage
            try{
              const raw = localStorage.getItem(ARCHIVE_KEY);
              const arr = raw ? JSON.parse(raw) : [];
              arr.push({ start: w.start.toISOString(), end: w.end.toISOString(), total: w.total, receipts: w.receipts });
              localStorage.setItem(ARCHIVE_KEY, JSON.stringify(arr));
              b.textContent = 'Archived'; b.disabled = true;
            }catch(e){ alert('Unable to archive week'); }
          }));
        }
      }catch(e){}
    } else if(target === 'summary-monthly'){
      // Monthly summary (last 30 days)
      let store = {}; try{ store = JSON.parse(localStorage.getItem('bakery_app_v1')) || {}; }catch(e){ store = {}; }
      const sales = Array.isArray(store.sales) ? store.sales : [];
      const N = 30; const labels = []; const dayMap = {}; for(let i=N-1;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); const k = d.toISOString().slice(0,10); labels.push(k); dayMap[k]=0; }
      const prodMap = {};
      sales.forEach(s=>{ try{ const k = (s.saleDate||'').slice(0,10) || (new Date(s.timestamp||s.ts||Date.now()).toISOString().slice(0,10)); let rev=0; if(Array.isArray(s.items)&&s.items.length){ s.items.forEach(it=>{ const itemRev = Number(it.subtotal || (it.price*it.quantity))||0; rev+=itemRev; const pname = it.productName||it.name||'Unknown'; const key = pname+'|'+(it.price||''); if(!prodMap[key]) prodMap[key]={label:pname,qty:0,rev:0}; prodMap[key].qty += Number(it.quantity||0); prodMap[key].rev += itemRev; }); } else rev = Number(s.total||s.totalAmount||0)||0; if(dayMap.hasOwnProperty(k)) dayMap[k]+=rev; }catch(e){} });
      const data = labels.map(l=> Number((dayMap[l]||0).toFixed(2)));
      const top = Object.keys(prodMap).map(k=>prodMap[k]).sort((a,b)=> b.rev - a.rev).slice(0,12);
      contentArea.innerHTML = `
        <section class="card">
          <h3>Monthly summary — last 30 days</h3>
          <div style="margin-top:8px" class="chart-wrap"><canvas id="monthlyChart" class="chart-canvas" style="height:240px"></canvas></div>
          <h4 style="margin-top:12px">Monthly overview (by month)</h4>
          <div style="margin-top:8px" class="chart-wrap"><canvas id="monthsByNameChart" class="chart-canvas" style="height:240px"></canvas></div>
          <h4 style="margin-top:12px">Top products (30d)</h4>
          <div id="monthlyTop">${top.length ? top.map(p=> `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5fb"><div><strong>${p.label}</strong><div style="font-size:12px;color:var(--muted)">${p.qty} sold</div></div><div style="font-weight:700">${p.rev.toFixed(2)} Birr</div></div>`).join('') : '<div style="color:var(--muted)">No data</div>'}</div>
        </section>
      `;
      try{ if(window.periodChartInstance && typeof window.periodChartInstance.destroy === 'function'){ try{ window.periodChartInstance.destroy(); }catch(e){} window.periodChartInstance=null; } if(typeof Chart!=='undefined'){ const ctx = document.getElementById('monthlyChart') && document.getElementById('monthlyChart').getContext ? document.getElementById('monthlyChart').getContext('2d') : null; if(ctx){ window.periodChartInstance = new Chart(ctx,{ type:'line', data:{ labels: labels.map(l=> new Date(l).toLocaleDateString()), datasets:[{ label:'Revenue', data:data, fill:true, backgroundColor:'rgba(99,102,241,0.12)', borderColor:'rgba(99,102,241,0.95)', tension:0.25 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } } }); } } }catch(e){}
      // --- months-by-name bar chart (Jan..Dec) ---
      try{
        // prepare month buckets (0-11)
        const monthBuckets = new Array(12).fill(0);
        sales.forEach(s=>{
          try{
            const d = new Date(s.saleDate || s.timestamp || s.ts || Date.now());
            const m = d.getMonth();
            let rev = 0;
            if(Array.isArray(s.items) && s.items.length){ s.items.forEach(it=>{ rev += Number(it.subtotal || (it.price*it.quantity)) || 0; }); }
            else rev = Number(s.total || s.totalAmount || 0) || 0;
            monthBuckets[m] += rev;
          }catch(e){}
        });

        if(typeof Chart !== 'undefined'){
          // destroy previous if exists
          if(window.monthsChartInstance && typeof window.monthsChartInstance.destroy === 'function'){ try{ window.monthsChartInstance.destroy(); }catch(e){} window.monthsChartInstance = null; }
          const el = document.getElementById('monthsByNameChart');
          const ctx2 = el && el.getContext ? el.getContext('2d') : null;
          if(ctx2){
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            window.monthsChartInstance = new Chart(ctx2,{ type:'bar', data:{ labels: monthNames, datasets:[{ label: 'Revenue (Birr)', data: monthBuckets.map(v=> Number(v.toFixed(2))), backgroundColor: monthNames.map((_,i)=> i%2? 'rgba(59,130,246,0.9)' : 'rgba(99,102,241,0.9)') }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ callbacks: { label: ctx => `${Number(ctx.raw).toFixed(2)} Birr` } } }, scales:{ y:{ beginAtZero:true } } } });
          }
        }
      }catch(e){}
    }
    // update active class for nav and open parent group when a child is active
    try{
      navLinks.forEach(a=> a.classList.toggle('active', a.dataset.target === target));
      // close all groups then open the one that contains the active child
      const groups = document.querySelectorAll('.nav li.has-children');
      groups.forEach(g=> g.classList.remove('open'));
      const activeChild = Array.from(navLinks).find(a => a.dataset.target === target);
      if(activeChild){ const parent = activeChild.closest('li.has-children'); if(parent) parent.classList.add('open'); }
    }catch(e){}
  }

  function init(){
    if(!guard()) return;
    try{ adminNameEl.textContent = 'Admin'; }catch(e){}
    renderQuickStats();
    // bind sidebar nav; parent links without data-target will toggle their child menu
    try{
      navLinks.forEach(a => {
        a.addEventListener('click', (ev)=>{
          ev.preventDefault();
          const t = a.dataset.target;
          // if no data-target, treat as a parent toggle (do not call renderContent)
          if(!t){
            try{
              const li = a.closest('li');
              if(li && li.classList.contains('has-children')) li.classList.toggle('open');
            }catch(e){}
            return;
          }
          renderContent(t);
        });
      });
    }catch(e){}
    // bind logout buttons
    if(btnLogout){ btnLogout.addEventListener('click', ()=>{ try{ localStorage.removeItem(ROLE_KEY); window.location.href = 'login.html'; }catch(e){ window.location.href = 'login.html'; } }); }
    if(btnLogoutSide){ btnLogoutSide.addEventListener('click', ()=>{ try{ localStorage.removeItem(ROLE_KEY); window.location.href = 'login.html'; }catch(e){ window.location.href = 'login.html'; } }); }
    // initial content
    renderContent('dashboard');
  }

  init();
})();
