/**
 * PRESCRIPT AI — NAVIGATION CONTROLLER
 * Manages responsive menu, user dropdown, active page highlighting,
 * and public vs authenticated navbar modes.
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initUserDropdown();
    initMobileMenu();
    highlightActivePage();
});

function initNavigation() {
    // Check authentication state
    const isAuthenticated = localStorage.getItem('prescript_auth') === 'true' || 
                            window.location.pathname.includes('/pages/dashboard') ||
                            window.location.pathname.includes('/pages/upload') ||
                            window.location.pathname.includes('/pages/processing') ||
                            window.location.pathname.includes('/pages/result') ||
                            window.location.pathname.includes('/pages/history') ||
                            window.location.pathname.includes('/pages/account');

    // Update user name in navbar if authenticated
    if (isAuthenticated) {
        const profile = window.MOCK_DATA?.user || { fullName: "Dr. Swagata", avatar: "DS" };
        const nameLabels = document.querySelectorAll('.user-name-label');
        nameLabels.forEach(el => el.textContent = profile.fullName.split(' ')[0]);
        
        const avatarEls = document.querySelectorAll('.user-avatar');
        avatarEls.forEach(el => el.textContent = profile.avatar || 'DR');
    }
}

function initUserDropdown() {
    const userBtn = document.querySelector('.user-menu-btn');
    const dropdown = document.querySelector('.user-dropdown');

    if (userBtn && dropdown) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !userBtn.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    }

    // Logout handling
    const logoutBtns = document.querySelectorAll('.action-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('prescript_auth');
            sessionStorage.removeItem('prescript_active_upload');
            if (window.UI) {
                window.UI.showToast('Logged out successfully', 'info', 2000);
            }
            setTimeout(() => {
                const isPagesDir = window.location.pathname.includes('/pages/');
                window.location.href = isPagesDir ? '../index.html' : 'index.html';
            }, 500);
        });
    });
}

function initMobileMenu() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const drawer = document.querySelector('.mobile-menu-drawer');

    if (toggleBtn && drawer) {
        toggleBtn.addEventListener('click', () => {
            drawer.classList.toggle('open');
            const isOpen = drawer.classList.contains('open');
            toggleBtn.setAttribute('aria-expanded', isOpen);
            toggleBtn.innerHTML = isOpen 
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
        });

        // Close mobile drawer on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && drawer.classList.contains('open')) {
                drawer.classList.remove('open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
            }
        });
    }
}

function highlightActivePage() {
    const currentPath = window.location.pathname.toLowerCase();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href')?.toLowerCase();
        if (!href) return;

        // Check exact or relative match
        const filename = href.split('/').pop();
        if (filename && currentPath.endsWith(filename)) {
            link.classList.add('active');
        } else if ((currentPath.endsWith('/') || currentPath.endsWith('index.html')) && (filename === 'index.html' || href === '#' || href === './')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
