import nodemailer from "nodemailer";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    initialized = true;
    return;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(__dirname, "..", process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : "";

  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error("Firebase Admin service account file was not found.");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  initialized = true;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendResetPasswordEmail(email) {
  initializeFirebaseAdmin();

  const transporter = createTransporter();
  const resetLink = await admin.auth().generatePasswordResetLink(email, {
    url: process.env.RESET_PASSWORD_REDIRECT_URL || "http://localhost:5500/auth.html"
  });

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME || "Sarhad International Publisher"}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Sarhad International Publisher Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1b2a41;">
        <h2 style="margin-bottom: 12px;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for Sarhad International Publisher.</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background: #1b2a41; color: #ffffff; padding: 12px 20px; border-radius: 999px; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>Regards,<br>Sarhad International Publisher</p>
      </div>
    `
  });
}
