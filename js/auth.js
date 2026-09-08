/**
 * PRESCRIPT AI — AUTHENTICATION CONTROLLER
 * Handles client-side validation, password visibility toggles,
 * demo login shortcut, and session management.
 */

document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    initPasswordToggles();
    initDemoLogin();
});

function initAuthForms() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateLoginForm()) {
                submitAuth("swagata.roy@prescriptai.org", "Dr. Swagata Roy");
            }
        });
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateSignupForm()) {
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                submitAuth(email, name);
            }
        });
    }
}

function validateLoginForm() {
    let isValid = true;
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // Email validation
    if (!emailInput.value || !isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(emailInput);
    }

    // Password validation
    if (!passwordInput.value || passwordInput.value.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearFieldError(passwordInput);
    }

    return isValid;
}

function validateSignupForm() {
    let isValid = true;
    const nameInput = document.getElementById('signup-name');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmInput = document.getElementById('signup-confirm-password');

    if (!nameInput.value.trim()) {
        showFieldError(nameInput, 'Please enter your full name');
        isValid = false;
    } else {
        clearFieldError(nameInput);
    }

    if (!emailInput.value || !isValidEmail(emailInput.value)) {
        showFieldError(emailInput, 'Please enter a valid email address');
        isValid = false;
    } else {
        clearFieldError(emailInput);
    }

    if (!passwordInput.value || passwordInput.value.length < 6) {
        showFieldError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearFieldError(passwordInput);
    }

    if (confirmInput.value !== passwordInput.value) {
        showFieldError(confirmInput, 'Passwords do not match');
        isValid = false;
    } else {
        clearFieldError(confirmInput);
    }

    return isValid;
}

function showFieldError(input, message) {
    input.classList.add('error');
    const group = input.closest('.form-group');
    if (group) {
        let errorEl = group.querySelector('.form-error');
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'form-error';
            group.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
}

function clearFieldError(input) {
    input.classList.remove('error');
    const group = input.closest('.form-group');
    if (group) {
        const errorEl = group.querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('visible');
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function initPasswordToggles() {
    const toggleBtns = document.querySelectorAll('.password-toggle');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            if (input && input.tagName === 'INPUT') {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword 
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    });
}

function initDemoLogin() {
    const demoBtn = document.getElementById('demo-login-btn');
    if (demoBtn) {
        demoBtn.addEventListener('click', () => {
            submitAuth("demo.doctor@prescriptai.org", "Dr. Swagata Roy");
        });
    }
}

function submitAuth(email, name) {
    localStorage.setItem('prescript_auth', 'true');
    
    // Save updated profile
    const profile = {
        fullName: name,
        email: email,
        avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };
    localStorage.setItem('prescript_user_profile', JSON.stringify(profile));

    if (window.UI) {
        window.UI.showToast(`Welcome to Prescript AI, ${name}!`, 'success', 2000);
    }

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 400);
}
