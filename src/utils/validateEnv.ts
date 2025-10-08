import {cleanEnv, str, num} from 'envalid';

export function validateEnv() {
    cleanEnv(process.env, {
        PORT: num({ default: 8080 }),
        DB_HOST: str(),
        DB_PORT: num({ default: 5432 }),
        DB_USERNAME: str(),
        DB_PASSWORD: str(),
        DB_NAME: str(),
    });
};