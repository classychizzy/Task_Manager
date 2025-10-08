import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';
dotenv.config();
 
const {port, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_HOST_LIVE, DB_PORT_LIVE, DB_USER_LIVE, DB_PASS_LIVE, DB_NAME_LIVE} = process.env; 

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.NODE_ENV === "prod" ? DB_HOST : DB_HOST_LIVE,
  port: Number(process.env.DB_PORT) === "prod" ? Number(DB_PORT) : Number(DB_PORT_LIVE),
  username: process.env.NODE_ENV === "prod" ? DB_USER : DB_USER_LIVE,
  password: process.env.NODE_ENV === "prod" ? DB_PASS : DB_PASS_LIVE,
  database: process.env.DB_NAME === "prod" ? DB_NAME : DB_NAME_LIVE,
  synchronize: true,
  logging: false,
  entities: [
    
    process.env.DEPLOYMENT_ENV === 'production'
    ?"build/entity/*{.js,.ts}"
    :"src/entity/*{.js,.ts}",
  ],
  migrations: ["src/migration/*{.ts}"],

});

export default AppDataSource;