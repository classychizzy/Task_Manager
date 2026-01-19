"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
//import * as dotenv dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
// console.log(`Hello ${process.env.HELLO}`);
const isProduction = process.env.NODE_ENV === 'prod';
const host = isProduction ? process.env.POSTGRES_HOST_LIVE : process.env.POSTGRES_HOST;
const port = isProduction ? Number(process.env.POSTGRES_PORT_LIVE) : Number(process.env.POSTGRES_PORT);
const username = isProduction ? process.env.POSTGRES_USER_LIVE : process.env.POSTGRES_USER;
const password = isProduction ? process.env.POSTGRES_PASS_LIVE : process.env.POSTGRES_PASS;
const database = isProduction ? process.env.POSTGRES_DB_LIVE : process.env.POSTGRES_DB;
if (!host || !port || !username || !password || !database) {
    console.log({ host, port, username, password, database });
    throw new Error('One or more required environment variables for the database are not set.');
}
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: host,
    port: port,
    username: username,
    password: password,
    database: database,
    synchronize: true,
    logging: false, //["query", "error"] use this when logging errors related to db mismatch
    entities: [
        process.env.DEPLOYMENT_ENV === 'production' ?
            "dist/entities/*{.js,.ts}"
            : "src/entities/*{.js,.ts}",
    ],
    migrations: ["src/migration/*{.ts}"],
});
exports.default = AppDataSource;
