import { rateLimit } from 'express-rate-limit';
import { logger } from '../lib/logger';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express/auth-request';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many requests, try again later.",

    }
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // very strict
    handler: (req: AuthenticatedRequest, res: Response) => {
        logger.info("Too many login attempts. Try again later.");

    },
    message: {
        status: "error",
        message: "Too many login attempts. Try again later.",
    },
});