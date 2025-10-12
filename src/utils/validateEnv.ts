import {cleanEnv, str, num} from 'envalid';

export function validateEnv() {
    cleanEnv(process.env, {
        PORT: num({ default: 8000 }),
        POSTGRES_HOST: str(),
        POSTGRES_PORT: num({ default: 5432 }),
        POSTGRES_USER: str(),
        POSTGRES_PASS: str(),
        POSTGRES_DB: str(),
    });
};