"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLimiter = exports.strictAuthLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importStar(require("express-rate-limit"));
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
// 1. Global baseline — applies to the whole app, generous, just stops raw flooding
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTestEnv ? 1000 : 10, // bypass for test and dev environment test
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests, try again later.",
    }
});
// old way- not suited for specific endpoints
// export const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5, // very strict
//     handler: (req: AuthenticatedRequest, res: Response) => {
//         logger.info("Too many login attempts. Try again later.");
//     },
//     message: {
//         status: "error",
//         message: "Too many login attempts. Try again later.",
//     },
// });
// 2. Strict — credential-guessing endpoints, tight, keyed by email where possible
exports.strictAuthLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 100 : 5,
    keyGenerator: (req) => req.body.email || (0, express_rate_limit_1.ipKeyGenerator)(req.ip || 'unknown'),
});
// 3. Moderate — token-based, higher entropy, called more frequently by legit clients
exports.refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 30, // more generous, since refresh happens automatically and often
});
