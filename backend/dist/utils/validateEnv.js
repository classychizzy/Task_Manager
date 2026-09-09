"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
const envalid_1 = require("envalid");
function validateEnv() {
    (0, envalid_1.cleanEnv)(process.env, {
        PORT: (0, envalid_1.num)({ default: 9000 }),
        NODE_ENV: (0, envalid_1.str)({ default: "development" }),
        POSTGRES_HOST: (0, envalid_1.str)(),
        POSTGRES_PORT: (0, envalid_1.num)({ default: 5432 }),
        POSTGRES_USER: (0, envalid_1.str)(),
        POSTGRES_PASS: (0, envalid_1.str)(),
        POSTGRES_DB: (0, envalid_1.str)(),
        // App features
        RUN_CRON: (0, envalid_1.bool)({ default: false }),
    });
}
;
