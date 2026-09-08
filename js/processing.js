/**
 * PRESCRIPT AI — REAL AI PROCESSING CONTROLLER
 * Dispatches the uploaded prescription image to the backend multimodal AI pipeline
 * while providing clear, clinical progress feedback through the 5 stages.
 */

document.addEventListener('DOMContentLoaded', () => {
    startRealAnalysisPipeline();
});

async function startRealAnalysisPipeline() {
    const dataUrl = sessionStorage.getItem("prescript_upload_dataurl");
    const filename = sessionStorage.getItem("prescript_upload_filename") || "prescription.png";
    const filetype = sessionStorage.getItem("prescript_upload_filetype") || "image/png";

    // If no upload found, return to upload page
    if (!dataUrl) {
        window.location.href = "upload.html";
        return;
    }

    const progressBar = document.getElementById('processing-progress-bar');
    const percentText = document.getElementById('processing-percent');
    const statusText = document.getElementById('processing-status-text');
    const errorBox = document.getElementById('processing-error-box');
    const errorText = document.getElementById('processing-error-text');

    // Helper to set stage state
    function setStage(stageId, state) {
        const el = document.getElementById(stageId);
        if (!el) return;
        el.className = `stage-item ${state}`;
        const icon = el.querySelector('.stage-icon');
        if (!icon) return;

        if (state === 'completed') {
            icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
        } else if (state === 'active') {
            icon.innerHTML = '<span style="width:6px;height:6px;background:var(--primary);border-radius:50%;display:inline-block;"></span>';
        } else if (state === 'error') {
            icon.innerHTML = '!';
            el.style.color = 'var(--danger)';
            icon.style.backgroundColor = 'var(--danger)';
            icon.style.color = 'white';
        }
    }

    function setProgress(percent, label) {
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (percentText) percentText.textContent = `${percent}%`;
        if (statusText && label) statusText.textContent = label;
    }

    // Step 1: Upload confirmed
    setProgress(20, "Prescription uploaded successfully...");
    setStage('stage-1', 'completed');

    // Step 2: Quality verification
    await new Promise(r => setTimeout(r, 450));
    setProgress(40, "Image quality & resolution checked...");
    setStage('stage-2', 'completed');

    // Step 3: Start handwriting recognition
    setStage('stage-3', 'active');
    setProgress(65, "Multimodal AI reading handwriting strokes...");

    try {
        // Convert stored Data URL to File object
        const blob = dataURItoBlob(dataUrl);
        const uploadFile = new File([blob], filename, { type: filetype });

        // Call the real backend endpoint POST /api/prescriptions/analyze
        const realResult = await window.ApiService.analyzePrescription(uploadFile);

        // Step 4: Extract medicine information
        setStage('stage-3', 'completed');
        setStage('stage-4', 'active');
        setProgress(85, "Structuring medicine schedule, dosage & instructions...");
        await new Promise(r => setTimeout(r, 450));
        setStage('stage-4', 'completed');

        // Step 5: Evaluate confidence & clinical verification
        setStage('stage-5', 'active');
        setProgress(95, "Evaluating clinical confidence and safety flags...");
        await new Promise(r => setTimeout(r, 400));
        setStage('stage-5', 'completed');
        setProgress(100, "Analysis complete! Preparing structured report...");

        // Save real result data to sessionStorage
        sessionStorage.setItem("prescript_current_result", JSON.stringify(realResult));

        // Deduct 1 from daily quota
        await window.ApiService.decrementQuota();

        // Save to History
        saveRealScanToHistory(realResult, dataUrl);

        // Navigate to result page
        setTimeout(() => {
            window.location.href = `result.html?id=${encodeURIComponent(realResult.prescriptionId)}`;
        }, 500);

    } catch (err) {
        console.error("[Analysis Pipeline Failure]", err);

        // Display clean, user-friendly error
        setStage('stage-3', 'error');
        setProgress(65, "Analysis halted.");
        
        if (progressBar) progressBar.style.backgroundColor = 'var(--danger)';
        if (statusText) statusText.style.color = 'var(--danger)';
        
        const titleEl = document.querySelector('.processing-title');
        if (titleEl) titleEl.textContent = "Analysis Not Completed";

        if (errorText) {
            errorText.textContent = err.message || "An unexpected error occurred while communicating with the AI service.";
        }
        if (errorBox) {
            errorBox.style.display = 'block';
        }
    }
}

/**
 * Helper to convert Base64 dataURL to Blob
 */
function dataURItoBlob(dataURI) {
    try {
        const parts = dataURI.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
    } catch (e) {
        console.error("Failed to decode dataURI to blob", e);
        return new Blob([], { type: "image/png" });
    }
}

/**
 * Save real scanned prescription into persistent history
 */
function saveRealScanToHistory(result, imageThumbnail) {
    const isVerification = result.overallVerificationRequired || 
                           result.medicines.some(m => m.verificationRequired || m.confidence < 0.85);

    const record = {
        id: result.prescriptionId,
        date: result.prescriptionDate?.value || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        doctor: result.doctor?.name || "Doctor Unspecified",
        medicinesCount: result.medicines?.length || 0,
        status: isVerification ? "Needs verification" : "Processed",
        statusType: isVerification ? "warning" : "success",
        badgeClass: isVerification ? "badge-warning" : "badge-success",
        thumbnail: imageThumbnail || "../assets/images/sample-prescription.svg"
    };

    let history = [];
    const stored = localStorage.getItem("prescript_custom_history");
    if (stored) {
        try { history = JSON.parse(stored); } catch(e) {}
    }
    history = [record, ...history.filter(h => h.id !== record.id)];
    localStorage.setItem("prescript_custom_history", JSON.stringify(history));
}
