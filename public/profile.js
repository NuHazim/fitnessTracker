// Profile Modal
const modal    = document.getElementById('profileModal');
const openBtn  = document.querySelector('.profileButton');
const closeBtn = document.getElementById('closeProfileModal');
const toast    = document.getElementById('toast');

document.addEventListener('DOMContentLoaded', () => {
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');

  if (!activeUser.email) return; // not logged in, do nothing

  // Sidebar (exists on all pages)
  const sidebarUsername = document.getElementById('sidebarUsername');
  const sidebarEmail = document.getElementById('sidebarEmail');

  if (sidebarUsername) sidebarUsername.textContent = activeUser.name || 'User';
  if (sidebarEmail) sidebarEmail.textContent = activeUser.email || '';

  // Dashboard only (safe because we check if it exists)
  const usernameBox = document.getElementById('usernameBox');
  if (usernameBox) usernameBox.textContent = activeUser.name || 'User';
});

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

  // Get logged-in user
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');

  // Get this specific user's profile data
  const savedProfile = JSON.parse(
    localStorage.getItem(`profile_${activeUser.email}`) || '{}'
  );

  // Fill basic info from login
  if (activeUser.name)  document.getElementById('fullName').value = activeUser.name;
  if (activeUser.email) document.getElementById('email').value    = activeUser.email;

  // Fill additional profile info
  if (savedProfile.age)         document.getElementById('age').value         = savedProfile.age;
  if (savedProfile.weight)      document.getElementById('weight').value      = savedProfile.weight;
  if (savedProfile.height)      document.getElementById('height').value      = savedProfile.height;
  if (savedProfile.fitnessGoal) document.getElementById('fitnessGoal').value = savedProfile.fitnessGoal;
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

  const activeUser = JSON.parse(localStorage.getItem('activeUser'));

  //  Update active user
  activeUser.name = data.name;
  localStorage.setItem('activeUser', JSON.stringify(activeUser));

  //  Save profile
  localStorage.setItem(
    `profile_${activeUser.email}`,
    JSON.stringify(data)
  );

  //  UPDATE UI IMMEDIATELY 

  const sidebarUsername = document.getElementById('sidebarUsername');
  const usernameBox = document.getElementById('usernameBox');

  if (sidebarUsername) sidebarUsername.textContent = data.name;
  if (usernameBox) usernameBox.textContent = data.name;

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