/**
 * PRESCRIPT AI — APPLICATION INITIALIZER
 * Coordinates services, initializes UI hooks, and manages demonstration states.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Quick Demo Mode detection
    initDemoHelpers();
});

function initDemoHelpers() {
    // Log initialization for developers
    console.log('%c Prescript AI %c Healthcare AI Prescription Platform Initialized ', 
        'background:#5C9F7D; color:white; font-weight:bold; border-radius:3px; padding:2px 5px;', 
        'background:#19352A; color:#E8F1EC; padding:2px 5px; border-radius:3px;');

    // Global keyboard shortcuts (e.g. Esc closes modals)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-backdrop.active');
            openModals.forEach(m => m.classList.remove('active'));
            document.body.style.overflow = '';
        }
    });

    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}
