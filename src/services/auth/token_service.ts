import jwt, { SignOptions } from 'jsonwebtoken';
import { UserPayload } from '../../types/express';
//import { User_entity } from '../../entities/user_entity';
import { str } from 'envalid';


export class TokenService {
    private readonly AccessSecret: string;
    private readonly RefreshSecret: string;



    constructor() {
        if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
            throw new Error('JWT_SECRET environment variable is not set.');
        }
        this.AccessSecret = process.env.JWT_ACCESS_SECRET;
        this.RefreshSecret = process.env.JWT_REFRESH_SECRET as string;

        // this.expiresIn = process.env.JWT_EXPIRES_IN as string;

    }

    generateAccessToken(payload: UserPayload): string {
        /**  const payload: UserPayload = {
             id: user.user_id,
             email: user.email,
             username: user.username,
             // Add other relevant user data to the payload
         };*/


        const options: SignOptions = {
            expiresIn: 600,
            algorithm: 'HS256'
        };

        const signIn = jwt.sign(
            payload,
            this.AccessSecret,
            options
        );

        return signIn;

    }




    generateRefreshToken(payload: UserPayload): string {
        /* const payload: UserPayload = {
             id: user.user_id,
             email: user.email,
             username: user.username
         }; */


        const options: SignOptions = {
            expiresIn: 86400,
            algorithm: 'HS256'
        };

        return jwt.sign(payload, this.RefreshSecret, options);
    }


    verifyAccessToken(token: string): jwt.JwtPayload | null {
        try {
            return jwt.verify(token, this.AccessSecret) as jwt.JwtPayload;
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }

    verifyRefreshToken(token: string): jwt.JwtPayload | null {
        try {
            return jwt.verify(token, this.RefreshSecret) as jwt.JwtPayload;
        } catch (error) {
            console.error('Token verification failed:', error);
            return null;
        }
    }
}
