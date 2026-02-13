import { DataSource } from "typeorm";
import * as dotenv from 'dotenv';

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

const AppDataSource = new DataSource({
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




export default AppDataSource;