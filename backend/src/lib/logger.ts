import pino from 'pino';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Ensure logs directory exists before loggers try to write
const logDirectory = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// General application log file
const applogfile = path.join(logDirectory, "app.log");
// Audit log - security related events (who did what and when)
const auditlogfile = path.join(logDirectory, "audit.log");

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';

// General Application Logger
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? {
        targets: [
            {
                target: "pino-pretty",
                options: { colorize: true }
            },
            {
                target: "pino/file",
                options: { destination: applogfile, mkdir: true }
            }
        ]
    } : {
        target: "pino/file",
        options: { destination: applogfile, mkdir: true }
    },
    serializers: {
        req: (req) => ({
            userId: req.user?.id,
            method: req.method,
            url: req.url,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        })
    },
});

// Audit Logger
export const auditLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? {
        targets: [
            {
                target: "pino-pretty",
                options: { colorize: true }
            },
            {
                target: "pino/file",
                options: { destination: auditlogfile, mkdir: true }
            }
        ]
    } : {
        target: "pino/file",
        options: { destination: auditlogfile, mkdir: true }
    }
});

// Force file creation on startup
logger.info("Logger system initialized");
auditLogger.info("Audit system initialized");
