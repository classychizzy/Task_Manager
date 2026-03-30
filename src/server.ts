// main entry point
import App from './app';
import 'reflect-metadata';
import dotenv from 'dotenv';
import { validateEnv } from './utils/validateEnv';
import AppDataSource from './ormconfig';
import { handleTaskCron } from './jobs/cronjobs';

dotenv.config();
validateEnv();

const app = new App();

app.initializeDatabase().then(() => {
    console.log("Database is connected and ready for queries.");
    if (process.env.RUN_CRON === 'true') {
        handleTaskCron();
        console.log('cron jobs started');
    }
    app.listen();
});


//console.log('DB:', AppDataSource.options.database)




