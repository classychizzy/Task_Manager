// utils/mailer.ts
import nodemailer, { Transporter } from "nodemailer";
import { logger } from '../lib/logger'

let transporter: Transporter;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === "production") {
    // Real provider — e.g. SendGrid, SES, or your SMTP provider
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev/test — Ethereal, auto-generates a disposable test inbox
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const mailer = await getTransporter();

  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || '"Task Manager" <no-reply@taskmanager.com>',
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    // Ethereal gives you a URL to preview the actual email content
    logger.debug({ previewUrl: nodemailer.getTestMessageUrl(info) }, "Preview reset email (dev only)");
  }

  return info;
}