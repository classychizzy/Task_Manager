"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const streams = [
    {
        target: 'pino-pretty',
        level: process.env.LOG_LEVEL || 'info',
        options: {
            colorize: true,
        },
    },
];
if (process.env.LOG_FILE) {
    streams.push({
        target: 'pino/file',
        level: process.env.LOG_LEVEL || 'info',
        options: { destination: process.env.LOG_FILE, mkdir: true },
    });
}
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    redact: [
        'req.headers.authorization',
        'res.headers.authorization',
        'req.body.password',
        'res.body.password',
    ],
    transport: {
        targets: streams,
    },
});
