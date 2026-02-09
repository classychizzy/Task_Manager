"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authheader = req.headers['authorization'];
    // // Debug logging
    // console.log('Raw Authorization Header:', JSON.stringify(authheader));
    // console.log('Authorization Header Length:', authheader?.length);
    const token = authheader && authheader.split(' ')[1];
    // console.log('Extracted Token:', JSON.stringify(token));
    if (!token) {
        let response = {
            status_code: 401,
            status: 'failed',
            message: 'missing token',
            data: null
        };
        return res.status(401).json(response);
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            console.log(err);
            return res.status(403).json({
                status: "failed",
                message: "Invalid or expired token",
                data: null,
            });
        }
        req.user = decoded; // ← THIS is what makes runtime work
        next();
    });
}
