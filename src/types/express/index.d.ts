import jwt from "jsonwebtoken"
import express from "express"




// Define the structure of your user object
 export interface UserPayload {
  id: string;
  email: string;
  username: string;
  // Add other user properties as needed
}

declare global {
  namespace Express {
    interface Request  {
      user?: UserPayload;
    }
}
}

export {}
