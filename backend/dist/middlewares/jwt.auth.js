"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../lib/logger");
function authenticateToken(req, res, next) {
    try {
        const authheader = req.headers['authorization'];
        // // Debug logging
        // console.log('Raw Authorization Header:', JSON.stringify(authheader));
        logger_1.logger.debug('Raw Authorization Header:' + JSON.stringify(authheader));
        logger_1.logger.debug('Authorization Header Length:' + authheader?.length);
        const token = authheader && authheader.split(' ')[1];
        logger_1.logger.debug('Extracted Token');
        if (!token) {
            let response = {
                status_code: 401,
                success: false,
                message: 'missing token',
                data: null
            };
            return res.status(401).json(response);
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
            if (err) {
                logger_1.logger.error('Invalid or expired token:');
                return res.status(403).json({
                    status_code: 403,
                    success: false,
                    message: "Invalid or expired token",
                    data: null,
                });
            }
            req.user = decoded; // ← THIS is what makes runtime work
            next();
        });
    }
    catch (error) {
        logger_1.logger.error('Error authenticating token:');
        return res.status(500).json({
            status_code: 500,
            success: false,
            message: "Internal server error",
            data: null,
        });
    }
}
