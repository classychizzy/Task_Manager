"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helmetOptions = void 0;
const isProduction = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production';
exports.helmetOptions = isProduction ? {
    hsts: { maxAge: 31536000 },
}
    : {
        contentSecurityPolicy: false,
        hsts: false,
    };
