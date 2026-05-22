"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const express_1 = require("express");
const health_service_1 = require("../services/health_service");
class HealthController {
    constructor() {
        this.healthCheck = async (req, res) => {
            const result = await this.healthService.checkHealth();
            const statusCode = result.status === "ok" ? 200 : 500;
            res.status(statusCode).json({
                ...result,
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            });
        };
        this.healthService = new health_service_1.HealthService();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.get("/", this.healthCheck);
    }
}
exports.HealthController = HealthController;
