import { UserPayload } from "../userpayload";




declare module "express-serve-static-core" {
  interface Request {
    user?: UserPayload;
  }
}

export {};