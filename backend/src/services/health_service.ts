// src/modules/health/health.service.ts

import AppDataSource from '../ormconfig';
import { logger } from '../lib/logger';

export class HealthService {
    public async checkHealth() {
        logger.info("checkHealth called");

        try {
            await AppDataSource.query("SELECT 1");

            return {
                status: "ok",
                database: "connected",
            };
        } catch (error) {
            return {
                status: "error",
                database: "disconnected",
            };
        }
    }
}