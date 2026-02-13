import { Router, Request, Response } from "express";
import { UserDTO } from "../dto/user_dto";
import { LoginDto } from "../dto/login_dto";
import { Auth_Service } from "../services/auth/auth_service";
import * as express from 'express';
import { STATUS_CODES } from "http";
import { AuthenticatedRequest } from "../types/express/auth-request";
import { authenticateToken } from "../middlewares/jwt.auth";

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
        const user = await this.authService.registerUser(req.body);
        return res.json(user);
    }

    public async loginUser(req: Request, res: Response) {

        const userData = req.body as UserDTO;
        console.log(userData);
        const user = await this.authService.loginUser(userData);
        return res.json(user);


        //return res.json("await this.authService.loginUser(req.body)");

    }

    public async findUserByEmail(req: Request, res: Response) {

        const userData = req.body as UserDTO;
        console.log(userData);

        let user = await this.authService.findUserByEmail(userData);
        return res.json(user);

    }

    public async refreshToken(req: Request, res: Response) {
        const refreshtoken = req.body.refreshToken;

        let refresh = await this.authService.refreshToken(refreshtoken);

        return res.json(refresh);

    }

    public async LogoutUser(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const { refreshToken } = req.body;

        let logout = await this.authService.LogoutUser(Number(userId), refreshToken);
        return res.json(logout);
    }


    public async DeleteUser(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        let logout = await this.authService.DeleteUser(Number(userId));
        return res.json(logout);
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

            this.loginUser.bind(this)

        );
        this.router.post('/user',
            //add middleware here
            this.findUserByEmail.bind(this)
        );
        this.router.post('/refresh',
            //add middleware here
            this.refreshToken.bind(this)
        );
        this.router.post('/logout', authenticateToken,
            //add middleware here
            this.LogoutUser.bind(this)
        );
        this.router.delete('/delete/me', authenticateToken,
            //add middleware here
            this.DeleteUser.bind(this)
        );
        //



    }


}