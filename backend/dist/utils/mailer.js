"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPasswordResetEmail = sendPasswordResetEmail;
// utils/mailer.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("../lib/logger");
let transporter;
async function getTransporter() {
    if (transporter)
        return transporter;
    if (process.env.NODE_ENV === "production") {
        // Real provider — e.g. SendGrid, SES, or your SMTP provider
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    else {
        // Dev/test — Ethereal, auto-generates a disposable test inbox
        const testAccount = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
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
async function sendPasswordResetEmail(to, resetLink) {
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
        logger_1.logger.debug({ previewUrl: nodemailer_1.default.getTestMessageUrl(info) }, "Preview reset email (dev only)");
    }
    return info;
}
