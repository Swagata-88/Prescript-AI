/**
 * PRESCRIPT AI — UPLOAD CONTROLLER
 * Handles drag-and-drop, file type & size validation, quota verification,
 * sample prescription auto-loader, and prepares real file for AI analysis.
 */

document.addEventListener('DOMContentLoaded', () => {
    initUploadPage();
});

function initUploadPage() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const selectedFileBox = document.getElementById('selected-file-box');
    const errorBox = document.getElementById('upload-error-box');
    const errorMessage = document.getElementById('upload-error-message');
    const analyzeBtn = document.getElementById('analyze-btn');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const sampleBtn = document.getElementById('use-sample-btn');

    let currentFile = null;

    // Allowed file types and max size (10MB)
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    // Check current quota
    checkQuota();

    if (!dropZone || !fileInput) return;

    // Click on dropzone triggers hidden file input
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Sample prescription helper
    if (sampleBtn) {
        sampleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            hideError();
            
            try {
                const response = await fetch('../assets/images/sample-prescription.svg');
                const blob = await response.blob();
                const file = new File([blob], "greenvalley_clinic_rx.svg", { type: "image/svg+xml" });
                handleFile(file);
                if (window.UI) {
                    window.UI.showToast("Loaded sample handwritten prescription", "success", 2500);
                }
            } catch (err) {
                showError("Could not load sample file.");
            }
        });
    }

    // Remove selected file
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelectedFile();
        });
    }

    // Analyze Prescription button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            if (!currentFile) {
                showError("Please select or drop a prescription file first.");
                return;
            }

            // Check PDF upfront with graceful feedback per specification
            const isPdf = currentFile.name.toLowerCase().endsWith('.pdf') || currentFile.type === 'application/pdf';
            if (isPdf) {
                showError("PDF processing is not supported yet by the current AI vision pipeline. Please upload an image of your prescription (PNG, JPG, or JPEG).");
                return;
            }

            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = `
                <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                Preparing Analysis...
            `;

            try {
                // Read file as Data URL to store in session for processing & result view
                const reader = new FileReader();
                reader.onload = function (evt) {
                    const dataUrl = evt.target.result;
                    sessionStorage.setItem("prescript_upload_dataurl", dataUrl);
                    sessionStorage.setItem("prescript_upload_filename", currentFile.name);
                    sessionStorage.setItem("prescript_upload_filetype", currentFile.type || "image/png");
                    sessionStorage.setItem("prescript_upload_filesize", currentFile.size ? `${(currentFile.size / (1024 * 1024)).toFixed(1)} MB` : "1.2 MB");
                    sessionStorage.setItem("prescript_active_image_url", dataUrl);

                    // Clear old result
                    sessionStorage.removeItem("prescript_current_result");

                    // Forward to processing screen
                    window.location.href = "processing.html";
                };

                reader.onerror = function () {
                    showError("Failed to read the prescription file. Please try again.");
                    analyzeBtn.disabled = false;
                    analyzeBtn.textContent = "Analyze Prescription";
                };

                reader.readAsDataURL(currentFile);

            } catch (err) {
                showError("Failed to prepare upload. Please try again.");
                analyzeBtn.disabled = false;
                analyzeBtn.textContent = "Analyze Prescription";
            }
        });
    }

    function handleFile(file) {
        hideError();

        // 1. Validate file exists
        if (!file) {
            showError("No file was selected.");
            return;
        }

        // 2. Validate file type
        const extension = file.name ? file.name.split('.').pop().toLowerCase() : '';
        const isValidExtension = ['png', 'jpg', 'jpeg', 'svg', 'pdf'].includes(extension);
        const isValidMime = file.type ? (ALLOWED_TYPES.includes(file.type) || file.type === 'image/svg+xml') : isValidExtension;

        if (!isValidMime && !isValidExtension) {
            showError("Unsupported file type. Please upload a PNG, JPG, or JPEG prescription image.");
            clearSelectedFile();
            return;
        }

        // 3. Validate file size
        if (file.size && file.size > MAX_FILE_SIZE) {
            showError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
            clearSelectedFile();
            return;
        }

        currentFile = file;
        displaySelectedFile(file);
    }

    function displaySelectedFile(file) {
        const nameEl = document.getElementById('selected-file-name');
        const sizeEl = document.getElementById('selected-file-size');
        const iconEl = document.getElementById('selected-file-icon');

        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) {
            const sizeInMb = file.size ? (file.size / (1024 * 1024)).toFixed(2) : "1.40";
            sizeEl.textContent = `${sizeInMb} MB`;
        }

        const isPdf = file.name.toLowerCase().endsWith('.pdf');
        if (iconEl) {
            iconEl.innerHTML = isPdf
                ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
                : '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
        }

        dropZone.style.display = 'none';
        selectedFileBox.classList.add('visible');
        if (analyzeBtn) analyzeBtn.disabled = false;
    }

    function clearSelectedFile() {
        currentFile = null;
        fileInput.value = '';
        selectedFileBox.classList.remove('visible');
        dropZone.style.display = 'flex';
        if (analyzeBtn) analyzeBtn.disabled = true;
    }

    function showError(msg) {
        if (errorMessage) errorMessage.textContent = msg;
        if (errorBox) errorBox.classList.add('visible');
    }

    function hideError() {
        if (errorBox) errorBox.classList.remove('visible');
    }

    async function checkQuota() {
        try {
            const quota = await window.ApiService.getUserQuota();
            const quotaBadge = document.getElementById('upload-quota-text');
            const remaining = Math.max(0, quota.uploadsLimit - quota.uploadsUsed);
            
            if (quotaBadge) {
                quotaBadge.textContent = `${quota.name}: ${remaining} of ${quota.uploadsLimit} uploads remaining today`;
            }

            if (remaining <= 0) {
                showError("You have reached your daily upload limit. Please upgrade your plan for unlimited clinical scans.");
                if (analyzeBtn) analyzeBtn.disabled = true;
                if (dropZone) dropZone.style.opacity = '0.6';
            }
        } catch(e) {
            console.error(e);
        }
    }
}
