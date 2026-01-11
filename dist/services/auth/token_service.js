"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TokenService {
    constructor() {
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set.');
        }
        this.AccessSecret = process.env.JWT_ACCESS_SECRET;
        this.RefreshSecret = process.env.JWT_SECRET;
        // this.expiresIn = process.env.JWT_EXPIRES_IN as string;
    }
    generateAccessToken(payload) {
        /**  const payload: UserPayload = {
             id: user.user_id,
             email: user.email,
             username: user.username,
             // Add other relevant user data to the payload
         };*/
        if (process.env.JWT_EXPIRES_IN_ACCESS_TOKEN) {
            this.option.expiresIn = process.env.JWT_EXPIRES_IN_ACCESS_TOKEN;
            this.option.algorithm = 'HS256';
        }
        else {
            this.option.expiresIn = Number('1');
            this.option.algorithm = 'HS256';
        }
        return jsonwebtoken_1.default.sign(payload, this.AccessSecret, this.option);
    }
    generateRefreshToken(payload) {
        /* const payload: UserPayload = {
             id: user.user_id,
             email: user.email,
             username: user.username
         }; */
        if (process.env.JWT_EXPIRES_IN_REFRESH_TOKEN) {
            this.option.expiresIn = Number(process.env.JWT_EXPIRES_IN_REFRESH_TOKEN ?? '7d');
            this.option.algorithm = 'HS256';
        }
        return jsonwebtoken_1.default.sign(payload, this.RefreshSecret, this.option);
    }
    verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.AccessSecret);
        }
        catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
    verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.RefreshSecret);
        }
        catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
}
exports.TokenService = TokenService;
