/**
 * PRESCRIPT AI — CENTRALIZED MOCK DATA
 * Used for frontend demonstration and hackathon showcases.
 * Structured to be easily swapped with backend API responses.
 */

const MOCK_DATA = {
    // Current logged-in user profile
    user: {
        id: "USR-9942",
        fullName: "Dr. Swagata Roy",
        email: "swagata.roy@prescriptai.org",
        role: "Healthcare Professional",
        avatar: "SR",
        createdAt: "2026-01-15",
        plan: {
            name: "Free Plan",
            tier: "free",
            uploadsLimit: 2,
            uploadsUsed: 1,
            resetPeriod: "24 hours",
            validUntil: "Active indefinitely"
        }
    },

    // Detailed prescription result for analysis demo
    currentPrescription: {
        id: "RX-2026-081",
        filename: "prescription_dr_vance.png",
        uploadedAt: "September 8, 2026 • 07:15 PM",
        fileSize: "1.4 MB",
        dimensions: "1240 × 1680 px",
        doctor: {
            name: "Dr. Arthur Vance, MD",
            specialty: "Internal Medicine",
            clinic: "GreenValley Family Clinic"
        },
        patient: {
            name: "Rajesh Sharma",
            age: "42 Yrs",
            sex: "Male",
            date: "08 Sep 2026"
        },
        summary: {
            totalDetected: 3,
            confidentCount: 2,
            needsVerificationCount: 1,
            status: "Needs verification" // or "Processed"
        },
        medicines: [
            {
                id: "med-1",
                name: "Amoxicillin",
                dosage: "500 mg",
                frequency: "Twice daily (1 cap bd)",
                duration: "5 days",
                instructions: "Take after meals with water",
                confidence: "high",
                confidenceScore: 98,
                statusText: "High confidence"
            },
            {
                id: "med-2",
                name: "Paracetamol",
                dosage: "650 mg",
                frequency: "As needed for fever (SOS)",
                duration: "Max 3 days",
                instructions: "Maintain at least 6 hours between doses",
                confidence: "high",
                confidenceScore: 94,
                statusText: "High confidence"
            },
            {
                id: "med-3",
                name: "Unable to confidently identify",
                dosage: "10 mg (Uncertain)",
                frequency: "Nightly (hs) — Unconfirmed",
                duration: "10 days (Uncertain)",
                instructions: "Handwriting unclear",
                confidence: "low",
                confidenceScore: 36,
                statusText: "Needs verification",
                warning: {
                    type: "uncertain",
                    title: "Unable to confidently identify",
                    message: "The handwriting is unclear and this medicine name could not be identified with sufficient confidence.",
                    instruction: "Please verify this medicine with your doctor or pharmacist before taking."
                }
            }
        ]
    },

    // History of past scanned prescriptions
    history: [
        {
            id: "RX-2026-081",
            date: "Sep 08, 2026",
            doctor: "Dr. Arthur Vance",
            medicinesCount: 3,
            status: "Needs verification",
            statusType: "warning",
            badgeClass: "badge-warning",
            thumbnail: "assets/images/sample-prescription.svg"
        },
        {
            id: "RX-2026-079",
            date: "Aug 29, 2026",
            doctor: "Dr. Priya Patel",
            medicinesCount: 2,
            status: "Processed",
            statusType: "success",
            badgeClass: "badge-success",
            thumbnail: "assets/images/sample-prescription.svg"
        },
        {
            id: "RX-2026-064",
            date: "Aug 14, 2026",
            doctor: "Dr. Robert Chen",
            medicinesCount: 4,
            status: "Processed",
            statusType: "success",
            badgeClass: "badge-success",
            thumbnail: "assets/images/sample-prescription.svg"
        },
        {
            id: "RX-2026-051",
            date: "Jul 28, 2026",
            doctor: "Dr. Sunita Rao",
            medicinesCount: 2,
            status: "Needs verification",
            statusType: "warning",
            badgeClass: "badge-warning",
            thumbnail: "assets/images/sample-prescription.svg"
        },
        {
            id: "RX-2026-033",
            date: "Jun 19, 2026",
            doctor: "Dr. Marcus Brody",
            medicinesCount: 1,
            status: "Processed",
            statusType: "success",
            badgeClass: "badge-success",
            thumbnail: "assets/images/sample-prescription.svg"
        }
    ],

    // Pricing plans
    pricingPlans: [
        {
            id: "free",
            name: "Free",
            price: "₹0",
            period: "",
            description: "Essential access for occasional prescription reading.",
            features: [
                "2 prescription uploads per 24 hours",
                "Standard handwriting recognition",
                "Original prescription side-by-side view",
                "Basic confidence indicators"
            ],
            badge: null,
            ctaText: "Current Plan",
            isCurrent: true
        },
        {
            id: "basic",
            name: "Basic",
            price: "₹99",
            period: "/ month",
            description: "Ideal for personal and family health records.",
            features: [
                "5 prescription uploads per day",
                "1-month validity",
                "Original prescription side-by-side view",
                "Print and PDF export",
                "Confidence-aware alerts"
            ],
            badge: null,
            ctaText: "Choose Basic",
            isCurrent: false
        },
        {
            id: "pro",
            name: "Pro",
            price: "₹299",
            period: "/ month",
            description: "Most popular for active caretakers & health practitioners.",
            features: [
                "15 prescription uploads per day",
                "1-month validity",
                "Priority AI handwriting recognition",
                "Download structured medical summaries",
                "Prescription history & search",
                "Email verification reports"
            ],
            badge: "Most Popular",
            isPopular: true,
            ctaText: "Choose Pro",
            isCurrent: false
        },
        {
            id: "premium",
            name: "Premium",
            price: "₹999",
            period: "/ year",
            description: "Advanced model fine-tuned for complex cursive handwriting.",
            features: [
                "25 prescription uploads per day",
                "1-year validity",
                "Supports difficult cursive handwriting",
                "Multi-page prescription PDFs",
                "Dedicated healthcare priority support",
                "Early access to new clinical models"
            ],
            badge: "Best for difficult handwriting",
            ctaText: "Choose Premium",
            isCurrent: false
        }
    ]
};

// Export to window for vanilla JS access
window.MOCK_DATA = MOCK_DATA;
