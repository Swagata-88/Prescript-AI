/**
 * PRESCRIPT AI — PRICING & RAZORPAY INTEGRATION READY CONTROLLER
 * Manages subscription selection, simulated Razorpay checkout modal,
 * and quota upgrades.
 */

document.addEventListener('DOMContentLoaded', () => {
    initPricing();
});

function initPricing() {
    const planButtons = document.querySelectorAll('.plan-select-btn');
    const razorpayModal = document.getElementById('razorpay-modal');
    const confirmPaymentBtn = document.getElementById('rzp-confirm-pay-btn');
    const closeRzpBtn = document.getElementById('rzp-close-btn');

    let selectedPlan = null;

    planButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = btn.getAttribute('data-plan-id');
            const isCurrent = btn.getAttribute('data-is-current') === 'true';

            if (isCurrent) {
                if (window.UI) {
                    window.UI.showToast("You are currently subscribed to the Free starter plan.", "info", 2500);
                }
                return;
            }

            // Look up plan details
            const plan = window.MOCK_DATA.pricingPlans.find(p => p.id === planId);
            if (plan) {
                openRazorpayCheckout(plan);
            }
        });
    });

    if (closeRzpBtn) {
        closeRzpBtn.addEventListener('click', () => {
            if (window.UI) window.UI.closeModal('razorpay-modal');
        });
    }

    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', async () => {
            if (!selectedPlan) return;

            confirmPaymentBtn.disabled = true;
            confirmPaymentBtn.innerHTML = `
                <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Processing Payment...
            `;

            try {
                // Call API Service placeholder
                const res = await window.ApiService.createSubscription(selectedPlan.id);

                // Update quota in storage
                let dailyLimit = 15;
                if (selectedPlan.id === 'basic') dailyLimit = 5;
                if (selectedPlan.id === 'premium') dailyLimit = 25;

                const newPlan = {
                    name: `${selectedPlan.name} Plan`,
                    tier: selectedPlan.id,
                    uploadsLimit: dailyLimit,
                    uploadsUsed: 0,
                    resetPeriod: "24 hours",
                    validUntil: "Sep 08, 2027"
                };
                localStorage.setItem("prescript_user_quota", JSON.stringify(newPlan));

                if (window.UI) {
                    window.UI.closeModal('razorpay-modal');
                    window.UI.showToast(`Payment successful! Welcome to Prescript AI ${selectedPlan.name}.`, 'success', 3500);
                }

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1200);

            } catch(e) {
                if (window.UI) {
                    window.UI.showToast("Payment failed. Please try again.", "danger", 3000);
                }
                confirmPaymentBtn.disabled = false;
                confirmPaymentBtn.textContent = "Pay & Activate";
            }
        });
    }

    function openRazorpayCheckout(plan) {
        selectedPlan = plan;
        
        // Populate modal fields
        const nameEl = document.getElementById('rzp-plan-name');
        const priceEl = document.getElementById('rzp-plan-price');
        const orderEl = document.getElementById('rzp-order-id');

        if (nameEl) nameEl.textContent = `${plan.name} Subscription`;
        if (priceEl) priceEl.textContent = `${plan.price} ${plan.period}`;
        if (orderEl) orderEl.textContent = `order_rzp_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        if (window.UI) {
            window.UI.openModal('razorpay-modal');
        }
    }
}
