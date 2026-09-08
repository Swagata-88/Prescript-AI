/**
 * PRESCRIPT AI — UI UTILITIES
 * Centralizes toasts, modals, SVG icons, and common interactive helpers.
 */

const UI = {
    /**
     * Display a floating toast notification
     * @param {string} message 
     * @param {'success'|'warning'|'danger'|'info'} type 
     * @param {number} duration 
     */
    showToast(message, type = 'info', duration = 3500) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconSvg = this.getToastIcon(type);

        toast.innerHTML = `
            <span class="toast-icon">${iconSvg}</span>
            <span class="toast-message" style="flex: 1;">${message}</span>
            <button class="toast-close" style="color: var(--text-light); font-size: 1.1rem; line-height: 1;">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismissToast(toast);
        });

        container.appendChild(toast);

        setTimeout(() => {
            this.dismissToast(toast);
        }, duration);
    },

    dismissToast(toast) {
        if (!toast) return;
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
    },

    getToastIcon(type) {
        switch(type) {
            case 'success':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            case 'warning':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            case 'danger':
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
            default:
                return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
        }
    },

    /**
     * Open a modal dialog
     * @param {string} modalId 
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close a modal dialog
     * @param {string} modalId 
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
};

window.UI = UI;
