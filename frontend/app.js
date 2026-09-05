const state = {
  token: localStorage.getItem('token') || null,
  student: JSON.parse(localStorage.getItem('student') || 'null'),
  cycles: [],
  selectedCycle: null,
  selectedSubjects: [],
  lastFeeBreakdown: null,
  lastResidenceApplication: { applied: false }
};

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function setSession(token, student) {
  state.token = token;
  state.student = student;
  localStorage.setItem('token', token);
  localStorage.setItem('student', JSON.stringify(student));
  updateAuthUI();
}

function clearSession() {
  state.token = null;
  state.student = null;
  localStorage.removeItem('token');
  localStorage.removeItem('student');
  updateAuthUI();
}

function updateAuthUI() {
  const chip = document.getElementById('userChip');
  const protectedTabs = ['dashboard', 'registration', 'payments'];

  if (state.student) {
    chip.textContent = `${state.student.firstName} ${state.student.lastName} (${state.student.studentNumber})`;
    chip.classList.remove('hidden');
    protectedTabs.forEach(t => {
      document.querySelector(`.tab-btn[data-tab="${t}"]`).disabled = false;
    });
    switchTab('dashboard');
    loadDashboard();
    loadCycles();
  } else {
    chip.classList.add('hidden');
    protectedTabs.forEach(t => {
      document.querySelector(`.tab-btn[data-tab="${t}"]`).disabled = true;
    });
    switchTab('auth');
  }
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${name}`);
  });
}

document.getElementById('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab-btn');
  if (!btn || btn.disabled) return;
  switchTab(btn.dataset.tab);
});

// --- Auth ---
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('registerMessage');
  msg.textContent = '';
  msg.className = 'form-message';

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const data = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    msg.textContent = 'Registered successfully! You are now logged in.';
    msg.classList.add('success');
    form.reset();
    setSession(data.token, data.student);
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const msg = document.getElementById('loginMessage');
  msg.textContent = '';
  msg.className = 'form-message';

  const payload = Object.fromEntries(new FormData(form).entries());

  try {
    const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    msg.textContent = 'Logged in!';
    msg.classList.add('success');
    form.reset();
    setSession(data.token, data.student);
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

// --- Dashboard ---
async function loadDashboard() {
  try {
    const data = await api('/api/students/dashboard');
    const stats = data.dashboard.paymentStats || {};
    const statsGrid = document.getElementById('statsGrid');
    const statuses = ['pending', 'authorized', 'captured', 'refunded'];
    statsGrid.innerHTML = statuses.map(status => `
      <div class="stat-card">
        <div class="value">${stats[status]?.count || 0}</div>
        <div class="label">${status}</div>
      </div>
    `).join('');

    const recentPayments = document.getElementById('recentPayments');
    if (data.dashboard.recentPayments.length === 0) {
      recentPayments.innerHTML = '<p class="hint">No payments yet — go to "Register for Courses" to make one.</p>';
    } else {
      recentPayments.innerHTML = data.dashboard.recentPayments.map(renderPaymentItem).join('');
    }
  } catch (err) {
    if (err.message.includes('token') || err.message.includes('user')) clearSession();
  }
}

function renderPaymentItem(payment) {
  return `
    <div class="list-item">
      <div class="meta">
        <strong>${payment.paymentReference}</strong><br>
        R${payment.amount} &middot; ${payment.selectedCampus || ''}
      </div>
      <span class="status-badge ${payment.status}">${payment.status}</span>
    </div>
  `;
}

// --- Registration cycles ---
async function loadCycles() {
  try {
    const data = await api('/api/registration/cycles');
    state.cycles = data.cycles;
    const select = document.getElementById('cycleSelect');
    select.innerHTML = state.cycles.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (state.cycles.length) onCycleChange();
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('cycleSelect').addEventListener('change', onCycleChange);
document.getElementById('campusSelect').addEventListener('change', renderSubjects);

function onCycleChange() {
  const cycleId = document.getElementById('cycleSelect').value;
  state.selectedCycle = state.cycles.find(c => c.id === cycleId);
  if (!state.selectedCycle) return;

  const campusSelect = document.getElementById('campusSelect');
  campusSelect.innerHTML = state.selectedCycle.campuses
    .filter(c => c.isActive)
    .map(c => `<option value="${c.id}">${c.name}</option>`)
    .join('');

  renderSubjects();
}

function renderSubjects() {
  const campus = document.getElementById('campusSelect').value;
  const subjects = (state.selectedCycle?.subjects || []).filter(s => s.isActive && s.campus === campus);
  const list = document.getElementById('subjectsList');
  list.innerHTML = subjects.map(s => `
    <label class="checkbox-row">
      <input type="checkbox" value="${s.id}" class="subject-checkbox">
      ${s.code} - ${s.name} (R${s.fee})
    </label>
  `).join('');

  document.getElementById('feeBreakdown').classList.add('hidden');
  document.getElementById('payForm').classList.add('hidden');
}

document.getElementById('calculateFeesBtn').addEventListener('click', async () => {
  const msg = document.getElementById('registrationMessage');
  msg.textContent = '';
  msg.className = 'form-message';

  const selectedIds = [...document.querySelectorAll('.subject-checkbox:checked')].map(cb => cb.value);
  if (selectedIds.length === 0) {
    msg.textContent = 'Select at least one subject.';
    msg.classList.add('error');
    return;
  }

  const residenceApplied = document.getElementById('residenceCheckbox').checked;
  state.lastResidenceApplication = { applied: residenceApplied, residenceType: residenceApplied ? 'on-campus' : undefined };
  state.selectedSubjects = selectedIds.map(subjectId => ({ subjectId }));

  try {
    const data = await api(`/api/registration/cycles/${state.selectedCycle.id}/calculate-fees`, {
      method: 'POST',
      body: JSON.stringify({
        selectedSubjects: state.selectedSubjects,
        residenceApplication: state.lastResidenceApplication
      })
    });

    state.lastFeeBreakdown = data.feeBreakdown;
    const breakdown = document.getElementById('feeBreakdown');
    breakdown.classList.remove('hidden');
    breakdown.innerHTML = `
      <div class="row"><span>Registration Fee</span><span>R${data.feeBreakdown.registrationFee}</span></div>
      <div class="row"><span>Subject Fees</span><span>R${data.feeBreakdown.subjectFees}</span></div>
      <div class="row"><span>Residence Fee</span><span>R${data.feeBreakdown.residenceFee}</span></div>
      <div class="row total"><span>Total</span><span>R${data.feeBreakdown.totalAmount}</span></div>
    `;
    document.getElementById('payForm').classList.remove('hidden');
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

document.getElementById('payForm').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = document.getElementById('registrationMessage');
  msg.textContent = '';
  msg.className = 'form-message';

  const bankingDetails = Object.fromEntries(new FormData(e.target).entries());
  const campus = document.getElementById('campusSelect').value;

  try {
    const data = await api('/api/payments/authorize', {
      method: 'POST',
      body: JSON.stringify({
        registrationCycleId: state.selectedCycle.id,
        selectedCampus: campus,
        selectedSubjects: state.selectedSubjects,
        bankingDetails,
        residenceApplication: state.lastResidenceApplication
      })
    });

    msg.textContent = `Payment authorized! Reference: ${data.payment.paymentReference}. It will show as "authorized" in a couple of seconds.`;
    msg.classList.add('success');
    e.target.reset();
    e.target.classList.add('hidden');
    document.getElementById('feeBreakdown').classList.add('hidden');
    loadDashboard();
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add('error');
  }
});

// --- Payments list ---
document.getElementById('refreshPaymentsBtn').addEventListener('click', loadPayments);

async function loadPayments() {
  const list = document.getElementById('paymentsList');
  try {
    const data = await api('/api/payments');
    if (data.payments.length === 0) {
      list.innerHTML = '<p class="hint">No payments yet.</p>';
      return;
    }
    list.innerHTML = data.payments.map(p => `
      <div class="list-item" data-id="${p.id}">
        <div class="meta">
          <strong>${p.paymentReference}</strong><br>
          R${p.amount} &middot; ${p.selectedCampus || ''} &middot; ${new Date(p.createdAt).toLocaleDateString()}
        </div>
        <span class="status-badge ${p.status}">${p.status}</span>
        <div class="actions">
          ${p.status === 'authorized' ? `<button class="btn btn-outline" data-action="capture" data-id="${p.id}">Capture</button>` : ''}
          ${(p.status === 'pending' || p.status === 'authorized') ? `<button class="btn btn-outline" data-action="cancel" data-id="${p.id}">Cancel</button>` : ''}
          ${p.status === 'captured' ? `<button class="btn btn-outline" data-action="refund" data-id="${p.id}">Refund</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p class="hint">${err.message}</p>`;
  }
}

document.getElementById('paymentsList').addEventListener('click', async e => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  try {
    if (action === 'capture') {
      await api(`/api/payments/capture/${id}`, { method: 'POST' });
    } else if (action === 'cancel') {
      await api(`/api/payments/cancel/${id}`, { method: 'POST' });
    } else if (action === 'refund') {
      await api(`/api/payments/refund/${id}`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Demo refund requested by student' })
      });
    }
    setTimeout(loadPayments, 500);
  } catch (err) {
    alert(err.message);
  }
});

document.querySelector('.tab-btn[data-tab="payments"]').addEventListener('click', loadPayments);

// Init
updateAuthUI();
