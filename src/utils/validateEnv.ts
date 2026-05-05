import { cleanEnv, str, num, bool } from 'envalid';

export function validateEnv() {
    cleanEnv(process.env, {
        PORT: num({ default: 9000 }),
        NODE_ENV: str({ default: "development" }),
        POSTGRES_HOST: str(),
        POSTGRES_PORT: num({ default: 5432 }),
        POSTGRES_USER: str(),
        POSTGRES_PASS: str(),

        POSTGRES_DB: str(),

        // App features
        RUN_CRON: bool({ default: false }),
    });
};