import "dotenv/config";
import { sendResetPasswordEmail } from "../../lib/reset-service.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed." });
  }

  const email = (req.body?.email || "").trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    await sendResetPasswordEmail(email);
    return res.status(200).json({ message: "Password reset email sent successfully." });
  } catch (error) {
    console.error("Reset password email failed:", error);

    if (error?.errorInfo?.code === "auth/user-not-found") {
      return res.status(404).json({ message: "No account was found with that email address." });
    }

    if (error?.errorInfo?.code === "auth/invalid-email") {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    return res.status(500).json({ message: "We could not send the password reset email right now." });
  }
}
