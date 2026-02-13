"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth_Controller = void 0;
const express_1 = require("express");
const auth_service_1 = require("../services/auth/auth_service");
class Auth_Controller {
    constructor() {
        this.authService = new auth_service_1.Auth_Service();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    async registerUser(req, res) {
        const user = await this.authService.registerUser(req.body);
        return res.json(user);
    }
    async loginUser(req, res) {
        const userData = req.body;
        console.log(userData);
        const user = await this.authService.loginUser(userData);
        return res.json(user);
        //return res.json("await this.authService.loginUser(req.body)");
    }
    async findUserByEmail(req, res) {
        const userData = req.body;
        console.log(userData);
        let user = await this.authService.findUserByEmail(userData);
        return res.json(user);
    }
    async refreshToken(req, res) {
        let refresh = await this.authService.refreshToken(req, res);
        return res.json(refresh);
    }
    async LogoutUser(req, res) {
        const userId = req.user.id;
        const { refreshToken } = req.body;
        let logout = await this.authService.LogoutUser(Number(userId), refreshToken);
        return res.json(logout);
    }
    async DeleteUser(req, res) {
        const userId = req.user.id;
        let logout = await this.authService.DeleteUser(Number(userId));
        return res.json(logout);
    }
    initializeRoutes() {
        this.router.get('/welcome', (req, res) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register', 
        //add middleware here
        this.registerUser.bind(this));
        this.router.post('/login', this.loginUser.bind(this));
        this.router.post('/user', 
        //add middleware here
        this.findUserByEmail.bind(this));
        this.router.post('/refresh', 
        //add middleware here
        this.refreshToken.bind(this));
        this.router.post('/logout', 
        //add middleware here
        this.LogoutUser.bind(this));
        this.router.delete('/delete/me', 
        //add middleware here
        this.DeleteUser.bind(this));
        //
    }
}
exports.Auth_Controller = Auth_Controller;
