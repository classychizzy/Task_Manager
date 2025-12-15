"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth_Controller = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth_service");
class Auth_Controller {
    //set up user service here
    authService;
    //set up auth routes
    router;
    constructor() {
        this.authService = new auth_service_1.Auth_Service();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    async registerUser(req, res) {
        console.log("we test");
        //access request body data
        try {
            //write payload here
            const user = await this.authService.registerUser(req.body);
            console.log(req.body);
            return res.status(200).json({ data: user,
                message: "User registered successfully",
                status: "success",
                status_code: 200
            });
        }
        catch (error) {
            console.log("failed");
            let errorMessage = "An unknown error occurred during registration.";
            if (error instanceof Error) {
                // Now TypeScript knows `error` has a `message` property
                return res.status(400).json({ errorMessage: error.message });
            }
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return res.json(response);
        }
    }
    async loginUser(req, res) {
    }
    async findUserByEmail(req, res) {
        let user = await this.authService.findUserByEmail(req.body);
        try {
            if (user) {
                let response = {
                    status_code: 200,
                    status: 'success',
                    message: 'User found successfully.',
                    data: user
                };
                return res.json(response);
            }
        }
        catch (error) {
            let errorMessage = "an unknown error occured";
            if (error instanceof Error) {
                return res.status(400).json({ errorMessage: error.message });
            }
            let response = {
                status_code: 500,
                messsage: 'Internal server error.',
                status: 'failed',
                errorMessage: errorMessage,
                data: null
            };
            return res.json(response);
        }
    }
    initializeRoutes() {
        this.router.get('/welcome', (req, res) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register', 
        //add middleware here
        this.registerUser.bind(this));
        this.router.post('/login', 
        //add middleware here
        this.loginUser.bind(this));
        this.router.get('/user', 
        //add middleware here
        this.authService.findUserByEmail.bind(this));
        // this.router.get('/find/:id', 
        //     //add middleware here
        //     this.findUserByEmail.bind(this)
        // );
    }
}
exports.Auth_Controller = Auth_Controller;
