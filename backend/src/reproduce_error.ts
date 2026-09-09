import pino from 'pino';

const logger = pino();

const authheader = "Bearer token";

// This is what I suspect the user had:
// logger.debug('Raw Authorization Header:', JSON.stringify(authheader));

// This is what I see in Step 76:
logger.debug('Raw Authorization Header:' + JSON.stringify(authheader));

// Testing the COMMA version
// @ts-ignore
logger.debug('Raw Authorization Header:', JSON.stringify(authheader));
