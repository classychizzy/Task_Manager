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
const login_dto_1 = require("../dto/login_dto");
const update_user_dto_1 = require("../dto/update_user_dto");
const changePassword_Dto_1 = require("../dto/changePassword_Dto");
const forgot_password_dto_1 = require("../dto/forgot_password_dto");
const resetPassword_dto_1 = require("../dto/resetPassword_dto");
const findbyEmail_dto_1 = require("../dto/findbyEmail_dto");
const refresh_dto_1 = require("../dto/refresh_dto");
class Auth_Controller {
    constructor() {
        this.authService = new auth_service_1.Auth_Service();
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    async registerUser(req, res) {
        try {
            const result = await this.authService.registerUser(req.body);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in registerUser');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }
    async loginUser(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ email: userData.email }, 'loginUser called');
            const result = await this.authService.loginUser(userData);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in loginUser');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }
    async findUserByEmail(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ email: userData.email }, 'findUserByEmail called');
            let result = await this.authService.findUserByEmail(userData);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in findUserByEmail');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }
    async refreshToken(req, res) {
        try {
            const refreshtoken = req.body.RefreshTokenDTO;
            logger_1.logger.info('refreshToken endpoint called');
            let refresh = await this.authService.refreshToken(refreshtoken);
            return res.status(refresh.status_code || 200).json(refresh);
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
            return res.status(logout.status_code || 200).json(logout);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in LogoutUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async DeleteUser(req, res) {
        try {
            const requesterId = req.user.id;
            logger_1.logger.info({ requesterId }, 'DeleteUser called');
            let Delete = await this.authService.DeleteUser(Number(requesterId));
            return res.status(Delete.status_code || 200).json(Delete);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in DeleteUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async updateUser(req, res) {
        try {
            const userId = req.user.id;
            logger_1.logger.info({ userId }, 'updateUser called');
            let update = await this.authService.UpdateUser(Number(userId), req.body);
            return res.status(update.status_code || 200).json(update);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in updateUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async changePassword(req, res) {
        try {
            const userId = req.user.id;
            const changePasswordDto = req.body;
            logger_1.logger.info({ userId }, 'changePassword called');
            let result = await this.authService.changePassword(Number(userId), changePasswordDto);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in changePassword');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async forgotPassword(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ email: userData.email }, 'forgotPassword called');
            const result = await this.authService.forgotPassword(userData);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in forgotPassword');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }
    async resetPassword(req, res) {
        try {
            const userData = req.body;
            logger_1.logger.debug({ tokenProvided: !!userData.token }, 'resetPassword called');
            const result = await this.authService.resetPassword(userData);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in resetPassword');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }
    initializeRoutes() {
        this.router.get('/welcome', (req, res) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register', ratelimiter_1.strictAuthLimiter, (0, validateDto_1.validateDto)(user_dto_1.UserDTO), this.registerUser.bind(this));
        this.router.post('/login', ratelimiter_1.strictAuthLimiter, (0, validateDto_1.validateDto)(login_dto_1.LoginDTO), this.loginUser.bind(this));
        this.router.post('/user', (0, validateDto_1.validateDto)(findbyEmail_dto_1.findbyEmailDTO), this.findUserByEmail.bind(this));
        this.router.post('/refresh', ratelimiter_1.refreshLimiter, (0, validateDto_1.validateDto)(refresh_dto_1.RefreshTokenDTO), this.refreshToken.bind(this));
        this.router.post('/logout', jwt_auth_1.authenticateToken, this.LogoutUser.bind(this));
        this.router.delete('/delete/me', jwt_auth_1.authenticateToken, this.DeleteUser.bind(this));
        this.router.put('/update/me', jwt_auth_1.authenticateToken, (0, validateDto_1.validateDto)(update_user_dto_1.UpdateUserDTO), this.updateUser.bind(this));
        this.router.put('/change/password', jwt_auth_1.authenticateToken, ratelimiter_1.strictAuthLimiter, (0, validateDto_1.validateDto)(changePassword_Dto_1.ChangePasswordDTO), this.changePassword.bind(this));
        this.router.post("/forgot-password", ratelimiter_1.strictAuthLimiter, (0, validateDto_1.validateDto)(forgot_password_dto_1.forgotPasswordDto), this.forgotPassword.bind(this));
        this.router.post("/reset-password", ratelimiter_1.strictAuthLimiter, (0, validateDto_1.validateDto)(resetPassword_dto_1.ResetPasswordDto), this.resetPassword.bind(this));
    }
}
exports.Auth_Controller = Auth_Controller;
