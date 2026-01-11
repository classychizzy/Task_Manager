"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth_Service = void 0;
const user_repository_1 = require("../../repositories/user_repository");
//import { IsEmail } from 'class-validator';
const user_validation_1 = require("../../validator/user_validation");
const hashPassword_1 = require("../../utils/hashPassword");
const user_entity_1 = require("../../entities/user_entity");
``;
const token_service_1 = require("./token_service");
const refresh_repository_1 = require("../../repositories/refresh_repository");
//handles all user and authentication issues
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
            let response = {
                status_code: 400,
                status: 'failed',
                message: 'User already exists',
                data: null
            };
            return response;
        }
        // Here you would typically hash the password before saving
        const hashedPassword = await (0, hashPassword_1.hashPassword)(userData.password);
        userData.password = hashedPassword;
        // For simplicity, we'll save it as is for now.
        try {
            console.log(userData.email, typeof userData.email);
            let IsEmailValid = (0, user_validation_1.validateEmail)(userData.email);
            console.log(IsEmailValid);
            if (!IsEmailValid) {
                let response = {
                    status_code: 400,
                    status: 'failed',
                    message: 'Invalid email address',
                    data: null
                };
                return response;
            }
            //create an instance of user entity
            const newUser = new user_entity_1.User_entity();
            //assign properties to the user entity instance
            newUser.firstName = userData.firstName;
            newUser.lastName = userData.lastName;
            newUser.username = userData.username;
            newUser.email = userData.email;
            newUser.password = userData.password; // In a real app, hash this!
            // await AppDataSource.manager.save(newUser);
            await this.userRepository.save(newUser);
            // return newUser;
            let response = {
                status_code: 200,
                status: 'success',
                message: 'User registered successfully',
                data: newUser
            };
            return response;
        }
        catch (error) {
            let errorMessage = "An unknown error occurred during registration.";
            if (error instanceof Error) {
                // Now TypeScript knows `error` has a `message` property
                errorMessage = error.message;
            }
            let response = {
                // It's better to use a proper error status code
                status_code: 500,
                status: 'failed',
                message: 'User registration failed. Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return response;
        }
    }
    async findUserByEmail(userData) {
        console.log(userData.email);
        try {
            if (!userData?.email) {
                return {
                    status_code: 400,
                    status: 'failed',
                    message: 'Email is required',
                    data: null,
                };
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
            if (!user) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                };
                return response;
            }
            let response = {
                status_code: 200,
                status: 'success',
                message: 'User retrieved successfully',
                data: user
            };
            return response;
            // return await AppDataSource.manager.findOne(User_entity, { where: { email: user.email } });
        }
        catch (error) {
            let errorMessage = "An unknown error occurred during registration.";
            if (error instanceof Error) {
                // Now TypeScript knows `error` has a `message` property
                errorMessage = error.message;
            }
            let response = {
                // It's better to use a proper error status code
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return response;
        }
    }
    async loginUser(userData) {
        try {
            const isemailValid = (0, user_validation_1.validateEmail)(userData.email);
            //
            const user = await this.userRepository.findOne({
                where: {
                    email: userData.email,
                    username: userData.username
                }
            });
            const ispasswordValid = await (0, hashPassword_1.comparePassword)(userData.password, user.password);
            if (!user || !ispasswordValid) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                };
                return response;
            }
            const payload = {
                id: user.user_id,
                email: user.email,
                username: user.username,
            };
            const tokenService = new token_service_1.TokenService();
            const accessToken = tokenService.generateAccessToken(payload);
            const refreshToken = tokenService.generateRefreshToken(payload);
            // save the token
            const hashtoken = await (0, hashPassword_1.hashPassword)(refreshToken);
            const token = await this.RefreshRepository.save({
                user_id: user.user_id,
                token: hashtoken
            });
            let response = {
                status_code: 200,
                status: 'success',
                message: 'User logged in successfully',
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: user
                }
            };
            return response;
        }
        catch (error) {
            let errorMessage = "An unknown error occurred during login.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            let response = {
                // It's better to use a proper error status code
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return response;
        }
    }
}
exports.Auth_Service = Auth_Service;
