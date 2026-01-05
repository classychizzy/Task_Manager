import jwt, { JwtPayload } from "jsonwebtoken"
import {request, response, NextFunction} from "express"
import { UserPayload } from '../types/express/index';





export function authenticateToken(req:Request, next: NextFunction){
    const authheader = req.headers['authorization']
    const token = authheader && authheader.split(' ')[1]
    if (!token ) {
        let response = {
            status_code: 401,
            status: 'failed',
            message: 'missing token',
            data: null
        
        }
        return response
    
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) {

            let response = {
                status_code: 403,
                status: 'failed',
                message: 'invalid or expired token',
                data: null
            }

            return response;
    
        }else{

            console.log(decoded)
            const user = decoded as UserPayload

            return user;

        }

        next();

    })
}