"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authheader = req.headers['authorization'];
    const token = authheader && authheader.split(' ')[1];
    if (!token) {
        let response = {
            status_code: 401,
            status: 'failed',
            message: 'missing token',
            data: null
        };
        return response;
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            let response = {
                status_code: 403,
                status: 'failed',
                message: 'invalid or expired token',
                data: null
            };
            req.user = decoded;
            next();
        }
    });
}
