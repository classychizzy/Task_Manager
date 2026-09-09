"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xssPayloads = exports.sqlInjectionPayloads = void 0;
// tests/__tests__/helpers/securitypayload.ts
exports.sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' OR 1=1 --",
    "admin'--",
    "' UNION SELECT * FROM users --",
];
exports.xssPayloads = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
];
