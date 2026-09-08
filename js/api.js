/**
 * PRESCRIPT AI — API SERVICE LAYER
 * Connects frontend to the real backend Gemini AI prescription pipeline.
 * Preserves mock fallbacks for historical records and offline browsing.
 */

const ApiService = {
    // Determine base API endpoint depending on current environment
    getApiUrl() {
        if (window.location.protocol === "file:") {
            return "http://localhost:3000/api/prescriptions/analyze";
        }
        return "/api/prescriptions/analyze";
    },

    /**
     * Send prescription image to backend multimodal AI model
     * @param {File|Blob} file 
     * @returns {Promise<Object>}
     */
    async analyzePrescription(file) {
        const formData = new FormData();
        const fileName = file.name || "prescription_upload.png";
        formData.append("file", file, fileName);

        const url = this.getApiUrl();

        try {
            const response = await fetch(url, {
                method: "POST",
                body: formData
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                const errorMsg = data.error || `Server responded with status ${response.status}: ${response.statusText}`;
                throw new Error(errorMsg);
            }

            return data;

        } catch (err) {
            console.error("[ApiService Error]", err);
            if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
                throw new Error("Unable to reach Prescript AI server. Ensure backend is running (npm start).");
            }
            throw err;
        }
    },

    /**
     * Fetch prescription result (prioritizes real analysis result from current session)
     * @param {string} id 
     * @returns {Promise<Object>}
     */
    async getPrescriptionResult(id) {
        // 1. Check if we have real analysis data saved from current upload
        const realResultJson = sessionStorage.getItem("prescript_current_result");
        if (realResultJson) {
            try {
                const parsed = JSON.parse(realResultJson);
                if (!id || parsed.prescriptionId === id || parsed.id === id) {
                    return parsed;
                }
            } catch (e) {
                console.error("Error parsing stored real result", e);
            }
        }

        // 2. Fallback to mock data for demo historical items
        const mock = window.MOCK_DATA?.currentPrescription;
        return mock || null;
    },

    /**
     * Fetch list of user's past prescriptions
     * @returns {Promise<Array>}
     */
    async getPrescriptionHistory() {
        const stored = localStorage.getItem("prescript_custom_history");
        if (stored) {
            try {
                const custom = JSON.parse(stored);
                return [...custom, ...(window.MOCK_DATA?.history || [])];
            } catch (e) {
                console.error("Error reading custom history", e);
            }
        }
        return window.MOCK_DATA?.history || [];
    },

    /**
     * Fetch current user quota & upload limit
     * @returns {Promise<Object>}
     */
    async getUserQuota() {
        const customQuota = localStorage.getItem("prescript_user_quota");
        if (customQuota) {
            try {
                return JSON.parse(customQuota);
            } catch(e) {}
        }
        return window.MOCK_DATA?.user?.plan || {
            name: "Free Plan",
            uploadsLimit: 2,
            uploadsUsed: 1,
            resetPeriod: "24 hours"
        };
    },

    /**
     * Deduct 1 upload from quota
     */
    async decrementQuota() {
        const quota = await this.getUserQuota();
        if (quota.uploadsUsed < quota.uploadsLimit) {
            quota.uploadsUsed += 1;
            localStorage.setItem("prescript_user_quota", JSON.stringify(quota));
        }
        return quota;
    },

    /**
     * Fetch current user profile
     * @returns {Promise<Object>}
     */
    async getUserProfile() {
        const customUser = localStorage.getItem("prescript_user_profile");
        if (customUser) {
            try {
                return JSON.parse(customUser);
            } catch(e) {}
        }
        return window.MOCK_DATA?.user || {
            fullName: "Healthcare User",
            email: "user@prescriptai.org"
        };
    },

    /**
     * Simulate subscription purchase ready for Razorpay integration
     * @param {string} planId 
     * @returns {Promise<Object>}
     */
    async createSubscription(planId) {
        await new Promise(resolve => setTimeout(resolve, 800));
        return {
            success: true,
            orderId: "order_rzp_" + Math.random().toString(36).substring(2, 9),
            planId: planId,
            status: "active"
        };
    }
};

window.ApiService = ApiService;
