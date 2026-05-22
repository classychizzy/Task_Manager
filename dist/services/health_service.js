"use strict";
// src/modules/health/health.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const ormconfig_1 = __importDefault(require("../ormconfig"));
class HealthService {
    async checkHealth() {
        console.log("checkHealth called");
        try {
            await ormconfig_1.default.query("SELECT 1");
            return {
                status: "ok",
                database: "connected",
            };
        }
        catch (error) {
            return {
                status: "error",
                database: "disconnected",
            };
        }
    }
}
exports.HealthService = HealthService;
