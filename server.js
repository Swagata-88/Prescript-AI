/**
 * PRESCRIPT AI — BACKEND SERVER
 * Express server providing the real AI prescription analysis API
 * and serving the responsive frontend web application.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { analyzePrescriptionImage } = require("./services/geminiService");

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Multer in-memory upload configuration (10MB limit)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

/**
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "Prescript AI",
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here")
    });
});

/**
 * POST /api/prescriptions/analyze
 * Accepts prescription image files (PNG, JPG, JPEG) via multipart/form-data with field "file".
 * Sends the image to the server-side Gemini multimodal AI vision pipeline.
 */
app.post("/api/prescriptions/analyze", (req, res) => {
    upload.single("file")(req, res, async (err) => {
        // Handle Multer upload errors (e.g. file size exceeded)
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    error: "File size exceeds the 10 MB limit. Please upload a smaller image."
                });
            }
            return res.status(400).json({
                success: false,
                error: `Upload error: ${err.message}`
            });
        } else if (err) {
            return res.status(400).json({
                success: false,
                error: "Error processing uploaded file."
            });
        }

        const file = req.file;

        // 1. Check file existence
        if (!file) {
            return res.status(400).json({
                success: false,
                error: "No prescription file was received. Please select an image and try again."
            });
        }

        // 2. Graceful PDF handling per specification
        const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
        if (isPdf) {
            return res.status(400).json({
                success: false,
                error: "PDF processing is not supported yet by the current AI vision pipeline. Please upload an image of your prescription (PNG, JPG, or JPEG)."
            });
        }

        // 3. Supported image format validation
        const allowedMimeTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp"
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: "Unsupported file type. Please upload a PNG, JPG, or JPEG prescription image."
            });
        }

        // 4. Send to Gemini Multimodal AI
        try {
            console.log(`[Prescript AI] Analyzing prescription: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB, ${file.mimetype})`);
            const structuredData = await analyzePrescriptionImage(
                file.buffer,
                file.mimetype,
                file.originalname
            );

            return res.json(structuredData);

        } catch (aiError) {
            console.error("[Prescript AI Error]", aiError.message);

            // Clean, user-friendly error responses without exposing secrets or raw stack traces
            if (aiError.message.includes("GEMINI_API_KEY is not configured")) {
                return res.status(503).json({
                    success: false,
                    error: "AI analysis is currently offline: GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your .env file."
                });
            }

            if (aiError.message.includes("API key not valid")) {
                return res.status(401).json({
                    success: false,
                    error: "The configured Gemini API key is invalid or has expired. Please verify your GEMINI_API_KEY in .env."
                });
            }

            return res.status(500).json({
                success: false,
                error: `Prescription analysis failed: ${aiError.message || "An unexpected error occurred while analyzing the document."}`
            });
        }
    });
});

// NOTE: Static file serving is registered AFTER API routes intentionally.
// express.static only handles GET/HEAD — registering it first causes 405 on POST /api/* routes.
app.use(express.static(__dirname));

// Fallback to index.html for root navigation
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("[Unhandled Server Error]", err);
    res.status(500).json({
        success: false,
        error: "Internal server error occurred."
    });
});

// Start listening
app.listen(PORT, () => {
    const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    console.log(`\n======================================================`);
    console.log(` Prescript AI Server running on http://localhost:${PORT}`);
    console.log(` Multimodal AI Endpoint: http://localhost:${PORT}/api/prescriptions/analyze`);
    console.log(` Gemini Vision Model: ${model}`);
    console.log(` Gemini API Key: ${process.env.GEMINI_API_KEY ? "CONFIGURED (Server-side)" : "NOT SET (Add to .env)"}`);
    console.log(`======================================================\n`);
});
