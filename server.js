import "dotenv/config";
import express from "express";
import cors from "cors";
import { sendResetPasswordEmail } from "./lib/reset-service.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/reset-password", async (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await sendResetPasswordEmail(email);
    return res.json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Reset password email failed:", error);

    if (error?.message?.includes("service account")) {
      return res.status(500).json({ message: "Password reset service is not configured yet." });
    }

    if (error?.errorInfo?.code === "auth/user-not-found") {
      return res.status(404).json({ message: "No account was found with that email address." });
    }

    if (error?.errorInfo?.code === "auth/invalid-email") {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    return res.status(500).json({ message: "We could not send the password reset email right now." });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Password reset API is running on http://localhost:${port}`);
});
