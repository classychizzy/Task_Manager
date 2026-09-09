import crypto from 'crypto';

export function generateResetToken(){
    const rawToken = crypto.randomBytes(32).toString("hex"); // sent to user via email
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex"); // stored in DB
    return { rawToken, hashedToken };
}
export function hashResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}