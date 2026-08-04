import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { logger } from '../lib/logger';
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express/auth-request';

// 1. Global baseline — applies to the whole app, generous, just stops raw flooding
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10, // bypass for test environment test
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many requests, try again later.",

  }
});



// old way- not suited for specific endpoints
// export const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 5, // very strict
//     handler: (req: AuthenticatedRequest, res: Response) => {
//         logger.info("Too many login attempts. Try again later.");

//     },
//     message: {
//         status: "error",
//         message: "Too many login attempts. Try again later.",
//     },
// });


// 2. Strict — credential-guessing endpoints, tight, keyed by email where possible
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  keyGenerator: (req) => req.body.email || ipKeyGenerator(req.ip || 'unknown'),
});


// 3. Moderate — token-based, higher entropy, called more frequently by legit clients
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 30, // more generous, since refresh happens automatically and often
});
