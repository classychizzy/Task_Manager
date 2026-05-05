"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const logger_1 = require("../lib/logger");
exports.globalLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests, try again later.",
    }
});
exports.authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 5, // very strict
    handler: (req, res) => {
        logger_1.logger.info("Too many login attempts. Try again later.");
    },
    message: {
        status: "error",
        message: "Too many login attempts. Try again later.",
    },
});
