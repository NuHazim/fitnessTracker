// Profile Modal
const modal    = document.getElementById('profileModal');
const openBtn  = document.querySelector('.profileButton');
const closeBtn = document.getElementById('closeProfileModal');
const toast    = document.getElementById('toast');

function showToast(msg, type = 'success') {
  const el = document.getElementById('pm-inline-msg');
  el.textContent = msg;
  el.style.display = 'flex';
  el.style.background = type === 'error' ? '#fff5f5' : '#f0fdf4';
  el.style.color = type === 'error' ? '#7f1d1d' : '#065f46';
  el.style.border = type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0';
  // prepend a small icon
  el.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${msg}`;
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

openBtn.addEventListener('click', () => {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  const saved = JSON.parse(localStorage.getItem('pm_profile') || '{}');
  if (saved.name)        document.getElementById('fullName').value    = saved.name;
  if (saved.email)       document.getElementById('email').value       = saved.email;
  if (saved.age)         document.getElementById('age').value         = saved.age;
  if (saved.weight)      document.getElementById('weight').value      = saved.weight;
  if (saved.height)      document.getElementById('height').value      = saved.height;
  if (saved.fitnessGoal) document.getElementById('fitnessGoal').value = saved.fitnessGoal;
});

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

document.querySelectorAll('.pm-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.pm-tab').forEach(t => t.className = 'pm-tab');
    document.querySelectorAll('.pm-panel').forEach(p => p.classList.remove('active'));
    tab.className = target === 'danger' ? 'pm-tab active-danger' : 'pm-tab active';
    document.getElementById('panel-' + target).classList.add('active');
  });
});

document.querySelectorAll('.pw-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fa-regular fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fa-regular fa-eye';
    }
  });
});

document.getElementById('saveProfile').addEventListener('click', () => {
  const name = document.getElementById('fullName').value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }
  const data = {
    name,
    email:       document.getElementById('email').value.trim(),
    age:         document.getElementById('age').value,
    weight:      document.getElementById('weight').value,
    height:      document.getElementById('height').value,
    fitnessGoal: document.getElementById('fitnessGoal').value.trim(),
  };
  localStorage.setItem('pm_profile', JSON.stringify(data));
  showToast('Profile saved successfully!', 'success');
});

document.getElementById('updatePassword').addEventListener('click', () => {
  const cur  = document.getElementById('currentPw').value;
  const nw   = document.getElementById('newPw').value;
  const conf = document.getElementById('confirmPw').value;
  if (!cur || !nw || !conf) { showToast('Please fill in all password fields.', 'error'); return; }
  if (nw.length < 8)        { showToast('New password must be at least 8 characters.', 'error'); return; }
  if (nw !== conf)          { showToast('Passwords do not match.', 'error'); return; }
  document.getElementById('currentPw').value = document.getElementById('newPw').value = document.getElementById('confirmPw').value = '';
  showToast('Password updated successfully!', 'success');
});

// Delete Account
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteCancelBtn   = document.getElementById('deleteCancelBtn');
const deleteConfirmBtn  = document.getElementById('deleteConfirmBtn');

document.getElementById('deleteAccount').addEventListener('click', () => {
  deleteConfirmModal.style.display = 'flex';
});

deleteCancelBtn.addEventListener('click', () => {
  deleteConfirmModal.style.display = 'none';
});

deleteConfirmBtn.addEventListener('click', () => {
  deleteConfirmModal.style.display = 'none';
  localStorage.clear();
  showToast('Account deleted. Redirecting…', 'error');
  setTimeout(() => { window.location.href = 'index.html'; }, 2000);
});

// close on backdrop click
deleteConfirmModal.addEventListener('click', e => {
  if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
});