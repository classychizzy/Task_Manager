import { Request } from "express";
import { UserPayload } from "../userpayload";

export interface AuthenticatedRequest  extends Request {
  user?: UserPayload;
}
