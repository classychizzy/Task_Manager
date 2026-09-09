"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditAction = void 0;
var AuditAction;
(function (AuditAction) {
    // Auth
    AuditAction["USER_REGISTER"] = "USER_REGISTER";
    AuditAction["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditAction["LOGIN_FAILED_USER_NOT_FOUND"] = "LOGIN_FAILED_USER_NOT_FOUND";
    AuditAction["LOGIN_FAILED_INVALID_PASSWORD"] = "LOGIN_FAILED_INVALID_PASSWORD";
    AuditAction["LOGOUT"] = "LOGOUT";
    // Tasks
    AuditAction["TASK_CREATED"] = "TASK_CREATED";
    AuditAction["TASK_UPDATED"] = "TASK_UPDATED";
    AuditAction["TASK_DELETED"] = "TASK_DELETED";
    // Task Assignment
    AuditAction["TASK_ASSIGNED"] = "TASK_ASSIGNED";
    AuditAction["TASK_UNASSIGNED"] = "TASK_UNASSIGNED";
    AuditAction["TASK_OWNERSHIP_TRANSFERRED"] = "TASK_OWNERSHIP_TRANSFERRED";
    // Projects
    AuditAction["PROJECT_CREATED"] = "PROJECT_CREATED";
    AuditAction["PROJECT_UPDATED"] = "PROJECT_UPDATED";
    AuditAction["PROJECT_DELETED"] = "PROJECT_DELETED";
    AuditAction["PROJECT_RESTORED"] = "PROJECT_RESTORED";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
