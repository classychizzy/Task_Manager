import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express/auth-request';

export const requestLogger = pinoHttp({
    logger,
    genReqId: function (req) {
        return req.headers["x-request-id"] || require("crypto").randomUUID();
    },
    customLogLevel: function (req, res, err) {
        if (err || (res.statusCode && res.statusCode >= 500)) return "error";
        if (res.statusCode && res.statusCode >= 400) return "warn";
        return "info";
    },
    customSuccessMessage: function (req, res) {
        return `${req.method} ${req.url} completed`;
    },
    customProps: function (req, res) {
        const authReq = req as AuthenticatedRequest;
        return {
            user: authReq.user ?? null,
        };
    },
});
