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
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'flex';
  el.style.background = type === 'error' ? '#fff5f5' : '#f0fdf4';
  el.style.color = type === 'error' ? '#7f1d1d' : '#065f46';
  el.style.border = type === 'error' ? '1px solid #fecaca' : '1px solid #bbf7d0';
  // prepend a small icon
  el.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i> ${msg}`;
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// OPEN BTN: Shows modal and pulls initial data from MongoDB Atlas
openBtn.addEventListener('click', () => {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Get logged-in user
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');

  // Fill basic info from login session
  if (activeUser.name)  document.getElementById('fullName').value = activeUser.name;
  if (activeUser.email) document.getElementById('email').value    = activeUser.email;

  // FETCH ADDITIONAL METRICS DIRECTLY FROM MONGODB ATLAS (Single Model)
  fetch(`/api/profile/${activeUser.email}`)
    .then(res => res.json())
    .then(data => {
      // Maps directly to the embedded profile sub-object sent by the backend
      if (document.getElementById('age'))         document.getElementById('age').value         = data.age || '';
      if (document.getElementById('weight'))      document.getElementById('weight').value      = data.weight || '';
      if (document.getElementById('height'))      document.getElementById('height').value      = data.height || '';
      if (document.getElementById('fitnessGoal')) document.getElementById('fitnessGoal').value = data.fitnessGoal || '';
    })
    .catch(err => {
      console.error("Database connection fault, fallback to local storage:", err);
      // Fallback if server or DB goes offline down the road
      const savedProfile = JSON.parse(localStorage.getItem(`profile_${activeUser.email}`) || '{}');
      if (savedProfile.age)         document.getElementById('age').value         = savedProfile.age;
      if (savedProfile.weight)      document.getElementById('weight').value      = savedProfile.weight;
      if (savedProfile.height)      document.getElementById('height').value      = savedProfile.height;
      if (savedProfile.fitnessGoal) document.getElementById('fitnessGoal').value = savedProfile.fitnessGoal;
    });
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

// SAVE BTN: Updates the UI, checks validation, and posts directly to MongoDB (Single Model Setup)
document.getElementById('saveProfile').addEventListener('click', () => {
  const name = document.getElementById('fullName').value.trim();
  if (!name) { showToast('Full name is required.', 'error'); return; }

  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');
  if (!activeUser.email) return;

  // Build the flat body structure that your new server.js endpoint parameters expect
  const unifiedPayload = {
    name:        name,
    email:       activeUser.email, // Passing 'email' explicitly to find user
    age:         document.getElementById('age').value,
    weight:      document.getElementById('weight').value,
    height:      document.getElementById('height').value,
    fitnessGoal: document.getElementById('fitnessGoal').value.trim(),
  };

  // Update local active user cache session elements immediately
  activeUser.name = unifiedPayload.name;
  localStorage.setItem('activeUser', JSON.stringify(activeUser));
  localStorage.setItem(`profile_${activeUser.email}`, JSON.stringify(unifiedPayload));

  // Update layout header widgets immediately
  const sidebarUsername = document.getElementById('sidebarUsername');
  const usernameBox = document.getElementById('usernameBox');
  if (sidebarUsername) sidebarUsername.textContent = unifiedPayload.name;
  if (usernameBox) usernameBox.textContent = unifiedPayload.name;

  // POST METRICS SECURELY TO THE UNIFIED USER ROUTE
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(unifiedPayload)
  })
  .then(res => res.json())
  .then(responseData => {
    if (responseData.success) {
      showToast('Profile saved successfully!', 'success');
    } else {
      showToast('Profile sync failed, saved locally instead.', 'error');
    }
  })
  .catch(err => {
    console.error("Database connection fault:", err);
    showToast('Saved locally. Database sync failed.', 'error');
  });
});

// STRICT PASSWORD UPDATE HANDLER
document.getElementById('updatePassword').addEventListener('click', () => {
  const cur  = document.getElementById('currentPw').value;
  const nw   = document.getElementById('newPw').value;
  const conf = document.getElementById('confirmPw').value;

  if (!cur || !nw || !conf) { showToast('Please fill in all password fields.', 'error'); return; }
  if (nw.length < 8)        { showToast('New password must be at least 8 characters.', 'error'); return; }
  if (nw !== conf)          { showToast('Passwords do not match.', 'error'); return; }
  
  // Frontend Guard Check: Prevent submitting same password right away
  if (cur === nw) { 
    showToast('New password cannot be the same as your current password.', 'error'); 
    return; 
  }

  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');
  if (!activeUser.email) return;

  const passwordPayload = {
    email: activeUser.email,
    currentPassword: cur,
    newPassword: nw
  };

  fetch('/api/profile/update-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passwordPayload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      showToast(data.message, 'success');
      // Clear out the text inputs
      document.getElementById('currentPw').value = '';
      document.getElementById('newPw').value = '';
      document.getElementById('confirmPw').value = '';
    } else {
      showToast(data.message || 'Failed to update password.', 'error');
    }
  })
  .catch(err => {
    console.error("Password update transmission failure:", err);
    showToast('Server communication failure updating password.', 'error');
  });
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

// FULL CASCADE ACCOUNT DELETION HANDLER
deleteConfirmBtn.addEventListener('click', () => {
  const activeUser = JSON.parse(localStorage.getItem('activeUser') || '{}');
  if (!activeUser.email) return;

  deleteConfirmModal.style.display = 'none';

  // Issue DELETE request to drop document bindings and associated historical maps
  fetch('/api/profile/delete-account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: activeUser.email })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Clear out local session data tracking completely
      localStorage.clear();
      showToast('Account and all logs deleted. Redirecting to login…', 'error');
      setTimeout(() => { window.location.href = 'Login.html'; }, 2000);
    } else {
      showToast(data.message || 'Failed to clear database logs.', 'error');
    }
  })
  .catch(err => {
    console.error("Account erasure synchronization error:", err);
    showToast('Database connection offline. Data preservation fallback triggered.', 'error');
  });
});

// close on backdrop click
deleteConfirmModal.addEventListener('click', e => {
  if (e.target === deleteConfirmModal) deleteConfirmModal.style.display = 'none';
});