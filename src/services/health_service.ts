// src/modules/health/health.service.ts

import AppDataSource from '../ormconfig';

export const checkHealth = async () => {
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
};