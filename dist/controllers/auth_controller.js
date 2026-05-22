"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth_Controller = void 0;
const express_1 = require("express");
const user_dto_1 = require("../dto/user_dto");
const validateDto_1 = require("../middlewares/validateDto");
const auth_service_1 = require("../services/auth/auth_service");
const jwt_auth_1 = require("../middlewares/jwt.auth");
const logger_1 = require("../lib/logger");
const ratelimiter_1 = require("../middlewares/ratelimiter");
class Auth_Controller {
    constructor() {
        this.authService = new auth_service_1.Auth_Service();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    async registerUser(req, res) {
        try {
            const response = await this.authService.registerUser(req.body);
            if (response.status_code === 200) {
                logger_1.logger.info({ userId: response.data?.user_id, email: response.data?.email }, 'User registered successfully');
            }
            else {
                logger_1.logger.warn({ status_code: response.status_code, message: response.message }, 'User registration failed');
            }
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in registerUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async loginUser(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ email: userData.email }, 'loginUser called');
            const user = await this.authService.loginUser(userData);
            return res.json(user);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in loginUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async findUserByEmail(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ email: userData.email }, 'findUserByEmail called');
            let user = await this.authService.findUserByEmail(userData);
            return res.json(user);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in findUserByEmail');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async refreshToken(req, res) {
        try {
            const refreshtoken = req.body.refreshToken;
            logger_1.logger.info('refreshToken endpoint called');
            let refresh = await this.authService.refreshToken(refreshtoken);
            return res.json(refresh);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in refreshToken');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async LogoutUser(req, res) {
        try {
            const userId = req.user.id;
            const { refreshToken } = req.body;
            logger_1.logger.info({ userId }, 'LogoutUser called');
            let logout = await this.authService.LogoutUser(Number(userId), refreshToken);
            return res.json(logout);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in LogoutUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async DeleteUser(req, res) {
        try {
            const userId = req.user.id;
            logger_1.logger.info({ userId }, 'DeleteUser called');
            let Delete = await this.authService.DeleteUser(Number(userId));
            return res.json(Delete);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in DeleteUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.get('/welcome', (req, res) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register', (0, validateDto_1.validateDto)(user_dto_1.UserDTO), this.registerUser.bind(this));
        this.router.post('/login', ratelimiter_1.authLimiter, (0, validateDto_1.validateDto)(user_dto_1.UserDTO), this.loginUser.bind(this));
        this.router.post('/user', (0, validateDto_1.validateDto)(user_dto_1.UserDTO), this.findUserByEmail.bind(this));
        this.router.post('/refresh', this.refreshToken.bind(this));
        this.router.post('/logout', jwt_auth_1.authenticateToken, this.LogoutUser.bind(this));
        this.router.delete('/delete/me', jwt_auth_1.authenticateToken, (0, validateDto_1.validateDto)(user_dto_1.UserDTO), this.DeleteUser.bind(this));
        //
    }
}
exports.Auth_Controller = Auth_Controller;
