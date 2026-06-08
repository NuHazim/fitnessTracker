// ==========================================
// 1. Password Visibility Toggle
// ==========================================
const togglePasswords = document.querySelectorAll('.toggle-password');

togglePasswords.forEach(icon => {
    icon.addEventListener('click', function() {
        // Find the input field right next to the clicked icon
        const input = this.previousElementSibling;
        
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '🙈'; // Change icon to hide
        } else {
            input.type = 'password';
            this.textContent = '👁️'; // Change icon to show
        }
    });
});

// ==========================================
// 2. Registration Logic (Connected to MongoDB)
// ==========================================
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');

if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page from refreshing

        const fullName = document.getElementById('fullname').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Reset the error box just in case it was showing from a previous attempt
        if (registerError) registerError.style.display = 'none';

        // Check if passwords match
        if (password !== confirmPassword) {
            if (registerError) {
                registerError.textContent = "Passwords do not match. Please try again.";
                registerError.style.display = 'block';
            }
            return; 
        }

        // POST Payload structural mapping matching server.js endpoint expectation
        const registrationData = {
            name: fullName,
            email: email,
            password: password
        };

        // Send registration request directly to MongoDB backend handler
        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registrationData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                alert("Account created successfully in MongoDB! Redirecting to login...");
                window.location.href = 'Login.html'; 
            } else {
                if (registerError) {
                    registerError.textContent = data.message || "Registration failed. Email might already exist.";
                    registerError.style.display = 'block';
                }
            }
        })
        .catch(err => {
            console.error("Database registration communication fault:", err);
            if (registerError) {
                registerError.textContent = "Database connection offline. Unable to register.";
                registerError.style.display = 'block';
            }
        });
    });
}

// ==========================================
// 3. Login Logic (Connected to MongoDB)
// ==========================================
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError'); // Get the error box

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (loginError) loginError.style.display = 'none';

        const loginData = {
            email: email,
            password: password
        };

        // Send validation verification parameters straight to MongoDB backend routing
        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                // Success: Sync session local memory array context for active page usage routing
                localStorage.setItem('activeUser', JSON.stringify({
                    name: data.user.name,
                    email: data.user.email
                }));
                window.location.href = 'Dashboard.html'; 
            } else {
                // Failure: Show the UI error message instead of an alert
                if (loginError) {
                    loginError.textContent = data.message || "Invalid email or password.";
                    loginError.style.display = 'block';
                    document.getElementById('password').value = '';
                }
            }
        })
        .catch(err => {
            console.error("Database connection verification error:", err);
            if (loginError) {
                loginError.textContent = "Server communication offline.";
                loginError.style.display = 'block';
            }
        });
    });
}

// ==========================================
// 4. Logout Modal Logic
// ==========================================
function openLogoutModal() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
    // Clear the active session tracking array metrics safely
    localStorage.removeItem('activeUser');
    window.location.href = 'Login.html';
}