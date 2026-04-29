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
// 2. Registration Logic
// ==========================================
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');

if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Prevent page from refreshing

        const fullName = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Reset the error box just in case it was showing from a previous attempt
        if (registerError) registerError.style.display = 'none';

        //  Check if email already exists 
        const existingUser = localStorage.getItem(email);
        
        if (existingUser) {
            // If we found data under this email, show error and stop!
            if (registerError) {
                registerError.textContent = "An account with this email already exists. Please log in.";
                registerError.style.display = 'block';
            }
            return; 
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            if (registerError) {
                registerError.textContent = "Passwords do not match. Please try again.";
                registerError.style.display = 'block';
            }
            return; 
        }

        // If we pass all checks, save the user
        const user = { name: fullName, email: email, password: password };
        localStorage.setItem(email, JSON.stringify(user));

        // Use a quick alert for success, then redirect to login
        alert("Account created successfully! Please log in.");
        window.location.href = 'Login.html'; 
    });
}

// ==========================================
// 3. Login Logic
// ==========================================
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError'); // Get the error box

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Retrieve user from localStorage
        const storedUser = JSON.parse(localStorage.getItem(email));

        if (storedUser && storedUser.password === password) {
            // Success: Hide error (just in case), set session, and redirect
            if (loginError) loginError.style.display = 'none';
            localStorage.setItem('activeUser', JSON.stringify(storedUser));
            window.location.href = 'Dashboard.html'; 
        } else {
            // Failure: Show the UI error message instead of an alert
            if (loginError) {
                loginError.style.display = 'block';
                
                // Optional: Clear the password field so they can type it again
                document.getElementById('password').value = '';
            }
        }
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
    // Clear the active session, but keep the registered account
    localStorage.removeItem('activeUser');
    window.location.href = 'login.html';
}