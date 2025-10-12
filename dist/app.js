"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//main app file
const express_1 = __importDefault(require("express"));
//import type { Request, Response } from 'express';
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const ormconfig_1 = __importDefault(require("./ormconfig"));
class App {
    app;
    port;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = Number(process.env.PORT) || 8000;
        this.initializeMiddlewares();
        //this.initializeControllers();
        this.initializeDatabase();
    }
    initializeMiddlewares() {
        this.app.use(body_parser_1.default.json());
        this.app.use(body_parser_1.default.urlencoded({ extended: true }));
        this.app.use((0, cors_1.default)());
    }
    // private initializeControllers() {
    //     this.app.use('/api', controllers);
    // }    
    listen(port) {
    }
    async initializeDatabase() {
        ormconfig_1.default.initialize().then(() => {
            console.log('Data Source has been initialized!');
            this.app.listen(this.port, () => {
                console.log(`Server is running on http://localhost:${this.port}`);
            });
        }).catch((err) => {
            console.error('Error during Data Source initialization:', err);
        });
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map