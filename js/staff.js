    /* ========= Generic custom alert/confirm utilities ========= */
    const genericAlert = document.getElementById('genericAlert');
    const genericTitle = document.getElementById('genericAlertTitle');
    const genericMsg = document.getElementById('genericAlertMessage');
    const genericExtra = document.getElementById('genericAlertExtra');
    const btnCancel = document.getElementById('genericCancelBtn');
    const btnOk = document.getElementById('genericOkBtn');
    const btnDanger = document.getElementById('genericDangerBtn');

    // hide all control buttons initially
    function _hideAllGenericButtons() {
      btnCancel.style.display = 'none';
      btnOk.style.display = 'none';
      btnDanger.style.display = 'none';
    }

    function _showGenericOverlay() {
      genericAlert.style.display = 'flex';
      genericAlert.setAttribute('aria-hidden', 'false');
      // trap focus? basic: focus OK or Cancel
      setTimeout(()=> {
        (btnOk.style.display !== 'none' ? btnOk : (btnCancel.style.display !== 'none' ? btnCancel : btnDanger)).focus();
      }, 50);
    }

    function _closeGenericOverlay() {
      genericAlert.style.display = 'none';
      genericAlert.setAttribute('aria-hidden', 'true');
    }

    // showAlert: simple OK box (returns a Promise resolved when user closes)
    function showAlert({ title = 'Notice', message = '', extra = '' } = {}) {
      return new Promise((resolve) => {
        _hideAllGenericButtons();
        genericTitle.textContent = title;
        genericMsg.innerHTML = message;
        genericExtra.textContent = extra || '';
        btnOk.textContent = 'OK';
        btnOk.style.display = '';
        btnOk.onclick = () => { _closeGenericOverlay(); resolve(); };
        // allow cancel via overlay click or ESC
        genericAlert.onclick = (e) => { if (e.target === genericAlert) { _closeGenericOverlay(); resolve(); } };
        document.onkeydown = (e) => { if (e.key === 'Escape') { _closeGenericOverlay(); resolve(); } };
        _showGenericOverlay();
      });
    }

    // showConfirm: returns Promise<boolean>
    function showConfirm({ title = 'Confirm', message = '', confirmText = 'Yes', cancelText = 'Cancel', danger = false } = {}) {
      return new Promise((resolve) => {
        _hideAllGenericButtons();
        genericTitle.textContent = title;
        genericMsg.innerHTML = message;
        genericExtra.textContent = '';
        if (danger) {
          btnDanger.textContent = confirmText;
          btnDanger.style.display = '';
        } else {
          btnOk.textContent = confirmText;
          btnOk.style.display = '';
        }
        btnCancel.textContent = cancelText;
        btnCancel.style.display = '';

        btnCancel.onclick = () => { _closeGenericOverlay(); resolve(false); };
        const okHandler = () => { _closeGenericOverlay(); resolve(true); };
        const dangerHandler = () => { _closeGenericOverlay(); resolve(true); };

        btnOk.onclick = okHandler;
        btnDanger.onclick = dangerHandler;

        genericAlert.onclick = (e) => { if (e.target === genericAlert) { _closeGenericOverlay(); resolve(false); } };
        document.onkeydown = (e) => { if (e.key === 'Escape') { _closeGenericOverlay(); resolve(false); } };

        _showGenericOverlay();
      });
    }

    /* ========== Application logic (kept UI same as requested) ========== */

    const form = document.getElementById('householdForm');
    const clearBtn = document.getElementById('clearBtn');
    const previewBtn = document.getElementById('previewBtn');
    const addMemberBtn = document.getElementById('addMemberBtn');
    const membersContainer = document.getElementById('membersContainer');
    const memberTemplate = document.getElementById('memberTemplate');
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    const previewBody = document.getElementById('previewBody');

    function updateMemberIndices(){
      const items = membersContainer.querySelectorAll('.member-card');
      items.forEach((it, idx)=> it.querySelector('.member-index').textContent = idx+1 );
      const headCount = document.getElementById('head_family_members');
      if (headCount) headCount.value = items.length + 1;
    }

    function createMemberCard(){
      const clone = memberTemplate.content.cloneNode(true);
      const card = clone.querySelector('.member-card');

      // delete handler (replaced confirm() with custom confirm)
      const removeBtn = card.querySelector('.remove-member');
      removeBtn.addEventListener('click', async ()=> {
        const ok = await showConfirm({ title: 'Delete Member', message: 'Delete this member?', confirmText: 'Delete', cancelText: 'Cancel', danger: true });
        if(ok) { 
          card.remove(); 
          updateMemberIndices(); 
        }
      });

      // toggle pregnant visibility (no scrolling)
      const sexSelect = card.querySelector('.member-sex');
      const pregWrap = card.querySelector('.member-preg-wrap');
      function togglePregMember(){ if(pregWrap) pregWrap.style.display = (sexSelect.value === 'Female') ? '' : 'none'; }
      if (sexSelect) {
        sexSelect.addEventListener('change', togglePregMember);
        togglePregMember();
      }

      membersContainer.appendChild(clone);
      updateMemberIndices();

      // NOTE: intentionally removed scrollIntoView — stays where user is (bottom button)
    }

    addMemberBtn.addEventListener('click', createMemberCard);

    // head pregnant toggle
    const headSex = document.querySelector('.head-sex');
    const headPregWrap = document.getElementById('headPregWrap');
    function toggleHeadPreg(){ if(headPregWrap && headSex) headPregWrap.style.display = (headSex.value === 'Female') ? '' : 'none'; }
    if (headSex) {
      headSex.addEventListener('change', toggleHeadPreg);
      toggleHeadPreg();
    }

    // clear button: replace confirm() with showConfirm
    clearBtn.addEventListener('click', async ()=>{ 
      const ok = await showConfirm({ title: 'Clear Form', message: 'Clear all fields?', confirmText: 'Clear', cancelText: 'Cancel', danger: false });
      if(ok){
        form.reset(); 
        membersContainer.innerHTML='';
        updateMemberIndices(); 
      }
    });

    // preview handler (there are duplicate preview handlers in original; keeping functionality)
    previewBtn.addEventListener('click', ()=>{ /* the other handler below handles actual preview show, keep this lightweight */ });

    previewBtn.addEventListener('click', (ev) => {
      ev.preventDefault(); // avoid accidental form submit

      const fd = new FormData(form);
      const head = {};
      for (const [k, v] of fd.entries()) {
        if (k.startsWith('head_')) head[k.replace('head_', '')] = v;
      }
      head.pregnant = !!document.getElementById('head_pregnant')?.checked;
      // monthly income will be head.monthly_income if set

      function row(label, value) {
        return `<div class="row mb-1"><div class="col-sm-4 text-muted">${label}</div><div class="col-sm-8">${value || ''}</div></div>`;
      }

      let html = `<div class="mb-3"><h5>Household Head</h5><div class="p-2 border rounded bg-light">`;
      html += row('First name', head.first_name || '');
      html += row('Extension', head.ext_name || '');
      html += row('Middle name', head.middle_name || '');
      html += row('Last name', head.last_name || '');
      html += row('Sex', head.sex || '');
      html += row('Birthday', head.birthday || '');
      html += row('Place of birth', head.place_of_birth || '');
      html += row('Monthly income (PHP)', head.monthly_income || '');
      html += row('Pregnant?', head.pregnant ? 'Yes' : 'No');
      html += `</div></div>`;

      // build members array
      const members = [];
      document.querySelectorAll('#membersContainer .member-card').forEach(card => {
        members.push({
          first: card.querySelector('.member-first-name')?.value || '',
          ext: card.querySelector('.member-ext')?.value || '',
          middle: card.querySelector('.member-middle')?.value || '',
          last: card.querySelector('.member-last')?.value || '',
          sex: card.querySelector('.member-sex')?.value || '',
          birthday: card.querySelector('.member-bday')?.value || '',
          relationship: card.querySelector('.member-relationship')?.value || '',
          pregnant: !!card.querySelector('.member-pregnant')?.checked,
          occupation: card.querySelector('.member-occupation')?.value || '',
          monthly_income: card.querySelector('.member-income')?.value || ''
        });
      });

      if (members.length === 0) {
        html += `<div class="mt-3"><h5>Family Members</h5><div class="p-2 border rounded bg-light">No family members added.</div></div>`;
      } else {
        html += `<div class="mt-3"><h5>Family Members (${members.length})</h5>`;
        members.forEach((m, i) => {
          html += `<div class="p-2 mb-2 border rounded bg-light"><strong>Member ${i+1}</strong>`;
          html += row('Full name', `${m.first} ${m.ext} ${m.middle} ${m.last}`.trim());
          html += row('Sex', m.sex);
          html += row('Birthday', m.birthday);
          html += row('Relationship', m.relationship);
          html += row('Monthly income (PHP)', m.monthly_income);
          html += row('Pregnant?', m.pregnant ? 'Yes' : 'No');
          html += row('Occupation', m.occupation);
          html += `</div>`;
        });
        html += `</div>`;
      }

      previewBody.innerHTML = html;

      // show modal (ensure bootstrap JS is loaded)
      try {
        previewModal.show();
      } catch (err) {
        console.error('Failed to show preview modal:', err);
        showAlert({ title: 'Preview failed', message: 'Preview failed — open console to see error.' });
      }
    });

    // form submit: replace alert() with showAlert
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      if(!form.checkValidity()){ form.reportValidity(); return; }

      const fd = new FormData(form);
      const payload = { head: {}, members: [] };
      for(const [k,v] of fd.entries()) if(k.startsWith('head_')) payload.head[k.replace('head_','')] = v;
      payload.head.pregnant = !!document.getElementById('head_pregnant').checked;

      membersContainer.querySelectorAll('.member-card').forEach(card=>{
        payload.members.push({
          first: card.querySelector('.member-first-name')?.value || '',
          ext: card.querySelector('.member-ext')?.value || '',
          middle: card.querySelector('.member-middle')?.value || '',
          last: card.querySelector('.member-last')?.value || '',
          sex: card.querySelector('.member-sex')?.value || '',
          birthday: card.querySelector('.member-bday')?.value || '',
          place_of_birth: card.querySelector('.member-place')?.value || '',
          pregnant: !!card.querySelector('.member-pregnant')?.checked,
          occupation: card.querySelector('.member-occupation')?.value || '',
          monthly_income: card.querySelector('.member-income')?.value || ''
        });
      });

      console.log('Payload to send:', payload);
      await showAlert({ title: 'Saved', message: 'Registration saved.temporarily (no real backend).'});
      form.reset();
      membersContainer.innerHTML = '';
      updateMemberIndices();
    });

    // Logout button uses existing logoutAlert div — we keep behavior but ensure it's usable
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
      document.getElementById('logoutAlert').style.display = 'flex';
    });

    function closeLogoutAlert() {
      document.getElementById('logoutAlert').style.display = 'none';
    }

    function confirmLogout() {
      window.location.href = 'login.html';
    }

    // initialize member indices on load (if any)
    updateMemberIndices();