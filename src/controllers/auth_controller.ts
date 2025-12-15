import { Router, Request, Response } from "express";
import { UserDTO } from "../dto/user_dto";
import { LoginDto } from "../dto/login_dto";
import { Auth_Service } from "../services/auth_service";
import * as express from 'express';
import { STATUS_CODES } from "http";

export class Auth_Controller {
    //set up user service here
    private authService: Auth_Service;
    //set up auth routes
    public router: Router;

    constructor() {
        this.authService = new Auth_Service();
        this.router = Router();
        this.initializeRoutes();
    }

    public async registerUser(req: Request, res: Response) {
        console.log("we test");
        //access request body data
        try {
            //write payload here
               const user = await this.authService.registerUser(req.body);
               console.log(req.body);
               return res.status(200).json({data: user,
                message: "User registered successfully",
                status: "success",
                status_code: 200
               });
             
        }catch (error) {
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
            }
            return res.json(response);
        }
    }

    public async loginUser(req: Request, res: Response) {
        
    

    }

    public async findUserByEmail(req: Request, res: Response) {
        let user = await this.authService.findUserByEmail(req.body);
        try {
            if (user) {
                let response = {
                    status_code: 200,
                    status: 'success',
                    message: 'User found successfully.',
                    data: user
                }
                return res.json(response);
            
            }
            
            
        }
        catch (error) {
            let errorMessage = "an unknown error occured"

            if (error instanceof Error) {
                return res.status(400).json({ errorMessage: error.message });
            }
            let response = {  
                status_code: 500,
                messsage: 'Internal server error.',
                status: 'failed',
                errorMessage: errorMessage,
                data: null
            }
            return res.json(response);

        }

        
    }


    


    private initializeRoutes() {
        this.router.get('/welcome', (req: Request, res: Response) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register',
            //add middleware here
            this.registerUser.bind(this)
        );
        this.router.post('/login',
            //add middleware here
            this.loginUser.bind(this)
        );
        this.router.get('/user',
            //add middleware here
             this.authService.findUserByEmail.bind(this)
        );
        // this.router.get('/find/:id', 
        //     //add middleware here
        //     this.findUserByEmail.bind(this)
        // );

    }

}