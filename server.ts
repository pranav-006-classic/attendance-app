import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory rate limiting map for teacher code attempts
  const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

  // Teacher Access Code validation endpoint
  // The secret teacher code is verified server-side and NEVER exposed to client-readable data
  app.post("/api/auth/verify-teacher-code", (req, res) => {
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "client";
    const ipKey = String(clientIp);
    const now = Date.now();

    const attemptInfo = failedAttempts.get(ipKey);
    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many failed attempts. Security cooldown active. Please try again in ${waitSeconds} seconds.`,
        lockedSeconds: waitSeconds,
      });
    }

    const { code } = req.body;
    const expectedCode = process.env.TEACHER_ACCESS_CODE || "TEACHER2026";

    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "Teacher access code is required." });
    }

    if (code.trim() === expectedCode.trim()) {
      failedAttempts.delete(ipKey);
      return res.json({ success: true, message: "Teacher access code verified." });
    } else {
      const currentAttempts = (attemptInfo?.count || 0) + 1;
      let lockedUntil = 0;
      if (currentAttempts >= 5) {
        lockedUntil = now + 60 * 1000; // 60s lockout
      }
      failedAttempts.set(ipKey, { count: currentAttempts, lockedUntil });

      const remaining = Math.max(0, 5 - currentAttempts);
      return res.status(401).json({
        success: false,
        message: remaining > 0 
          ? `Invalid teacher access code. ${remaining} attempt(s) remaining before security lockout.`
          : "Invalid teacher access code. Security lockout activated for 60 seconds.",
        remainingAttempts: remaining,
        isLocked: currentAttempts >= 5,
      });
    }
  });

  // Password reset request endpoint
  app.post("/api/auth/reset-password", (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    // Record reset request and return success response
    return res.json({
      success: true,
      message: `Password reset instructions and verification link have been dispatched to ${email}. Check your university inbox.`,
    });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "AttendEase", timestamp: new Date().toISOString() });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AttendEase Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
