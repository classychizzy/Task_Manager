"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// main entry point
const app_1 = __importDefault(require("./app"));
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const validateEnv_1 = require("./utils/validateEnv");
const cronjobs_1 = require("./jobs/cronjobs");
dotenv_1.default.config();
(0, validateEnv_1.validateEnv)();
const app = new app_1.default();
app.initializeDatabase().then(() => {
    console.log("Database is connected and ready for queries.");
    if (process.env.RUN_CRON === 'true') {
        (0, cronjobs_1.handleTaskCron)();
        console.log('cron jobs started');
    }
    app.listen();
});
//console.log('DB:', AppDataSource.options.database)
