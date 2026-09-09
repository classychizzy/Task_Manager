"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth_Service = void 0;
const user_repository_1 = require("../../repositories/user_repository");
const user_validation_1 = require("../../validator/user_validation");
//import { hashPassword, comparePassword } from '../../utils/hashPassword';
const user_entity_1 = require("../../entities/user_entity");
``;
const token_service_1 = require("./token_service");
const refresh_repository_1 = require("../../repositories/refresh_repository");
const refresh_entity_1 = require("../../entities/refresh_entity");
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const logger_1 = require("../../lib/logger");
const auditlogs_1 = require("../../utils/auditlogs");
const auditActions_1 = require("../../enums/auditActions");
const responsehelper_1 = require("../../utils/responsehelper");
const reset_token_1 = require("../../utils/reset_token");
const mailer_1 = require("../../utils/mailer");
dotenv_1.default.config();
//handles all user and authentication issues
const RESET_TOKEN_EXPIRY_MINUTES = Number(process.env.RESET_TOKEN_EXPIRY_MINUTES) || 30;
//create a service class where you will write your queries and logics
class Auth_Service {
    constructor() {
        this.userRepository = user_repository_1.UserRepository;
        this.RefreshRepository = refresh_repository_1.RefreshRepository;
        this.tokenService = new token_service_1.TokenService();
    }
    async registerUser(userData) {
        /**  console.log(
             userData.firstName,
             userData.lastName,
             userData.username,
             userData.email,
             userData.password
         );
         */
        // check if user exists first
        const existingUser = await this.userRepository.findOne({
            where: {
                email: userData.email
            },
        });
        if (existingUser) {
            const result = (0, responsehelper_1.errorResponse)(409, 'User already exists');
            return result;
        }
        // Here you would typically hash the password before saving
        // const hashedPassword = await hashPassword(userData.password);
        // userData.password = hashedPassword;
        // For simplicity, we'll save it as is for now.
        try {
            logger_1.logger.debug({ email: userData.email }, 'registerUser called');
            let IsEmailValid = (0, user_validation_1.validateEmail)(userData.email);
            logger_1.logger.debug({ IsEmailValid: IsEmailValid, email: userData.email }, 'Email validation result');
            if (!IsEmailValid) {
                return (0, responsehelper_1.errorResponse)(400, 'Enter a valid email address');
            }
            //create an instance of user entity
            const newUser = new user_entity_1.User_entity();
            //assign properties to the user entity instance
            newUser.firstName = userData.firstName;
            newUser.lastName = userData.lastName;
            newUser.username = userData.username;
            newUser.email = userData.email;
            newUser.password = userData.password;
            // call then hashing here
            newUser.hashPassword();
            //newUser.password = await hashPassword( userData.password); // In a real app, hash this!
            // await AppDataSource.manager.save(newUser);
            await this.userRepository.save(newUser);
            // return newUser;
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.USER_REGISTER,
                userId: newUser.user_id,
                resource: "AUTH",
                resourceId: newUser.user_id.toString(),
                metadata: {
                    email: newUser.email,
                    username: newUser.username
                }
            });
            const { password, ...userWithoutPassword } = newUser;
            return (0, responsehelper_1.successResponse)(201, 'User registered successfully', userWithoutPassword);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during user registration');
            let errorMessage = "An unknown error occurred during registration.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'User registration failed. Internal server error.', errorMessage);
        }
    }
    async findUserByEmail(userData) {
        logger_1.logger.debug({ email: userData.email }, 'findUserByEmail called');
        try {
            if (!userData?.email) {
                return (0, responsehelper_1.errorResponse)(400, 'Email is required');
            }
            const user = await this.userRepository.findOne({
                where: {
                    email: userData.email,
                },
                // relations: {
                //     projects: {
                //         tasks: true,
                //     },
                //     tasks: true,
                //     comments: true,
                //     task_assignments: true
                // }
                relations: [
                    "projects",
                    "projects.tasks",
                    "tasks",
                    "comments",
                    "task_assignments"
                ],
                order: {
                    user_id: "DESC"
                }
            });
            logger_1.logger.debug({ userId: user?.user_id, email: user?.email }, 'User lookup result');
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            let response = {
                status_code: 200,
                success: true,
                message: 'User retrieved successfully',
                data: user
            };
            return response;
            // return await AppDataSource.manager.findOne(User_entity, { where: { email: user.email } });
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during findUserByEmail');
            let errorMessage = "An unknown error occurred during registration.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async loginUser(userData) {
        try {
            // const isemailValid = validateEmail(userData.email);
            const user = await this.userRepository.findOne({
                where: {
                    email: userData.email,
                    is_deleted: false,
                }
            });
            logger_1.logger.debug({ userId: user?.user_id, email: user?.email }, 'User fetched for login');
            if (!user) {
                (0, auditlogs_1.auditLog)({
                    action: auditActions_1.AuditAction.LOGIN_FAILED_USER_NOT_FOUND,
                    // userId: user!.user_id, (null as user is non existent here)
                    resource: "AUTH",
                    resourceId: "unknown", // user is non-existent in this case
                    metadata: {
                        email: userData.email, // returns the submitted email
                    }
                });
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            if (user.is_deleted === true) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            // const ispasswordValid = await comparePassword(userData.password, user!.password);
            // if (!user || !ispasswordValid) {
            //     let response = {
            //         status_code: 404,
            //         status: 'failed',
            //         message: 'User not found',
            //         data: null
            //     }
            //     return response;
            // }
            if (!user.checkIfUnencryptedPasswordIsValid(userData.password)) {
                (0, auditlogs_1.auditLog)({
                    action: auditActions_1.AuditAction.LOGIN_FAILED_INVALID_PASSWORD,
                    userId: user.user_id,
                    resource: "AUTH",
                    resourceId: user.user_id.toString(),
                    metadata: {
                        email: user.email,
                        username: user.username,
                    }
                });
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            const payload = {
                id: user.user_id,
                email: user.email,
                username: user.username,
            };
            //const tokenService = new TokenService();
            const accessToken = this.tokenService.generateAccessToken(payload);
            const refreshToken = this.tokenService.generateRefreshToken(payload);
            logger_1.logger.info({ userId: user.user_id }, 'Access token generated');
            let validateRefreshToken = await refresh_repository_1.RefreshRepository.findOne({
                where: {
                    user_id: user.user_id
                }
            });
            if (validateRefreshToken) {
                validateRefreshToken.user_id = user.user_id;
                validateRefreshToken.user = user;
                validateRefreshToken.revoked_at = null;
                validateRefreshToken.expires_at = new Date(Date.now() + 86400000);
                validateRefreshToken.tokenHash = refreshToken;
                await this.RefreshRepository.save(validateRefreshToken);
            }
            else {
                const newRefreshToken = new refresh_entity_1.Refresh_entity();
                newRefreshToken.user_id = user.user_id;
                newRefreshToken.user = user;
                newRefreshToken.revoked_at = null;
                newRefreshToken.expires_at = new Date(Date.now() + 86400000);
                newRefreshToken.tokenHash = refreshToken;
                await this.RefreshRepository.save(newRefreshToken);
            }
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.LOGIN_SUCCESS,
                userId: user.user_id,
                resource: "AUTH",
                resourceId: user.user_id.toString(),
                metadata: {
                    email: user.email,
                    username: user.username,
                }
            });
            const { password, ...userWithoutPassword } = user;
            const data = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                user: userWithoutPassword
            };
            return (0, responsehelper_1.successResponse)(200, 'User logged in successfully', data);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during user login');
            let errorMessage = "An unknown error occurred during login.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async refreshToken(refreshtoken) {
        try {
            if (!refreshtoken || typeof refreshtoken !== "string") {
                return (0, responsehelper_1.errorResponse)(400, 'Refresh token is required');
            }
            const token = await this.RefreshRepository.findOne({
                where: {
                    tokenHash: refreshtoken,
                    revoked_at: (0, typeorm_1.IsNull)()
                },
                relations: ['user']
            });
            logger_1.logger.debug({ userId: token?.user_id, expiresAt: token?.expires_at }, 'Refresh token found');
            if (!token) {
                return (0, responsehelper_1.errorResponse)(404, 'Refresh token not found');
            }
            // check if token is expired
            if (token.expires_at < new Date()) {
                return (0, responsehelper_1.errorResponse)(401, 'Refresh token expired');
            }
            //check if user exists an is active
            const user = await this.userRepository.findOne({
                where: {
                    user_id: token.user_id,
                    is_deleted: false,
                    isActive: true
                }
            });
            logger_1.logger.info({ user: user }, 'user is active');
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            //generate new access token
            const payload = {
                id: user.user_id,
                email: user.email,
                username: user.username,
            };
            //generate new tokens
            //const tokenService = new TokenService();
            const accessToken = this.tokenService.generateAccessToken(payload);
            const refreshToken = this.tokenService.generateRefreshToken(payload);
            //update the refresh token
            token.tokenHash = refreshToken;
            token.expires_at = new Date(Date.now() + 86400000);
            logger_1.logger.info({ userId: token.user_id }, 'Refresh token rotated successfully');
            await this.RefreshRepository.save(token);
            const data = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                user: user
            };
            return (0, responsehelper_1.successResponse)(200, 'Refresh token generated successfully', data);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during token refresh');
            let errorMessage = "An unknown error occurred during refresh token.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async LogoutUser(userId, refreshToken) {
        try {
            const token = await this.RefreshRepository.findOne({
                where: {
                    user_id: userId,
                    tokenHash: refreshToken,
                    revoked_at: (0, typeorm_1.IsNull)()
                },
            });
            logger_1.logger.debug({ userId: token?.user_id }, 'Token found for logout');
            if (!token) {
                return (0, responsehelper_1.errorResponse)(404, 'Refresh token not found');
            }
            token.revoked_at = new Date();
            logger_1.logger.info({ token: token.revoked_at }, 'logout completed and token was revoked');
            await this.RefreshRepository.save(token);
            (0, auditlogs_1.auditLog)({
                userId: userId,
                action: auditActions_1.AuditAction.LOGOUT,
                resource: "User",
                resourceId: String(userId),
                metadata: {
                    email: token?.user?.email,
                    username: token?.user?.username
                }
            });
            return (0, responsehelper_1.successResponse)(200, 'User logged out successfully', null);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during user logout');
            let errorMessage = "An unknown error occurred during logout.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async DeleteUser(requesterId) {
        try {
            const user = await this.userRepository.findOne({
                where: { user_id: requesterId }
            });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            if (user.is_deleted) {
                return (0, responsehelper_1.errorResponse)(409, 'Account already deleted');
            }
            user.is_deleted = true;
            user.deleted_at = new Date();
            await this.userRepository.save(user);
            const activeTokens = await this.RefreshRepository.find({
                where: {
                    user_id: requesterId,
                    revoked_at: (0, typeorm_1.IsNull)()
                }
            });
            for (const token of activeTokens) {
                token.revoked_at = new Date();
            }
            if (activeTokens.length > 0) {
                await this.RefreshRepository.save(activeTokens);
            }
            logger_1.logger.info({ userId: requesterId, revokedTokenCount: activeTokens.length }, 'User account deleted, sessions revoked');
            return (0, responsehelper_1.successResponse)(200, 'User deleted successfully', null);
        }
        catch (error) {
            logger_1.logger.error({ err: error, requesterId }, 'Error during user deletion');
            let errorMessage = "An unknown error occurred during user deletion.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async UpdateUser(userId, data) {
        try {
            const user = await this.userRepository.findOne({ where: { user_id: userId } });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            if (data.email && data.email !== user.email) {
                const emailTaken = await this.userRepository.findOne({ where: { email: data.email } });
                if (emailTaken) {
                    return (0, responsehelper_1.errorResponse)(409, 'Email already in use');
                }
            }
            if (data.username && data.username !== user.username) {
                const usernameTaken = await this.userRepository.findOne({ where: { username: data.username } });
                if (usernameTaken) {
                    return (0, responsehelper_1.errorResponse)(409, 'Username already in use');
                }
            }
            user.username = data.username ?? user.username;
            user.email = data.email ?? user.email;
            user.firstName = data.firstName ?? user.firstName;
            user.lastName = data.lastName ?? user.lastName;
            user.updated_at = new Date();
            await this.userRepository.save(user);
            const { password, ...userWithoutPassword } = user;
            return (0, responsehelper_1.successResponse)(200, 'User updated successfully', userWithoutPassword);
        }
        catch (error) {
            logger_1.logger.error({ err: error, userId }, 'Error during user update');
            let errorMessage = "An unknown error occurred during user update.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async changePassword(userId, data) {
        try {
            const user = await this.userRepository.findOne({
                where: {
                    user_id: userId
                },
            });
            logger_1.logger.debug({ userId: user?.user_id }, 'User fetched for password change');
            if (!user) {
                return (0, responsehelper_1.errorResponse)(404, 'User not found');
            }
            const isMatch = user.checkIfUnencryptedPasswordIsValid(data.currentPassword);
            logger_1.logger.debug({ isMatch: isMatch }, 'Password match');
            if (!isMatch) {
                return (0, responsehelper_1.errorResponse)(401, 'Invalid current password');
            }
            const isSamePassword = user.checkIfUnencryptedPasswordIsValid(data.newPassword);
            logger_1.logger.debug({ isSamePassword: isSamePassword }, 'Password match');
            if (isSamePassword) {
                return (0, responsehelper_1.errorResponse)(400, 'New password cannot be same as current password');
            }
            user.password = data.newPassword;
            await user.hashPassword();
            logger_1.logger.info({ user: user.user_id }, 'user password is changed');
            await this.userRepository.save(user);
            await this.RefreshRepository.delete({ user_id: userId });
            return (0, responsehelper_1.successResponse)(200, 'User password changed successfully', null);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during user password change');
            let errorMessage = "An unknown error occurred during user password change.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async forgotPassword(data) {
        try {
            const user = await this.userRepository.findOne({
                where: {
                    email: data.email
                },
            });
            logger_1.logger.debug({ user: user?.user_id }, 'User fetched for forgot password');
            if (!user) {
                logger_1.logger.info({ email: data.email }, 'Password reset requested for non-existent email');
                return (0, responsehelper_1.successResponse)(200, 'If that email is registered, a reset link has been sent.', null);
            }
            const { rawToken, hashedToken } = (0, reset_token_1.generateResetToken)();
            // temporal fix would use test email service to test this later
            if (process.env.NODE_ENV !== 'production') {
                logger_1.logger.debug({ rawToken }, 'Reset token (DEV ONLY - do not log in production)');
            }
            const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
            user.resetPasswordTokenHash = hashedToken;
            user.resetPasswordTokenExpiresAt = expiresAt;
            await this.userRepository.save(user);
            const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
            logger_1.logger.info({ resetLink: resetLink }, 'about to send email, reset link');
            await (0, mailer_1.sendPasswordResetEmail)(user.email, resetLink);
            logger_1.logger.info({ user: user.email }, "Password reset email sent successfully");
            logger_1.logger.info({ userId: user.user_id }, "Password reset token generated");
            return (0, responsehelper_1.successResponse)(200, 'If that email is registered, a reset link has been sent.', null);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during forgot password');
            let errorMessage = "An unknown error occurred during forgot password.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
    async resetPassword(data) {
        try {
            const hashedToken = (0, reset_token_1.hashResetToken)(data.token);
            const user = await this.userRepository.findOne({
                where: { resetPasswordTokenHash: hashedToken },
            });
            if (!user) {
                return (0, responsehelper_1.errorResponse)(400, "Invalid or expired reset token");
            }
            if (!user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt < new Date()) {
                return (0, responsehelper_1.errorResponse)(400, "Invalid or expired reset token");
            }
            user.password = data.newPassword;
            user.hashPassword(); // synchronous method, no await needed
            // Invalidate the token immediately — single use
            user.resetPasswordTokenHash = null;
            user.resetPasswordTokenExpiresAt = null;
            await this.userRepository.save(user);
            await this.RefreshRepository.delete({ user_id: user.user_id }); // revoke sessions
            logger_1.logger.info({ userId: user.user_id }, "Password reset successfully");
            return (0, responsehelper_1.successResponse)(200, "Password reset successfully", null);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Error during user password reset');
            let errorMessage = "An unknown error occurred during user password reset.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            return (0, responsehelper_1.errorResponse)(500, 'Internal server error.', errorMessage);
        }
    }
}
exports.Auth_Service = Auth_Service;
