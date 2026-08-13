import { Router, Request, Response, json } from "express";
import { UserDTO } from "../dto/user_dto";
import { validateDto } from "../middlewares/validateDto";
import { Auth_Service } from "../services/auth/auth_service";
import { AuthenticatedRequest } from "../types/express/auth-request";
import { authenticateToken } from "../middlewares/jwt.auth";
import { logger } from "../lib/logger";
import { strictAuthLimiter, refreshLimiter } from '../middlewares/ratelimiter'
import { LoginDTO } from "../dto/login_dto";
import { UpdateUserDTO } from "../dto/update_user_dto";
import { ChangePasswordDTO } from "../dto/changePassword_Dto";
import { forgotPasswordDto } from "../dto/forgot_password_dto";
import { ResetPasswordDto } from "../dto/resetPassword_dto";
import { findbyEmailDTO } from "../dto/findbyEmail_dto";
import { RefreshTokenDTO } from "../dto/refresh_dto";


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
            const result = await this.authService.registerUser(req.body);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in registerUser');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }

    public async loginUser(req: Request, res: Response) {
        try {
            const userData = req.body as LoginDTO;
            logger.debug({ email: userData.email }, 'loginUser called');
            const result = await this.authService.loginUser(userData);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in loginUser');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }

    public async findUserByEmail(req: Request, res: Response) {
        try {
            const userData = req.body as findbyEmailDTO;
            logger.debug({ email: userData.email }, 'findUserByEmail called');
            let result = await this.authService.findUserByEmail(userData);
            return res.status(200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in findUserByEmail');
            return res.status(500).json({ status_code: 500, status: 'failed', message: 'Internal server error' });
        }
    }

    public async refreshToken(req: Request, res: Response) {
        try {
            const refreshtoken = req.body.RefreshTokenDTO;
            logger.info('refreshToken endpoint called');
            let refresh = await this.authService.refreshToken(refreshtoken);
            return res.status(refresh.status_code || 200).json(refresh);
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
            return res.status(logout.status_code || 200).json(logout);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in LogoutUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }


    public async DeleteUser(req: AuthenticatedRequest, res: Response) {
        try {
            const requesterId = req.user!.id;
            logger.info({ requesterId }, 'DeleteUser called');
            let Delete = await this.authService.DeleteUser(Number(requesterId));
            return res.status(Delete.status_code || 200).json(Delete);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in DeleteUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async updateUser(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            logger.info({ userId }, 'updateUser called');
            let update = await this.authService.UpdateUser(Number(userId), req.body);
            return res.status(update.status_code || 200).json(update);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in updateUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async changePassword(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const changePasswordDto = req.body as ChangePasswordDTO;
            logger.info({ userId }, 'changePassword called');
            let result = await this.authService.changePassword(Number(userId), changePasswordDto);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in changePassword');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async forgotPassword(req: Request, res: Response) {
        try {
            const userData = req.body as forgotPasswordDto;
            logger.debug({ email: userData.email }, 'forgotPassword called');
            const result = await this.authService.forgotPassword(userData);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in forgotPassword');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }

    public async resetPassword(req: Request, res: Response) {
        try {
            const userData = req.body as ResetPasswordDto;
            logger.debug({ tokenProvided: !!userData.token }, 'resetPassword called');
            const result = await this.authService.resetPassword(userData);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in resetPassword');
            return res.status(500).json({ status_code: 500, success: false, message: 'Internal server error', data: null });
        }
    }





    private initializeRoutes() {
        this.router.get('/welcome', (req: Request, res: Response) => {
            res.status(200).send("Welcome to Task Manager");
        });
        this.router.post('/register', strictAuthLimiter,
            validateDto(UserDTO),
            this.registerUser.bind(this)
        );
        this.router.post('/login', strictAuthLimiter, validateDto(LoginDTO),
            this.loginUser.bind(this)

        );
        this.router.post('/user',
            validateDto(findbyEmailDTO),
            this.findUserByEmail.bind(this)
        );
        this.router.post('/refresh', refreshLimiter,
            validateDto(RefreshTokenDTO),
            this.refreshToken.bind(this)
        );
        this.router.post('/logout', authenticateToken,
            this.LogoutUser.bind(this)
        );
        this.router.delete('/delete/me', authenticateToken,
            this.DeleteUser.bind(this)
        );
        this.router.put('/update/me', authenticateToken,
            validateDto(UpdateUserDTO),
            this.updateUser.bind(this)
        );
        this.router.put('/change/password', authenticateToken, strictAuthLimiter,
            validateDto(ChangePasswordDTO),
            this.changePassword.bind(this)
        );
        this.router.post("/forgot-password", strictAuthLimiter, validateDto(forgotPasswordDto),
            this.forgotPassword.bind(this));
        this.router.post("/reset-password", strictAuthLimiter, validateDto(ResetPasswordDto),
            this.resetPassword.bind(this));



    }


}