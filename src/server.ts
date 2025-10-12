// main entry point
import App from './app';
import express, { request, response } from 'express';
import { validateEnv } from './utils/validateEnv';
import AppDataSource from './ormconfig'
import dotenv from 'dotenv';

dotenv.config();
validateEnv();



const port = process.env.PORT || 8000;

const app = new App();
app.listen(Number(port));


app.app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello World!');
});


