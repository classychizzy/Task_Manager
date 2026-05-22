//main app file
import express from 'express';
//import type { Request, Response } from 'express';
//import bodyParser from 'body-parser';
import cors from 'cors';
import AppDataSource from './ormconfig';

import helmet from 'helmet';

import { Request, Response } from 'express';
import * as http from 'http';
import { globalLimiter } from './middlewares/ratelimiter';

import { HealthController } from './controllers/health_controller';
import { Auth_Controller } from './controllers/auth_controller';
import { authenticateToken } from './middlewares/jwt.auth';
import { Project_Controller } from './controllers/project_controller';
import { Task_Controller } from './controllers/task_controller';
import { TaskAssignment_Controller } from './controllers/task_assignment_controller';
import { Comment_Controller } from './controllers/comment_controller';
import { requestLogger } from './middlewares/requestlogger';



class App {
    public app: express.Application;
    public port: number

    constructor() {
        this.app = express();
        this.port = Number(process.env.PORT) || 9000;
        this.initializeMiddlewares();
        this.initializeControllers();
    }

    private initializeMiddlewares() {
        console.log('Initializing middlewares...');
        // this.app.use(bodyParser.json());
        // this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(requestLogger); //request logger middleware
        this.app.use(globalLimiter); //global rate limiter

        this.app.use((err: any, req: Request, res: Response, next: any) => {
            console.error(err.stack) // this shows you the real error
            res.status(500).json({ message: err.message })
        })

    }


    private initializeControllers() {
        this.app.use("/welcome", async function (req: Request, res: Response) {
            res.status(200).send("Welcome to Task Manager");
        });
        console.log('Initializing controllers...');

        this.app.use("/api/v1/health", new HealthController().router)
        //base route for all initialized routes in the controller
        this.app.use('/api/v1/auth', new Auth_Controller().router);
        //route handler for projects
        this.app.use('/api/v1/projects',
            authenticateToken,
            new Project_Controller().router,
        );
        this.app.use('/api/v1/tasks',
            authenticateToken,
            new Task_Controller().router)

        this.app.use('/api/v1/taskassignments',
            authenticateToken,
            new TaskAssignment_Controller().router)

        this.app.use(
            '/api/v1/comments',
            authenticateToken,
            new Comment_Controller().router
        );


    }

    public listen() {
        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
    public async initializeDatabase(retries = 5, delay = 5000): Promise<void> {
        while (retries > 0) {
            try {
                await AppDataSource.initialize();
                console.log('Data Source has been initialized!');
                return;
            } catch (err: any) {
                retries--;
                console.error(`Error during Data Source initialization. Retries left: ${retries}`, err);
                if (retries === 0) {
                    process.exit(1);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}

export default App;