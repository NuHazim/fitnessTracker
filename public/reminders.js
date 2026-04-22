'use strict';

/* ══════════════════════════════════════════════
   STORAGE
══════════════════════════════════════════════ */
var STORAGE_KEY = 'hft_reminders';

function loadReminders() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveReminders(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ══════════════════════════════════════════════
   TYPE METADATA  —  Font Awesome icons only
══════════════════════════════════════════════ */
var TYPE_META = {
  workout: {
    icon:  'fa-solid fa-dumbbell',
    bg:    'icon-workout',
    label: 'workout'
  },
  meal: {
    icon:  'fa-solid fa-utensils',
    bg:    'icon-meal',
    label: 'meal'
  },
  water: {
    icon:  'fa-solid fa-droplet',
    bg:    'icon-water',
    label: 'water'
  },
  custom: {
    icon:  'fa-solid fa-bell',
    bg:    'icon-custom',
    label: 'custom'
  }
};

function getMeta(type) {
  return TYPE_META[type] || TYPE_META.custom;
}

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function generateId() {
  return 'r' + Date.now() + Math.random().toString(36).slice(2, 6);
}

function getCheckedDays(prefix) {
  var days   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var result = [];
  for (var i = 0; i < days.length; i++) {
    var el = document.getElementById(prefix + days[i]);
    if (el && el.checked) result.push(days[i]);
  }
  return result;
}

function setCheckedDays(prefix, selectedDays) {
  var days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  for (var i = 0; i < days.length; i++) {
    var el = document.getElementById(prefix + days[i]);
    if (el) el.checked = selectedDays.indexOf(days[i]) !== -1;
  }
}

function clearValidation(ids) {
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.classList.remove('is-invalid');
  }
}

function showInvalid(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('is-invalid');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
function formatTime(time24) {
  var parts  = time24.split(':');
  var hour   = parseInt(parts[0], 10);
  var minute = parts[1];
  var ampm   = hour >= 12 ? 'PM' : 'AM';
  var hour12 = hour % 12;
  if (hour12 === 0) hour12 = 12;
  return hour12 + ':' + minute + ' ' + ampm;
}

/* ══════════════════════════════════════════════
   RENDER REMINDER LIST
══════════════════════════════════════════════ */
function renderReminders() {
  var reminders = loadReminders();
  var listEl    = document.getElementById('reminderList');
  var countEl   = document.getElementById('activeCount');
  if (!listEl || !countEl) return;

  var enabledCount = 0;
  for (var i = 0; i < reminders.length; i++) {
    if (reminders[i].enabled) enabledCount++;
  }
  countEl.textContent = enabledCount + ' reminder(s) enabled';

  if (reminders.length === 0) {
    listEl.innerHTML =
      '<div class="empty-state">' +
        '<i class="fa-solid fa-bell-slash fa-2x mb-3 d-block"></i>' +
        '<p>No reminders yet. Click <strong>Add Reminder</strong> to get started.</p>' +
      '</div>';
    return;
  }

  var html = '';
  for (var j = 0; j < reminders.length; j++) {
    var r    = reminders[j];
    var meta = getMeta(r.type);

    var daysHtml = '';
    if (r.days && r.days.length > 0) {
      daysHtml =
        '<span class="badge-days">' +
          '<i class="fa-regular fa-calendar"></i> ' +
          r.days.join(', ') +
        '</span>';
    }

    var checkIcon     = r.enabled
      ? '<i class="fa-solid fa-circle-check active-dot"></i>' : '';
    var disabledClass = r.enabled ? '' : ' is-disabled';

    html +=
      '<div class="reminder-item' + disabledClass + '" id="item_' + r.id + '">' +

        '<div class="reminder-icon ' + meta.bg + '">' +
          '<i class="' + meta.icon + '"></i>' +
        '</div>' +

        '<div class="reminder-info">' +
          '<div class="reminder-title">' +
            escHtml(r.title) + ' ' + checkIcon +
          '</div>' +
          '<div class="reminder-msg">' + escHtml(r.message) + '</div>' +
          '<div class="reminder-meta">' +
            '<span class="meta-time">' +
              '<i class="fa-regular fa-clock"></i> ' + formatTime(r.time) +
            '</span>' +
            '<span class="badge-type">' + meta.label + '</span>' +
            daysHtml +
          '</div>' +
        '</div>' +

        '<div class="reminder-actions">' +
          '<div class="form-check form-switch mb-0">' +
            '<input class="form-check-input" type="checkbox" role="switch"' +
              ' data-id="' + r.id + '" data-action="toggle"' +
              (r.enabled ? ' checked' : '') + '>' +
          '</div>' +
          '<button class="btn-icon edit"' +
            ' data-id="' + r.id + '" data-action="edit"' +
            ' title="Edit reminder">' +
            '<i class="fa-solid fa-pencil"></i>' +
          '</button>' +
          '<button class="btn-icon del"' +
            ' data-id="' + r.id + '" data-action="delete"' +
            ' title="Delete reminder">' +
            '<i class="fa-solid fa-trash"></i>' +
          '</button>' +
        '</div>' +

      '</div>';
  }

  listEl.innerHTML = html;
}

/* ══════════════════════════════════════════════
   CREATE
══════════════════════════════════════════════ */
function openCreateModal() {
  document.getElementById('createType').value    = 'workout';
  document.getElementById('createTime').value    = '09:00';
  document.getElementById('createTitle').value   = '';
  document.getElementById('createMessage').value = '';
  clearValidation(['createTitle', 'createMessage']);
  setCheckedDays('c', ['Mon','Tue','Wed','Thu','Fri']);
  new bootstrap.Modal(document.getElementById('createModal')).show();
}

function saveNewReminder() {
  var title   = document.getElementById('createTitle').value.trim();
  var message = document.getElementById('createMessage').value.trim();
  var valid   = true;

  clearValidation(['createTitle', 'createMessage']);
  if (!title)   { showInvalid('createTitle');   valid = false; }
  if (!message) { showInvalid('createMessage'); valid = false; }
  if (!valid) return;

  var list = loadReminders();
  list.push({
    id:      generateId(),
    type:    document.getElementById('createType').value,
    time:    document.getElementById('createTime').value,
    title:   title,
    message: message,
    days:    getCheckedDays('c'),
    enabled: true
  });

  saveReminders(list);
  renderReminders();
  bootstrap.Modal.getInstance(document.getElementById('createModal')).hide();
  showToast('Reminder "' + title + '" created.');
}

/* ══════════════════════════════════════════════
   EDIT
══════════════════════════════════════════════ */
function openEditModal(id) {
  var list = loadReminders();
  var r    = null;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { r = list[i]; break; }
  }
  if (!r) return;

  document.getElementById('editId').value      = r.id;
  document.getElementById('editType').value    = r.type;
  document.getElementById('editTime').value    = r.time;
  document.getElementById('editTitle').value   = r.title;
  document.getElementById('editMessage').value = r.message;
  clearValidation(['editTitle', 'editMessage']);
  setCheckedDays('e', r.days || []);
  new bootstrap.Modal(document.getElementById('editModal')).show();
}

function saveEditedReminder() {
  var title   = document.getElementById('editTitle').value.trim();
  var message = document.getElementById('editMessage').value.trim();
  var valid   = true;

  clearValidation(['editTitle', 'editMessage']);
  if (!title)   { showInvalid('editTitle');   valid = false; }
  if (!message) { showInvalid('editMessage'); valid = false; }
  if (!valid) return;

  var id   = document.getElementById('editId').value;
  var list = loadReminders();

  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i].type    = document.getElementById('editType').value;
      list[i].time    = document.getElementById('editTime').value;
      list[i].title   = title;
      list[i].message = message;
      list[i].days    = getCheckedDays('e');
      break;
    }
  }

  saveReminders(list);
  renderReminders();
  bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
  showToast('Reminder "' + title + '" updated.');
}

/* ══════════════════════════════════════════════
   DELETE  —  with simple confirmation modal
══════════════════════════════════════════════ */
var pendingDeleteId = null;

function deleteReminder(id) {
  pendingDeleteId = id;
  new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function confirmDelete() {
  if (!pendingDeleteId) return;

  var list    = loadReminders();
  var newList = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id !== pendingDeleteId) newList.push(list[i]);
  }

  saveReminders(newList);
  renderReminders();
  bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
  pendingDeleteId = null;
  showToast('Reminder deleted.');
}

/* ══════════════════════════════════════════════
   TOGGLE
══════════════════════════════════════════════ */
function toggleReminder(id, enabled) {
  var list = loadReminders();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { list[i].enabled = enabled; break; }
  }
  saveReminders(list);
  renderReminders();
}

/* ══════════════════════════════════════════════
   PRESETS
══════════════════════════════════════════════ */
function applyPreset(type, title, message, time) {
  var list = loadReminders();
  for (var i = 0; i < list.length; i++) {
    if (list[i].title === title && list[i].time === time) {
      showToast('"' + title + '" is already in your reminders.');
      return;
    }
  }
  list.push({
    id:      generateId(),
    type:    type,
    time:    time,
    title:   title,
    message: message,
    days:    ['Mon','Tue','Wed','Thu','Fri'],
    enabled: true
  });
  saveReminders(list);
  renderReminders();
  showToast('"' + title + '" added to reminders.');
}

/* ══════════════════════════════════════════════
   BROWSER NOTIFICATIONS
══════════════════════════════════════════════ */
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Your browser does not support notifications.');
    return;
  }
  Notification.requestPermission().then(function(perm) {
    if (perm === 'granted') {
      document.getElementById('permissionBanner').style.display = 'none';
      showToast('Notifications enabled.');
    } else {
      alert('Notifications denied. Enable them in your browser settings.');
    }
  });
}

function checkAndFireNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  var now  = new Date();
  var hh   = now.getHours()   < 10 ? '0' + now.getHours()   : '' + now.getHours();
  var mm   = now.getMinutes() < 10 ? '0' + now.getMinutes() : '' + now.getMinutes();
  var hhmm = hh + ':' + mm;

  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var today    = dayNames[now.getDay()];
  var firedKey = 'hft_fired_' + now.toDateString();
  var firedArr = [];

  try { firedArr = JSON.parse(localStorage.getItem(firedKey) || '[]'); }
  catch(e) {}

  var list = loadReminders();
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    if (!r.enabled) continue;
    if (r.time !== hhmm) continue;
    if (r.days && r.days.length > 0 && r.days.indexOf(today) === -1) continue;

    var fireId = r.id + '_' + hhmm;
    if (firedArr.indexOf(fireId) !== -1) continue;

    new Notification(r.title, {
      body: r.message,
      icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png'
    });
    firedArr.push(fireId);
  }

  localStorage.setItem(firedKey, JSON.stringify(firedArr));
}

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast(msg) {
  var t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = [
    'position:fixed',
    'bottom:28px',
    'right:28px',
    'background:#1a1a1a',
    'color:#fff',
    'padding:12px 22px',
    'border-radius:10px',
    'font-size:0.9rem',
    'font-weight:600',
    'z-index:9999',
    'box-shadow:0 4px 16px rgba(0,0,0,0.2)',
    'opacity:1',
    'transition:opacity 0.4s'
  ].join(';');
  document.body.appendChild(t);
  setTimeout(function() {
    t.style.opacity = '0';
    setTimeout(function() { t.remove(); }, 420);
  }, 3000);
}

/* ══════════════════════════════════════════════
   EVENT DELEGATION
══════════════════════════════════════════════ */
function setupListDelegation() {
  var listEl = document.getElementById('reminderList');
  if (!listEl) return;

  listEl.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== listEl) {
      var action = target.getAttribute('data-action');
      var id     = target.getAttribute('data-id');
      if (action && id) {
        if (action === 'edit')   { openEditModal(id);  return; }
        if (action === 'delete') { deleteReminder(id); return; }
      }
      target = target.parentElement;
    }
  });

  listEl.addEventListener('change', function(e) {
    var target = e.target;
    if (target.getAttribute('data-action') === 'toggle') {
      toggleReminder(target.getAttribute('data-id'), target.checked);
    }
  });
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

  renderReminders();
  setupListDelegation();

  var btnAdd = document.getElementById('btnAddReminder');
  if (btnAdd) btnAdd.addEventListener('click', openCreateModal);

  var btnCreate = document.getElementById('btnSaveCreate');
  if (btnCreate) btnCreate.addEventListener('click', saveNewReminder);

  var btnEdit = document.getElementById('btnSaveEdit');
  if (btnEdit) btnEdit.addEventListener('click', saveEditedReminder);

  var btnConfirm = document.getElementById('btnConfirmDelete');
  if (btnConfirm) btnConfirm.addEventListener('click', confirmDelete);

  /* preset cards */
  var presets = [
    { id: 'preset1', type: 'workout', title: 'Morning Workout',
      message: 'Time for your morning workout. Get up and get moving!',
      time: '07:00' },
    { id: 'preset2', type: 'meal',    title: 'Lunch Time',
      message: 'Time for lunch. Remember to eat a healthy, balanced meal.',
      time: '12:00' },
    { id: 'preset3', type: 'water',   title: 'Afternoon Hydration',
      message: 'Time to drink some water and stay hydrated.',
      time: '15:00' },
    { id: 'preset4', type: 'workout', title: 'Evening Workout',
      message: 'Time for your evening workout session.',
      time: '18:00' }
  ];

  for (var i = 0; i < presets.length; i++) {
    (function(p) {
      var el = document.getElementById(p.id);
      if (el) {
        el.addEventListener('click', function() {
          applyPreset(p.type, p.title, p.message, p.time);
        });
      }
    })(presets[i]);
  }

  /* notification permission banner */
  if ('Notification' in window && Notification.permission === 'default') {
    document.getElementById('permissionBanner').style.display = 'flex';
  }

  /* smart notification clock */
  function startNotificationClock() {
    checkAndFireNotifications();
    var now         = new Date();
    var msUntilNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(function() {
      checkAndFireNotifications();
      setInterval(checkAndFireNotifications, 60000);
    }, msUntilNext);
  }

  startNotificationClock();
});