import { Request, Response, Router } from "express";
import { HealthService } from "../services/health_service";


export class HealthController {

    private healthService: HealthService;
    public router: Router;

    constructor() {
        this.healthService = new HealthService();
        this.router = Router();

        this.initializeRoutes();
    }


    public healthCheck = async (
        req: Request,
        res: Response
    ) => {

        const result = await this.healthService.checkHealth();

        const statusCode =
            result.status === "ok" ? 200 : 500;

        res.status(statusCode).json({
            ...result,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    };

    private initializeRoutes() {
        this.router.get("/", this.healthCheck)
    }
}



