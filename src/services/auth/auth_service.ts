import { UserDTO } from "../../dto/user_dto";
import { UserPayload } from "../../types/userpayload";
import { UserRepository } from "../../repositories/user_repository";
//import { STATUS_CODES } from "http";
//import { IsEmail } from 'class-validator';
import { Jwt } from "jsonwebtoken";
import { validateEmail } from '../../validator/user_validation';
import { hashPassword, comparePassword } from '../../utils/hashPassword';
import { User_entity } from "../../entities/user_entity"; ``
import { TokenService } from "./token_service";
import { RefreshRepository } from '../../repositories/refresh_repository';
import { Refresh_entity } from "../../entities/refresh_entity";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { IsNull } from "typeorm";
dotenv.config();




//handles all user and authentication issues

//create a service class where you will write your queries and logics
export class Auth_Service {
    //set up user repository here
    private userRepository: typeof UserRepository;
    private RefreshRepository: typeof RefreshRepository;
    private readonly tokenService: TokenService;


    constructor() {
        this.userRepository = UserRepository;
        this.RefreshRepository = RefreshRepository;
        this.tokenService = new TokenService();
    }

    async registerUser(userData: UserDTO) {
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
            }
            return response;
        }

        // Here you would typically hash the password before saving
        // const hashedPassword = await hashPassword(userData.password);
        // userData.password = hashedPassword;

        // For simplicity, we'll save it as is for now.
        try {

            console.log(userData.email, typeof userData.email);

            let IsEmailValid = validateEmail(userData.email);
            console.log(IsEmailValid);


            if (!IsEmailValid) {

                let response = {
                    status_code: 400,
                    status: 'failed',
                    message: 'Enter a valid email address',
                    data: null
                }

                return response;
            }

            //create an instance of user entity
            const newUser = new User_entity();

            //assign properties to the user entity instance
            newUser.firstName = userData.firstName;
            newUser.lastName = userData.lastName;
            newUser.username = userData.username;
            newUser.email = userData.email;
            newUser.password = userData.password;
            newUser.hashPassword();

            //newUser.password = await hashPassword( userData.password); // In a real app, hash this!

            // await AppDataSource.manager.save(newUser);

            await this.userRepository.save(newUser);
            // return newUser;

            const { password, ...userWithoutPassword } = newUser;

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User registered successfully',
                data: userWithoutPassword
            }

            return response;

        } catch (error) {

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
            }

            return response;

        }
    }

    async findUserByEmail(userData: UserDTO) {

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

            const user = await this.userRepository.findOne(
                {
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
                }

            );


            if (!user) {

                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }

                return response;

            }

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User retrieved successfully',
                data: user
            }

            return response;

            // return await AppDataSource.manager.findOne(User_entity, { where: { email: user.email } });

        } catch (error) {

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
            }

            return response;


        }
    }

    async loginUser(userData: UserDTO) {
        try {
            // const isemailValid = validateEmail(userData.email);


            const user = await this.userRepository.findOne({
                where: {
                    email: userData.email,
                }
            });

            if (!user) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }
                return response;
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
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }
                return response;
            }

            const payload: UserPayload = {
                id: user.user_id,
                email: user.email,
                username: user.username,
            }

            const tokenService = new TokenService();
            const accessToken = tokenService.generateAccessToken(payload);
            const refreshToken = tokenService.generateRefreshToken(payload);

            let validateRefreshToken = await RefreshRepository.findOne({
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
            } else {

                const newRefreshToken = new Refresh_entity();
                newRefreshToken.user_id = user.user_id;
                newRefreshToken.user = user;
                newRefreshToken.revoked_at = null;
                newRefreshToken.expires_at = new Date(Date.now() + 86400000);
                newRefreshToken.tokenHash = refreshToken;
                await this.RefreshRepository.save(newRefreshToken);

            }

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User logged in successfully',
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: user
                }
            }

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
            }

            return response;
        }



    }

    async refreshToken(refreshtoken: string) {

        try {
            if (!refreshtoken || typeof refreshtoken !== "string") {
                let response = {
                    status_code: 400,
                    status: 'failed',
                    message: 'Refresh token is required',
                    data: null
                }
                return response;
            }

            const token = await this.RefreshRepository.findOne({
                where: {
                    tokenHash: refreshtoken,
                    revoked_at: IsNull()
                },
                relations: ['user']
            });

            if (!token) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Refresh token not found',
                    data: null
                }
                return response;
            }
            // check if token is expired
            if (token.expires_at < new Date()) {
                let response = {
                    status_code: 401,
                    status: 'failed',
                    message: 'Refresh token expired',
                    data: null
                }
                return response;
            }

            //check if user exists an is active
            const user = await this.userRepository.findOne({
                where: {
                    user_id: token.user_id,
                    is_deleted: false,
                    isActive: true
                }
            });

            if (!user) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }
                return response;
            }

            //generate new access token
            const payload: UserPayload = {
                id: user.user_id,
                email: user.email,
                username: user.username,
            }

            //generate new tokens
            const tokenService = new TokenService();
            const accessToken = tokenService.generateAccessToken(payload);
            const refreshToken = tokenService.generateRefreshToken(payload);
            //update the refresh token
            token.tokenHash = refreshToken;
            token.expires_at = new Date(Date.now() + 86400000);
            await this.RefreshRepository.save(token);

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Refresh token generated successfully',
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    user: user
                }
            }

            return response;






        }
        catch (error) {
            let errorMessage = "An unknown error occurred during refresh token.";
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
            }

            return response;
        }
    }

    async LogoutUser(userId: number, refreshToken: string) {
        try {
            const token = await this.RefreshRepository.findOne({
                where: {
                    user_id: userId,
                    tokenHash: refreshToken,
                    revoked_at: IsNull()
                },
            });

            if (!token) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Refresh token not found',
                    data: null
                }
                return response;
            }

            token.revoked_at = new Date();
            await this.RefreshRepository.save(token);

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User logged out successfully',
                data: null
            }

            return response;

        } catch (error) {
            let errorMessage = "An unknown error occurred during logout.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            }

            return response;
        }

    }

    async DeleteUser(userId: number) {
        try {
            const user = await this.userRepository.findOne({
                where: {
                    user_id: userId
                },
            });

            const token = await this.RefreshRepository.findOne({
                where: {
                    user_id: userId,
                    revoked_at: IsNull()
                },
            });

            if (!user) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'User not found',
                    data: null
                }
                return response;
            }

            user.is_deleted = true;
            await this.userRepository.save(user);

            if (token) {
                token.revoked_at = new Date();
                await this.RefreshRepository.save(token);
            }

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User deleted successfully',
                data: null
            }

            return response;

        } catch (error) {
            let errorMessage = "An unknown error occurred during user deletion.";
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            }

            return response;
        }
    }





}
