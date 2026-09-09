"use strict";
// global response helper
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (status_code, message, data, meta) => ({
    status_code,
    success: true,
    message,
    data,
    meta
});
exports.successResponse = successResponse;
const errorResponse = (status_code, message, error) => ({
    status_code,
    success: false,
    message,
    error,
});
exports.errorResponse = errorResponse;
