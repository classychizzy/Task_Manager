"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)();
const authheader = "Bearer token";
// This is what I suspect the user had:
// logger.debug('Raw Authorization Header:', JSON.stringify(authheader));
// This is what I see in Step 76:
logger.debug('Raw Authorization Header:' + JSON.stringify(authheader));
// Testing the COMMA version
// @ts-ignore
logger.debug('Raw Authorization Header:', JSON.stringify(authheader));
