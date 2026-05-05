"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists before loggers try to write
const logDirectory = path_1.default.join(process.cwd(), "logs");
fs_1.default.mkdirSync(logDirectory, { recursive: true });
// General application log file
const applogfile = path_1.default.join(logDirectory, "app.log");
// Audit log - security related events (who did what and when)
const auditlogfile = path_1.default.join(logDirectory, "audit.log");
//general app logger
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
        targets: [
            // pretty console output for development
            {
                target: "pino-pretty",
                options: {
                    colorize: true,
                },
            },
            {
                target: "pino-rotating-file",
                options: {
                    dirname: logDirectory,
                    filename: "app.log",
                    maxsize: "10mb", // rotate after 10mb
                    interval: "1d", // rotate after 1d
                    compress: true,
                    maxFiles: 7, // keep 7 days of logs
                }
            },
        ],
        // ✅ file sink (prod / always)
    }
        : {
            target: "pino/file",
            level: "info",
            options: {
                filename: applogfile,
                maxsize: "10mb",
                interval: "1d",
                compress: true,
                maxFiles: 7,
            },
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
exports.auditLogger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
        targets: [
            // pretty console output for development
            {
                target: "pino-pretty",
                options: {
                    colorize: true,
                },
            },
            {
                target: "pino-rotating-file", options: {
                    dirname: logDirectory,
                    filename: "audit.log",
                    maxsize: "5mb", // rotate after 10mb
                    interval: "1d", // rotate after 1d
                    compress: true,
                    maxFiles: 14, // keep 14 days of logs
                }
            },
        ],
    }
        : {
            target: "pino/file",
            level: "info",
            options: { destination: auditlogfile, mkdir: true },
        },
});
