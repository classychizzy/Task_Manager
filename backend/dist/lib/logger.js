"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Ensure logs directory exists before loggers try to write
const logDirectory = path_1.default.join(process.cwd(), "logs");
if (!fs_1.default.existsSync(logDirectory)) {
    fs_1.default.mkdirSync(logDirectory, { recursive: true });
}
// General application log file
const applogfile = path_1.default.join(logDirectory, "app.log");
// Audit log - security related events (who did what and when)
const auditlogfile = path_1.default.join(logDirectory, "audit.log");
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
// General Application Logger
exports.logger = (0, pino_1.default)({
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
exports.auditLogger = (0, pino_1.default)({
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
exports.logger.info("Logger system initialized");
exports.auditLogger.info("Audit system initialized");
