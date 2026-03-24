"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//main app file
const express_1 = __importDefault(require("express"));
//import type { Request, Response } from 'express';
//import bodyParser from 'body-parser';
const cors_1 = __importDefault(require("cors"));
const ormconfig_1 = __importDefault(require("./ormconfig"));
const auth_controller_1 = require("./controllers/auth_controller");
const helmet_1 = __importDefault(require("helmet"));
const http = __importStar(require("http"));
//import { register } from 'module';
const jwt_auth_1 = require("./middlewares/jwt.auth");
const project_controller_1 = require("./controllers/project_controller");
const task_controller_1 = require("./controllers/task_controller");
const task_assignment_controller_1 = require("./controllers/task_assignment_controller");
const comment_controller_1 = require("./controllers/comment_controller");
const requestlogger_1 = require("./middlewares/requestlogger");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = Number(process.env.PORT) || 9000;
        this.initializeMiddlewares();
        this.initializeControllers();
    }
    initializeMiddlewares() {
        console.log('Initializing middlewares...');
        // this.app.use(bodyParser.json());
        // this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)());
        this.app.use((0, helmet_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.use(requestlogger_1.requestLogger); //request logger middleware
    }
    initializeControllers() {
        this.app.use("/welcome", async function (req, res) {
            res.status(200).send("Welcome to Task Manager");
        });
        console.log('Initializing controllers...');
        //base route for all initialized routes in the controller
        this.app.use('/api/v1/auth', new auth_controller_1.Auth_Controller().router);
        //route handler for projects
        this.app.use('/api/v1/projects', jwt_auth_1.authenticateToken, new project_controller_1.Project_Controller().router);
        this.app.use('/api/v1/tasks', jwt_auth_1.authenticateToken, new task_controller_1.Task_Controller().router);
        this.app.use('/api/v1/taskassignments', jwt_auth_1.authenticateToken, new task_assignment_controller_1.TaskAssignment_Controller().router);
        this.app.use('/api/v1', jwt_auth_1.authenticateToken, new comment_controller_1.Comment_Controller().router);
    }
    listen() {
        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server is running on http://localhost:${this.port}`);
        });
    }
    initializeDatabase() {
        return ormconfig_1.default.initialize().then(() => {
            console.log('Data Source has been initialized!');
        }).catch((err) => {
            console.error('Error during Data Source initialization:', err);
            process.exit(1);
        });
    }
}
exports.default = App;
