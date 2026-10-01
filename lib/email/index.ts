import nodemailer from "nodemailer";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<boolean> {
  const env = getEnv();

  // If running in development without a real email API key, log to console safely
  if (!env.EMAIL_API_KEY || env.EMAIL_API_KEY === "mock_dev_email_key" || env.EMAIL_API_KEY.startsWith("mock_")) {
    logger.info(
      {
        to,
        subject,
        textPreview: text.slice(0, 100),
      },
      "📧 [DEV EMAIL MOCK] Email delivered locally"
    );
    return true;
  }

  try {
    if (env.EMAIL_PROVIDER === "resend") {
      // Use Resend free tier REST API or Nodemailer SMTP
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.EMAIL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to,
          subject,
          text,
          html: html || `<p>${text.replace(/\n/g, "<br/>")}</p>`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ errorText, status: response.status }, "Resend API email sending failed");
        return false;
      }
      return true;
    } else {
      // Brevo free SMTP via Nodemailer
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false,
        auth: {
          user: env.EMAIL_FROM,
          pass: env.EMAIL_API_KEY,
        },
      });

      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html: html || `<p>${text.replace(/\n/g, "<br/>")}</p>`,
      });
      return true;
    }
  } catch (error) {
    logger.error({ error, to }, "Failed to send email through provider");
    return false;
  }
}
