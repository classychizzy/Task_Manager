import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });
// console.log(`Hello ${process.env.HELLO}`);
import { DataSource } from "typeorm";




const isProduction = process.env.NODE_ENV === 'production';
const host = process.env.POSTGRES_HOST;
const port = Number(process.env.POSTGRES_PORT);
const username = process.env.POSTGRES_USER;
const password = process.env.POSTGRES_PASS;
const database = process.env.POSTGRES_DB;

// const host = isProduction ? process.env.POSTGRES_HOST_LIVE : process.env.POSTGRES_HOST;
// const port = isProduction ? Number(process.env.POSTGRES_PORT_LIVE) : Number(process.env.POSTGRES_PORT);
// const username = isProduction ? process.env.POSTGRES_USER_LIVE : process.env.POSTGRES_USER;
// const password = isProduction ? process.env.POSTGRES_PASS_LIVE : process.env.POSTGRES_PASS;
// const database = isProduction ? process.env.POSTGRES_DB_LIVE : process.env.POSTGRES_DB;

console.log('NODE_ENV:', JSON.stringify(process.env.NODE_ENV));
console.log('KEYS:', Object.keys(process.env).filter(k => k.toUpperCase().includes('POSTGRES')));
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
  synchronize: true,//process.env.NODE_ENV === 'test',
  logging: false, //["query", "error"] use this when logging errors related to db mismatch
  entities: [
    __dirname + "/entities/*{.js,.ts}",
  ],
  migrations: ["src/migration/*{.ts}"],
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});





export default AppDataSource;