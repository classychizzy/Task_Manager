import { Request, Response } from "express";
import { checkHealth } from "../services/health_service";

export const healthController = async (req: Request, res: Response) => {
    const result = await checkHealth();

    const statusCode = result.status === "ok" ? 200 : 500;

    res.status(statusCode).json({
        ...result,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
};