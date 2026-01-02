import { UserDTO } from "../dto/user_dto";

import AppDataSource from "../ormconfig";
import { UserRepository } from "../repositories/user_repository";
import { Response } from 'express';
import { STATUS_CODES } from "http";
//import { IsEmail } from 'class-validator';
import { validateEmail } from "../validator/user_validation";
import { hashPassword } from '../utils/hashPassword';
import { User_entity } from "../entities/user_entity";

//handles all user and authentication issues

//create a service class where you will write your queries and logics
export class Auth_Service {
    //set up user repository here
    private userRepository: typeof UserRepository;

    constructor() {
        this.userRepository = UserRepository;
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
        const hashedPassword = await hashPassword(userData.password);
        userData.password = hashedPassword;

        // For simplicity, we'll save it as is for now.
        try {

            console.log(userData.email, typeof userData.email);

            let IsEmailValid = validateEmail(userData.email);
            console.log(IsEmailValid);


            if (!IsEmailValid) {

                let response = {
                    status_code: 400,
                    status: 'failed',
                    message: 'Invalid email address',
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
            newUser.password = userData.password; // In a real app, hash this!

            // await AppDataSource.manager.save(newUser);

            await this.userRepository.save(newUser);
            // return newUser;

            let response = {
                status_code: 200,
                status: 'success',
                message: 'User registered successfully',
                data: newUser
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

            if (!userData?.email && !userData?.password) {}
            const user = await this.userRepository.findOne({
                where: {
                    email: userData.email,
                    password: userData.password,
                },
                relations: ["projects",
                        "projects.tasks",
                        "tasks",
                        "comments",
                        "task_assignments"
                    ],
                    order: {
                        user_id: "DESC"
                    }
            });

            
    }
    
}