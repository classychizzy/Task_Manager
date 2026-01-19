//main app file
import express from 'express';
//import type { Request, Response } from 'express';
//import bodyParser from 'body-parser';
import cors from 'cors';
import AppDataSource from './ormconfig';
import { Auth_Controller } from './controllers/auth_controller';
import helmet from 'helmet';
import { Request, Response } from 'express';
import * as http from 'http';
//import { register } from 'module';
import { authenticateToken } from './middlewares/jwt.auth';
import { Project_Controller } from './controllers/project_controller';



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
    }

    
    private initializeControllers() {
        this.app.use("/welcome", async function (req: Request, res: Response) {
            res.status(200).send("Welcome to Task Manager");
        });
        console.log('Initializing controllers...');
        //base route for all initialized routes in the controller
         this.app.use('/api/v1/auth', new Auth_Controller().router);
         //route handler for projects
         this.app.use( '/api/v1/projects',
                        authenticateToken,
                        new Project_Controller().router,
                    );
        
         
    }   

    public listen() {
        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
    public initializeDatabase() {
        return AppDataSource.initialize().then(() => {
            console.log('Data Source has been initialized!');
        }).catch((err: any) => {
            console.error('Error during Data Source initialization:', err);
            process.exit(1);
        });
    }
}

export default App;