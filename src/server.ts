// main entry point
import App from './app';
import 'reflect-metadata';
import dotenv from 'dotenv';
import { validateEnv } from './utils/validateEnv';
import AppDataSource from './ormconfig';

dotenv.config();
validateEnv();

const app = new App();

app.listen();
app.initializeDatabase().then(() => {
    console.log("Database is connected and ready for queries.");
});


//console.log('DB:', AppDataSource.options.database)



 
