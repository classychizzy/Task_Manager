// main entry point
import App from './app';
import express, { request, response } from 'express';
import { validateEnv } from './utils/validateEnv';
import AppDataSource from './ormconfig'

validateEnv();



AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
    })
    .catch((err: any) => {
        console.error('Error during Data Source initialization:', err);
    });




const port = process.env.PORT || 8080;

const app = new App();
app.listen(Number(port));

app.app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello World!');
});


