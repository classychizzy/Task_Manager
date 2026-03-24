"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const pino_http_1 = __importDefault(require("pino-http"));
const logger_1 = require("../lib/logger");
exports.requestLogger = (0, pino_http_1.default)({
    logger: logger_1.logger,
    genReqId: function (req) {
        return req.headers["x-request-id"] || require("crypto").randomUUID();
    },
    customLogLevel: function (res, err) {
        if (res.statusCode !== undefined && res.statusCode >= 500 || err)
            return "error";
        if (res.statusCode !== undefined && res.statusCode >= 400)
            return "warn";
        return "info";
    },
    customSuccessMessage: function (req, res) {
        return `${req.method} ${req.url} completed`;
    },
    customProps: function (req, res) {
        const authReq = req;
        return {
            user: authReq.user ?? null,
        };
    },
});
