const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(btn => {
    btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

const fields = ["name","email","age","weight","height","goal"];
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");

// Load from localStorage
function loadProfile() {
  const data = JSON.parse(localStorage.getItem("profile")) || {
    name: "john doe",
    email: "your@gmail.com",
    age: 25,
    weight: 70,
    height: 175,
    goal: "Lose weight"
  };

  fields.forEach(id => {
    document.getElementById(id).value = data[id];
  });
}

// Enable editing
editBtn.addEventListener("click", () => {
    editBtn.blur();
  fields.forEach(id => {
    document.getElementById(id).removeAttribute("readonly");
  });

  saveBtn.classList.add("show");
  saveBtn.classList.remove("hide");   // ✅ important

  editBtn.classList.add("hide");
  editBtn.classList.remove("show");
});

// Save changes
saveBtn.addEventListener("click", () => {
  saveBtn.blur();

  const data = {};

  fields.forEach(id => {
    const input = document.getElementById(id);
    data[id] = input.value;
    input.setAttribute("readonly", true);
  });

  localStorage.setItem("profile", JSON.stringify(data));

  saveBtn.classList.remove("show");
  saveBtn.classList.add("hide");

  editBtn.classList.remove("hide");

  // 🔥 show toast
  const toastEl = document.getElementById("profileToast");
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
});

document.querySelectorAll(".toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = btn.previousElementSibling;
    const icon = btn.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      input.type = "password";
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
});

document.getElementById("confirmDelete").addEventListener("click", () => {
  localStorage.clear(); // optional (simulate account deletion)
  window.location.href = "index.html";
});

const passwordFields = document.querySelectorAll(".password-field");
const errorMsgs = document.querySelectorAll(".error-msg");
const updatePasswordBtn = document.querySelector("#password button.btn-dark");

function showError(index, message) {
  errorMsgs[index].textContent = message;
  errorMsgs[index].classList.remove("d-none");
}

function clearErrors() {
  errorMsgs.forEach(el => {
    el.textContent = "";
    el.classList.add("d-none");
  });
}

updatePasswordBtn.addEventListener("click", () => {
  clearErrors();

  const current = passwordFields[0].value.trim();
  const newPass = passwordFields[1].value.trim();
  const confirm = passwordFields[2].value.trim();

  let hasError = false;

  if (!current) {
    showError(0, "Please enter your current password");
    hasError = true;
  }

  if (!newPass) {
    showError(1, "Please enter a new password");
    hasError = true;
  } else if (newPass.length < 6) {
    showError(1, "Password must be at least 6 characters");
    hasError = true;
  }

  if (!confirm) {
    showError(2, "Please confirm your new password");
    hasError = true;
  } else if (newPass !== confirm) {
    showError(2, "Passwords do not match");
    hasError = true;
  }

  if (hasError) return;

  // success toast
  const toastEl = document.getElementById("passwordToast");
  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  passwordFields.forEach(input => input.value = "");
});

// init
loadProfile();
