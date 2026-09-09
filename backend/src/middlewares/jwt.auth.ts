import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { UserPayload } from "../types/userpayload"
import { AuthenticatedRequest } from "../types/express/auth-request"
import { logger } from "../lib/logger"




export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authheader = req.headers['authorization']

    // // Debug logging
    // console.log('Raw Authorization Header:', JSON.stringify(authheader));
    logger.debug('Raw Authorization Header:' + JSON.stringify(authheader));
    logger.debug('Authorization Header Length:' + authheader?.length);

    const token = authheader && authheader.split(' ')[1]

    logger.debug('Extracted Token');

    if (!token) {
      let response = {
        status_code: 401,
        success: false,
        message: 'missing token',
        data: null

      }
      return res.status(401).json(response);

    }

    jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
      if (err) {
        logger.error('Invalid or expired token:');
        return res.status(403).json({
          status_code: 403,
          success: false,
          message: "Invalid or expired token",
          data: null,
        });
      }

      req.user = decoded as UserPayload; // ← THIS is what makes runtime work
      next();
    })
  } catch (error) {
    logger.error('Error authenticating token:');
    return res.status(500).json({
      status_code: 500,
      success: false,
      message: "Internal server error",
      data: null,
    });
  }

}