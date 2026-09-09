"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const logger_1 = require("../lib/logger");
function auditLog({ action, userId, resource, resourceId, metadata, }) {
    logger_1.auditLogger.info({
        type: "AUDIT",
        action,
        userId,
        resource,
        resourceId,
        metadata,
        timestamp: new Date().toISOString(),
    });
}
