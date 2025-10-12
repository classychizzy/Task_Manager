//main app file
import express from 'express';
//import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import AppDataSource from './ormconfig';

class App {
    public app: express.Application;
    public port: number

    constructor() {
        this.app = express();
        this.port = Number(process.env.PORT) || 8000;
        this.initializeMiddlewares();
        //this.initializeControllers();
        this.initializeDatabase();


    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(cors());
    }

    // private initializeControllers() {
    //     this.app.use('/api', controllers);
    // }    
    public listen(port: number) {
        

    }

    public async initializeDatabase() {

        AppDataSource.initialize().then(() => {
            console.log('Data Source has been initialized!');
            this.app.listen(this.port, () => {
            
            console.log(`Server is running on http://localhost:${this.port}`);
        });
        }).catch((err: any) => {
            console.error('Error during Data Source initialization:', err);
        });

    }
}

export default App;