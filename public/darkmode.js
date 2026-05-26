// darkmode.js — Dark Mode Management
// Injects a moon/sun toggle button right beside the logout button in the navbar.

(function () {
    var DARK_MODE_KEY = 'hft_dark_mode';

    function isDarkModeEnabled() {
        var saved = localStorage.getItem(DARK_MODE_KEY);
        if (saved !== null) return saved === 'true';
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

     function applyDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        document.documentElement.classList.toggle('dark-mode', enabled); 
        localStorage.setItem(DARK_MODE_KEY, enabled);
        updateIcon();
    }
    
    function applyDarkMode(enabled) {
        document.body.classList.toggle('dark-mode', enabled);
        localStorage.setItem(DARK_MODE_KEY, enabled);
        updateIcon();
    }

    function updateIcon() {
        var btn = document.getElementById('dmToggleBtn');
        if (!btn) return;
        var isDark = document.body.classList.contains('dark-mode');
        btn.innerHTML = isDark
            ? '<i class="fa-solid fa-sun" style="margin:0;color:#fbbf24;font-size:0.95rem;"></i>'
            : '<i class="fa-solid fa-moon" style="margin:0;color:#4338ca;font-size:0.95rem;"></i>';
        btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }

    function injectToggleButton() {
        // Avoid duplicates
        if (document.getElementById('dmToggleBtn')) return;

        var navbarRight = document.querySelector('.navbar .ms-auto');
        if (!navbarRight) return;

        var btn = document.createElement('button');
        btn.id = 'dmToggleBtn';
        btn.className = 'dm-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            applyDarkMode(!document.body.classList.contains('dark-mode'));
        });

        // Insert as first child (leftmost, before logout)
        navbarRight.insertBefore(btn, navbarRight.firstChild);
        updateIcon();
    }

    function init() {
        // Apply saved preference before paint to avoid flash
        applyDarkMode(isDarkModeEnabled());

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectToggleButton);
        } else {
            injectToggleButton();
        }
    }

    // Listen for system preference changes (only when user hasn't manually set)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (localStorage.getItem(DARK_MODE_KEY) === null) {
                applyDarkMode(e.matches);
            }
        });
    }

    // Public API
    window.darkMode = {
        toggle:    function () { applyDarkMode(!document.body.classList.contains('dark-mode')); },
        enable:    function () { applyDarkMode(true); },
        disable:   function () { applyDarkMode(false); },
        isEnabled: function () { return document.body.classList.contains('dark-mode'); }
    };

    init();
})();