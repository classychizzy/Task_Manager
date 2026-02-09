import jwt from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"
import { UserPayload } from "../types/userpayload"
import { AuthenticatedRequest } from "../types/express/auth-request"




export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authheader = req.headers['authorization']

  // // Debug logging
  // console.log('Raw Authorization Header:', JSON.stringify(authheader));
  // console.log('Authorization Header Length:', authheader?.length);

  const token = authheader && authheader.split(' ')[1]

  // console.log('Extracted Token:', JSON.stringify(token));

  if (!token) {
    let response = {
      status_code: 401,
      status: 'failed',
      message: 'missing token',
      data: null

    }
    return res.status(401).json(response);

  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(403).json({
        status: "failed",
        message: "Invalid or expired token",
        data: null,
      });
    }

    req.user = decoded as UserPayload; // ← THIS is what makes runtime work
    next();
  })


}