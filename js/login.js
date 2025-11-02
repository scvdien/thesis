//example demo code for login functionality

(function(){
  const form = document.getElementById('loginForm');
  const pwd = document.getElementById('password');
  const error = document.getElementById('error');
  const btn = document.getElementById('loginBtn');

  function showError(msg){
    error.textContent = msg;
    error.style.display = 'block';
  }
  function clearError(){ error.textContent=''; error.style.display='none'; }

    form.addEventListener('submit', function(e){
      e.preventDefault();
      clearError();

      const u = form.username.value.trim();
      const p = form.password.value.trim();
      const r = form.role.value;

      if(!u || !p){ showError('Please enter username and password.'); return; }
      if(!r){ showError('Please select a role.'); return; }

      btn.disabled = true;
      btn.textContent = 'Signing in...';
      setTimeout(()=> {
      if(r === 'Admin') window.location.href = 'admin.html';
      else window.location.href = 'staff.html';
      }, 700);
    });

  document.getElementById('forgot').addEventListener('click', function(e){
    e.preventDefault();
    clearError();
    showError('To reset your password, contact the system administrator.');
    });
    document.getElementById('contact').addEventListener('click', function(e){
      e.preventDefault();
      clearError();
      showError('Contact admin: admin@barangaysecrerary-cabarian.local');
    });
    })();