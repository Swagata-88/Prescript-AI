/**
 * PRESCRIPT AI — GEMINI MULTIMODAL AI SERVICE
 * Analyzes prescription images using Google Gemini vision model.
 * Enforces strict safety rules: never guess, never invent, mark unclear fields as null.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * System prompt instructing Gemini to act as a clinical prescription reader
 * with strict confidence awareness and zero hallucination.
 */
const CLINICAL_SYSTEM_PROMPT = `You are an expert clinical handwriting recognition and prescription structuring AI for Prescript AI.
Your ONLY role is to transcribe and structure what is genuinely written or printed on the uploaded doctor's prescription.

CRITICAL MEDICAL SAFETY RULES:
1. NEVER GUESS or hallucinate under any circumstances.
2. NEVER invent or assume information that is not legibly present in the image.
3. NEVER substitute or replace an unclear/ambiguous medicine name with a plausible or common drug name.
4. NEVER infer missing dosages, frequencies, durations, clinic names, doctor names, or patient details.
5. If any field or medicine cannot be confidently and unambiguously deciphered from the handwriting:
   - You MUST set that field value to null.
   - You MUST set verificationRequired to true.
   - Assign a realistic confidence score reflecting the uncertainty.
6. Confidence Score Guidelines (numeric float between 0.00 and 1.00):
   - 0.85 to 1.00: High confidence (text/handwriting is sharp, clear, and unambiguous).
   - 0.60 to 0.84: Needs verification (handwriting has partial ambiguity, cursive quirks, or slight obscurity).
   - Below 0.60: Unclear (handwriting is illegible, scribbled, faded, or uncertain).
7. For each detected medicine:
   - "name": The exact medicine brand or generic name. If illegible or uncertain, return null.
   - "dosage": Strength/dose (e.g. "500 mg", "10 mg", "650 mg"). If not stated or unclear, return null.
   - "frequency": Dosing frequency (e.g. "Twice daily", "1 tab bd", "Every 8 hours", "SOS"). If not stated or unclear, return null.
   - "duration": Duration of treatment (e.g. "5 days", "10 days", "1 month"). If not stated or unclear, return null.
   - "instructions": Additional administration instructions (e.g. "Take after meals", "At bedtime"). If none, return null.
   - "confidence": Float between 0.00 and 1.00.
   - "verificationRequired": true if confidence < 0.85 or if any crucial field (name, dosage) is null/uncertain.
8. If the image is NOT a prescription or contains no legible medical entries, return an empty medicines array and include a clear explanation in the warnings array.
9. Return ONLY a valid JSON object strictly matching this schema. Do NOT include markdown code fences, backticks, or any commentary outside the JSON.`;

/**
 * Call Gemini API with multimodal image payload
 * @param {Buffer} imageBuffer 
 * @param {string} mimeType 
 * @param {string} originalFileName 
 * @returns {Promise<Object>}
 */
async function analyzePrescriptionImage(imageBuffer, mimeType, originalFileName) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
        throw new Error("GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to the .env file.");
    }

    const base64Data = imageBuffer.toString("base64");
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    try {
        const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey.trim()}`;
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: CLINICAL_SYSTEM_PROMPT },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        },
                        {
                            text: `Extract all readable patient, doctor, date, and medicine information from this prescription image (${originalFileName}). Return strictly JSON.`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                response_mime_type: "application/json"
            }
        };

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
            throw new Error(`Gemini API error (${model}): ${errorMessage}`);
        }

        const responseData = await response.json();
        const textContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textContent) {
            throw new Error("AI model returned an empty response.");
        }

        const parsedData = parseGeminiJsonResponse(textContent);
        return formatPrescriptionResponse(parsedData, originalFileName);

    } catch (err) {
        throw err;
    }
}

/**
 * Cleanly parse JSON output even if model included markdown delimiters
 */
function parseGeminiJsonResponse(text) {
    let clean = text.trim();
    if (clean.startsWith("```json")) {
        clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
        clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    
    try {
        return JSON.parse(clean);
    } catch (err) {
        // Fallback simple regex extraction of JSON object
        const match = clean.match(/\{[\s\S]*\}/);
        if (match) {
            return JSON.parse(match[0]);
        }
        throw new Error("Unable to parse AI response into structured JSON.");
    }
}

/**
 * Format and normalize the response strictly according to the required specification
 */
function formatPrescriptionResponse(data, originalFileName) {
    const rxId = "RX-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    // Normalize confidence between 0 and 1
    const clampConf = (val) => {
        if (typeof val !== "number" || isNaN(val)) return 0;
        return Math.max(0, Math.min(1, parseFloat(val.toFixed(2))));
    };

    // Patient
    const patientRaw = data.patient || {};
    const patientConf = clampConf(patientRaw.confidence ?? 0);
    const patient = {
        name: patientRaw.name || null,
        age: patientRaw.age ? String(patientRaw.age) : null,
        gender: patientRaw.gender || null,
        confidence: patientConf,
        verificationRequired: Boolean(patientRaw.verificationRequired || patientConf < 0.85 || !patientRaw.name)
    };

    // Doctor
    const doctorRaw = data.doctor || {};
    const doctorConf = clampConf(doctorRaw.confidence ?? 0);
    const doctor = {
        name: doctorRaw.name || null,
        clinic: doctorRaw.clinic || null,
        confidence: doctorConf,
        verificationRequired: Boolean(doctorRaw.verificationRequired || doctorConf < 0.85 || !doctorRaw.name)
    };

    // Prescription Date
    const dateRaw = data.prescriptionDate || {};
    const dateConf = clampConf(dateRaw.confidence ?? 0);
    const prescriptionDate = {
        value: dateRaw.value || (typeof dateRaw === "string" ? dateRaw : null),
        confidence: dateConf,
        verificationRequired: Boolean(dateRaw.verificationRequired || dateConf < 0.85 || !dateRaw.value)
    };

    // Medicines
    const medicinesRaw = Array.isArray(data.medicines) ? data.medicines : [];
    const medicines = medicinesRaw.map((med, idx) => {
        const conf = clampConf(med.confidence ?? (med.name ? 0.75 : 0.3));
        const isNameUncertain = !med.name || med.name.toLowerCase().includes("unclear") || med.name.toLowerCase().includes("unable");
        const verificationReq = Boolean(med.verificationRequired || conf < 0.85 || isNameUncertain);

        return {
            id: `med-${idx + 1}`,
            name: isNameUncertain ? null : med.name,
            dosage: med.dosage || null,
            frequency: med.frequency || null,
            duration: med.duration || null,
            instructions: med.instructions || null,
            confidence: conf,
            verificationRequired: verificationReq
        };
    });

    // Overall verification required calculation
    const hasUnverifiedMedicine = medicines.some(m => m.verificationRequired || m.confidence < 0.85);
    const overallVerificationRequired = Boolean(
        data.overallVerificationRequired || 
        hasUnverifiedMedicine || 
        patient.verificationRequired || 
        doctor.verificationRequired ||
        medicines.length === 0
    );

    // Warnings list
    const warnings = Array.isArray(data.warnings) ? [...data.warnings] : [];
    if (medicines.length === 0) {
        warnings.push("No prescription medicines could be clearly identified in this document. Please ensure the image is clear and well-lit.");
    } else if (hasUnverifiedMedicine && !warnings.some(w => w.toLowerCase().includes("verify"))) {
        warnings.push("One or more medicine entries contain unclear handwriting and require professional verification.");
    }

    return {
        success: true,
        prescriptionId: rxId,
        uploadedFileName: originalFileName,
        patient,
        doctor,
        prescriptionDate,
        medicines,
        overallVerificationRequired,
        warnings
    };
}

module.exports = {
    analyzePrescriptionImage
};
