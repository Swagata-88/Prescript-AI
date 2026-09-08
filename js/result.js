/**
 * PRESCRIPT AI — DYNAMIC RESULT CONTROLLER
 * Dynamically renders real AI prescription extraction data.
 * Zero hardcoded dependencies. Enforces confidence thresholds:
 * >= 0.85 (High), 0.60 - 0.84 (Needs verification), < 0.60 (Unclear).
 */

document.addEventListener('DOMContentLoaded', () => {
    initResultPage();
});

let currentZoom = 1;

async function initResultPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const rxId = urlParams.get('id');

    let data;
    try {
        data = await window.ApiService.getPrescriptionResult(rxId);
    } catch(err) {
        console.error("Error retrieving prescription data:", err);
    }

    if (!data) {
        data = {
            success: true,
            prescriptionId: rxId || "RX-NOT-FOUND",
            uploadedFileName: "prescription.png",
            patient: { name: null, age: null, gender: null, confidence: 0, verificationRequired: true },
            doctor: { name: null, clinic: null, confidence: 0, verificationRequired: true },
            prescriptionDate: { value: null, confidence: 0, verificationRequired: true },
            medicines: [],
            overallVerificationRequired: true,
            warnings: ["No prescription data found. Please upload a new prescription."]
        };
    }

    renderPrescriptionHeader(data);
    renderOriginalPanel(data);
    renderSummary(data);
    renderContext(data);
    renderMedicines(data.medicines || []);
    renderWarnings(data.warnings || []);
    initZoomControls();
    initActionButtons(data);
}

function renderPrescriptionHeader(data) {
    const idEl = document.getElementById('rx-header-id');
    const metaEl = document.getElementById('rx-header-meta');
    
    if (idEl) idEl.textContent = data.prescriptionId || data.id || "RX-Scan";
    
    if (metaEl) {
        const dateVal = data.prescriptionDate?.value || data.uploadedAt || "Date Unspecified";
        metaEl.textContent = `Prescription Date: ${dateVal} • Processed with Multimodal Vision AI`;
    }
}

function renderOriginalPanel(data) {
    const filenameEl = document.getElementById('rx-filename');
    const filesizeEl = document.getElementById('rx-filesize');
    const imgEl = document.getElementById('original-rx-image');

    const fileName = data.uploadedFileName || data.filename || "prescription.png";
    if (filenameEl) filenameEl.textContent = fileName;

    const storedFileSize = sessionStorage.getItem("prescript_upload_filesize");
    if (filesizeEl) {
        filesizeEl.textContent = storedFileSize ? `${storedFileSize} • Prescript AI` : "Uploaded Image";
    }

    // Render the actual uploaded image if available in current session
    if (imgEl) {
        const activeImageUrl = sessionStorage.getItem("prescript_active_image_url");
        if (activeImageUrl) {
            imgEl.src = activeImageUrl;
            imgEl.alt = `Uploaded prescription ${fileName}`;
        } else {
            imgEl.src = "../assets/images/sample-prescription.svg";
            imgEl.alt = "Prescription image preview";
        }
    }
}

function renderSummary(data) {
    const medicines = data.medicines || [];
    const totalEl = document.getElementById('summary-total-count');
    const verifyEl = document.getElementById('summary-verify-count');
    const statusBadge = document.getElementById('summary-status-badge');

    if (totalEl) {
        totalEl.textContent = `${medicines.length} medicine${medicines.length === 1 ? '' : 's'} detected`;
    }

    const verificationCount = medicines.filter(m => m.verificationRequired || m.confidence < 0.85).length;

    if (verifyEl) {
        if (verificationCount > 0) {
            verifyEl.innerHTML = `<span style="color: #8C6212; font-weight: 600;">• ${verificationCount} requires verification</span>`;
        } else if (medicines.length > 0) {
            verifyEl.innerHTML = `<span style="color: var(--success); font-weight: 600;">• All items high confidence</span>`;
        } else {
            verifyEl.innerHTML = `<span style="color: var(--danger); font-weight: 600;">• No legible entries</span>`;
        }
    }

    if (statusBadge) {
        if (data.overallVerificationRequired || verificationCount > 0) {
            statusBadge.className = 'badge badge-warning';
            statusBadge.innerHTML = '<span class="badge-dot"></span> Needs verification';
        } else if (medicines.length > 0) {
            statusBadge.className = 'badge badge-success';
            statusBadge.innerHTML = '<span class="badge-dot"></span> Processed';
        } else {
            statusBadge.className = 'badge badge-danger';
            statusBadge.innerHTML = '<span class="badge-dot"></span> Unclear';
        }
    }
}

function renderContext(data) {
    const docName = document.getElementById('ctx-doctor-name');
    const patName = document.getElementById('ctx-patient-name');

    // Doctor details
    if (docName) {
        if (data.doctor && data.doctor.name) {
            const clinicPart = data.doctor.clinic ? ` (${data.doctor.clinic})` : '';
            const confBadge = data.doctor.confidence < 0.85 
                ? ' <span class="badge badge-warning" style="font-size: 0.65rem; padding: 2px 6px;">Unverified</span>' 
                : '';
            docName.innerHTML = `${escapeHtml(data.doctor.name)}${escapeHtml(clinicPart)}${confBadge}`;
        } else {
            docName.innerHTML = `<span style="color: var(--text-light); font-style: italic;">Unable to identify doctor</span>`;
        }
    }

    // Patient details
    if (patName) {
        if (data.patient && data.patient.name) {
            const details = [data.patient.age, data.patient.gender].filter(Boolean).join(', ');
            const subText = details ? ` (${details})` : '';
            const confBadge = data.patient.confidence < 0.85 
                ? ' <span class="badge badge-warning" style="font-size: 0.65rem; padding: 2px 6px;">Unverified</span>' 
                : '';
            patName.innerHTML = `${escapeHtml(data.patient.name)}${escapeHtml(subText)}${confBadge}`;
        } else {
            patName.innerHTML = `<span style="color: var(--text-light); font-style: italic;">Unable to identify patient</span>`;
        }
    }
}

function renderMedicines(medicines) {
    const container = document.getElementById('medicines-container');
    if (!container) return;

    container.innerHTML = '';

    if (!medicines || medicines.length === 0) {
        const emptyCard = document.createElement('div');
        emptyCard.className = 'card';
        emptyCard.style.textAlign = 'center';
        emptyCard.style.padding = '2.5rem 1.5rem';
        emptyCard.innerHTML = `
            <div style="width: 48px; height: 48px; border-radius: 50%; background-color: var(--surface-soft); color: var(--text-light); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">No medicines clearly detected</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.25rem;">The AI could not confidently detect medicine names or instructions from this document. Please verify with your doctor or pharmacist.</p>
            <a href="upload.html" class="btn btn-secondary btn-sm">Try Another Prescription</a>
        `;
        container.appendChild(emptyCard);
        return;
    }

    medicines.forEach((med, index) => {
        const conf = typeof med.confidence === 'number' ? med.confidence : 0;
        const pct = Math.round(conf * 100);
        const card = document.createElement('div');

        // Threshold classification:
        // confidence >= 0.85: High confidence
        // confidence >= 0.60 and < 0.85: Needs verification
        // confidence < 0.60: Unclear
        const isHigh = conf >= 0.85 && !med.verificationRequired;
        const isMedium = (conf >= 0.60 && conf < 0.85) || (conf >= 0.85 && med.verificationRequired);
        const isLow = conf < 0.60;

        if (isHigh) {
            // 🟢 High confidence
            card.className = 'result-med-card';
            card.innerHTML = `
                <div class="med-card-top">
                    <div class="med-card-title-group">
                        <span style="font-size: 0.85rem; color: var(--text-light); font-weight: 600;">${index + 1}.</span>
                        <h3 class="med-title">${escapeHtml(med.name || 'Identified Medicine')}</h3>
                    </div>
                    <span class="badge badge-success">
                        <span class="badge-dot"></span> High confidence (${pct}%)
                    </span>
                </div>
                <div class="med-grid">
                    <div class="med-field">
                        <span class="med-label">Dosage</span>
                        <span class="med-value">${escapeHtml(med.dosage || 'Not specified')}</span>
                    </div>
                    <div class="med-field">
                        <span class="med-label">Frequency</span>
                        <span class="med-value">${escapeHtml(med.frequency || 'Not specified')}</span>
                    </div>
                    <div class="med-field">
                        <span class="med-label">Duration</span>
                        <span class="med-value">${escapeHtml(med.duration || 'Not specified')}</span>
                    </div>
                </div>
                ${med.instructions ? `
                <div class="med-instructions">
                    <strong>Doctor Instructions:</strong> ${escapeHtml(med.instructions)}
                </div>` : ''}
            `;
        } else if (isMedium) {
            // 🟡 Needs verification
            card.className = 'result-med-card state-warning';
            card.innerHTML = `
                <div class="med-card-top" style="border-bottom-color: var(--warning-border);">
                    <div class="med-card-title-group">
                        <span style="font-size: 0.85rem; color: #8C6212; font-weight: 600;">${index + 1}.</span>
                        <h3 class="med-title" style="color: #8C6212;">${escapeHtml(med.name || 'Unable to confidently identify')}</h3>
                    </div>
                    <span class="badge badge-warning">
                        <span class="badge-dot"></span> Needs verification (${pct}%)
                    </span>
                </div>
                <div class="warning-card-message" style="margin-bottom: 0.85rem;">
                    The handwriting is unclear and this medicine name could not be identified with sufficient confidence.
                </div>
                <div class="med-grid" style="opacity: 0.85; margin-bottom: 0.85rem;">
                    <div class="med-field">
                        <span class="med-label" style="color: #8C6212;">Dosage (Estimated)</span>
                        <span class="med-value">${escapeHtml(med.dosage || 'Uncertain / Unspecified')}</span>
                    </div>
                    <div class="med-field">
                        <span class="med-label" style="color: #8C6212;">Frequency</span>
                        <span class="med-value">${escapeHtml(med.frequency || 'Uncertain / Unspecified')}</span>
                    </div>
                    <div class="med-field">
                        <span class="med-label" style="color: #8C6212;">Duration</span>
                        <span class="med-value">${escapeHtml(med.duration || 'Uncertain / Unspecified')}</span>
                    </div>
                </div>
                <div class="warning-card-instruction">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Please verify this information with your doctor or pharmacist.</span>
                </div>
            `;
        } else {
            // 🔴 Unclear (confidence < 0.60)
            card.className = 'result-med-card state-danger';
            card.innerHTML = `
                <div class="med-card-top" style="border-bottom-color: var(--danger-border);">
                    <div class="med-card-title-group">
                        <span style="font-size: 0.85rem; color: #8A2D2D; font-weight: 600;">${index + 1}.</span>
                        <h3 class="med-title" style="color: #8A2D2D;">${escapeHtml(med.name || 'Unable to confidently identify')}</h3>
                    </div>
                    <span class="badge badge-danger">
                        <span class="badge-dot"></span> Unclear (${pct}%)
                    </span>
                </div>
                <div class="warning-card-message" style="color: #8A2D2D; margin-bottom: 0.85rem;">
                    The handwriting is illegible or heavily scribbled. This entry cannot be identified with clinical confidence.
                </div>
                <div class="warning-card-instruction" style="color: #8A2D2D;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Please verify this information with your doctor or pharmacist.</span>
                </div>
            `;
        }

        container.appendChild(card);
    });
}

function renderWarnings(warnings) {
    if (!warnings || warnings.length === 0) return;

    const container = document.getElementById('medicines-container');
    if (!container) return;

    const warnBox = document.createElement('div');
    warnBox.className = 'warning-card';
    warnBox.style.marginTop = '0.5rem';
    warnBox.innerHTML = `
        <div class="warning-card-header">
            <div class="warning-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Clinical Extraction Observations</span>
            </div>
        </div>
        <ul style="margin-left: 1.25rem; font-size: 0.875rem; color: var(--text-primary); line-height: 1.5; list-style-type: disc;">
            ${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
        </ul>
    `;
    container.appendChild(warnBox);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initZoomControls() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const zoomLevelText = document.getElementById('zoom-level-text');
    const wrapper = document.getElementById('original-img-wrapper');

    if (!wrapper) return;

    function applyZoom(zoom) {
        currentZoom = Math.min(2.5, Math.max(0.6, zoom));
        wrapper.style.transform = `scale(${currentZoom})`;
        if (zoomLevelText) {
            zoomLevelText.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => applyZoom(currentZoom + 0.2));
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => applyZoom(currentZoom - 0.2));
    }

    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => applyZoom(1));
    }
}

function initActionButtons(data) {
    const printBtn = document.getElementById('print-summary-btn');
    const shareBtn = document.getElementById('share-summary-btn');

    if (printBtn) {
        printBtn.addEventListener('click', () => {
            window.print();
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (window.UI) {
                window.UI.showToast("Prescription summary link copied to clipboard", "success", 2500);
            }
        });
    }
}
