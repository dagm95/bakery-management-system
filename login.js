// Simple role-based login
(function(){
  const FORM_ID = 'bakery_user_role';
  const form = document.getElementById('loginForm');
  const notice = document.getElementById('loginNotice');
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('loginPassword');

  function setNotice(msg, ms){
    if(!notice) return;
    notice.textContent = msg || '';
    if(ms && ms>0){ setTimeout(()=>{ if(notice) notice.textContent = ''; }, ms); }
  }

  // Load role passwords from localStorage if present, otherwise use defaults
  function loadRolePasswords(){
    const key = 'bakery_role_passwords';
    try{
      const raw = localStorage.getItem(key);
      if(raw){
        const parsed = JSON.parse(raw);
        return Object.assign({ admin: 'admin123', cashir: 'cashir123', manager: 'manager123' }, parsed || {});
      }
    }catch(e){}
    return { admin: 'admin123', cashir: 'cashir123', manager: 'manager123' };
  }

  function getSelectedRole(){
    const r = form.querySelector('input[name="role"]:checked');
    return r ? r.value : null;
  }

  function saveRole(role){
    try{ localStorage.setItem(FORM_ID, role); }catch(e){}
  }

  function restoreRole(){
    try{
      const v = localStorage.getItem(FORM_ID);
      if(v){
        const el = form.querySelector(`input[name="role"][value="${v}"]`);
        if(el) el.checked = true;
      }
    }catch(e){}
  }

  function redirectForRole(role){
    if(!role) return;
    if(role === 'cashir'){
      window.location.href = 'cashir.html';
    } else if(role === 'admin'){
      window.location.href = 'admin.html';
    } else if(role === 'manager'){
      // manager shares summary view; adjust if you have a dedicated manager page
      window.location.href = 'daily-summary.html';
    } else {
      // fallback
      window.location.href = 'cashir.html';
    }
  }

  if(form){
    restoreRole();
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const role = getSelectedRole();
      if(!role){ setNotice('Please select a role to continue', 3000); return; }
      const pw = passwordInput ? String(passwordInput.value || '') : '';
  // load current role passwords (stored in localStorage)
  const ROLE_PASSWORDS = loadRolePasswords();
  const expected = ROLE_PASSWORDS[role] || '';
      if(expected !== pw){
        setNotice('Incorrect password for selected role', 3000);
        try{ if(passwordInput){ passwordInput.focus(); passwordInput.select(); } }catch(e){}
        return;
      }
      // success
      saveRole(role);
      setNotice('Signing in…', 600);
      setTimeout(()=>{ redirectForRole(role); }, 300);
    });

    // allow clicking the label (role-row) to toggle radio
    Array.from(form.querySelectorAll('.role-row')).forEach(row => {
      row.addEventListener('click', (ev)=>{
        try{
          const input = row.querySelector('input[type=radio]');
          if(input){ input.checked = true; }
          // focus password input to encourage entering password
          if(passwordInput) passwordInput.focus();
        }catch(e){}
      });
    });

    // keyboard: Enter when a role is selected triggers submit
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        const role = getSelectedRole();
        // allow submit only if a role is selected; let the form handle it otherwise
        if(role){ e.preventDefault(); loginBtn.click(); }
      }
    });
  }
})();
