import jwt from 'jsonwebtoken';
import { UserDTO } from '../dto/user_dto';
import UserPayload from '../types/express'
import dotenv from 'dotenv';
dotenv.config();

const secret = process.env.JWT_SECRET ;


if (!secret) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export const generateToken = (user: UserDTO) => {
    //const Payload = {username: user.username};
    return jwt.sign(UserPayload, secret, {expiresIn: '1h'})
}
    
