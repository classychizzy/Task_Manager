import { Router, Request, Response } from "express";
import { UserDTO } from "../dto/user_dto";
import { Auth_Service } from "../services/auth/auth_service";
import { AuthenticatedRequest } from "../types/express/auth-request";
import { authenticateToken } from "../middlewares/jwt.auth";
import { logger } from "../lib/logger";

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
        try {
            const response = await this.authService.registerUser(req.body);
            if (response.status_code === 200) {
                logger.info({ userId: response.data?.user_id, email: response.data?.email }, 'User registered successfully');
            } else {
                logger.warn({ status_code: response.status_code, message: response.message }, 'User registration failed');
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in registerUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async loginUser(req: Request, res: Response) {
        try {
            const userData = req.body as UserDTO;
            logger.debug({ email: userData.email }, 'loginUser called');
            const user = await this.authService.loginUser(userData);
            return res.json(user);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in loginUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async findUserByEmail(req: Request, res: Response) {
        try {
            const userData = req.body as UserDTO;
            logger.debug({ email: userData.email }, 'findUserByEmail called');
            let user = await this.authService.findUserByEmail(userData);
            return res.json(user);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in findUserByEmail');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async refreshToken(req: Request, res: Response) {
        try {
            const refreshtoken = req.body.refreshToken;
            logger.info('refreshToken endpoint called');
            let refresh = await this.authService.refreshToken(refreshtoken);
            return res.json(refresh);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in refreshToken');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async LogoutUser(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const { refreshToken } = req.body;
            logger.info({ userId }, 'LogoutUser called');
            let logout = await this.authService.LogoutUser(Number(userId), refreshToken);
            return res.json(logout);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in LogoutUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }


    public async DeleteUser(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            logger.info({ userId }, 'DeleteUser called');
            let Delete = await this.authService.DeleteUser(Number(userId));
            return res.json(Delete);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in DeleteUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
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