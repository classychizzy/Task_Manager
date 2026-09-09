"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestUsers = exports.generateTestUser = exports.TestDbHelper = void 0;
const ormconfig_1 = __importDefault(require("../../ormconfig"));
const crypto_1 = require("crypto");
/**
 * Test database utilities
 */
class TestDbHelper {
    /**
     * Clear all data from the database
     */
    static async clearDatabase() {
        const entities = ormconfig_1.default.entityMetadatas;
        for (const entity of entities) {
            const repository = ormconfig_1.default.getRepository(entity.name);
            await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
        }
    }
    /**
     * Clear specific tables
     */
    static async clearTables(tableNames) {
        for (const tableName of tableNames) {
            await ormconfig_1.default.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
        }
    }
    /**
     * Clear user-related data
     */
    static async clearUserData() {
        await ormconfig_1.default.query(`TRUNCATE TABLE "refresh_token" RESTART IDENTITY CASCADE;`);
        await ormconfig_1.default.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);
    }
}
exports.TestDbHelper = TestDbHelper;
/**
 * Generate test user data
 */
const generateTestUser = (overrides) => ({
    // user_id: uuidv4(), primary generated column
    firstName: 'Test',
    lastName: 'User',
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    ...overrides,
});
exports.generateTestUser = generateTestUser;
/**
 * Generate multiple unique test users
 */
const generateTestUsers = (count) => {
    return Array.from({ length: count }, (_, i) => ({
        firstName: `Test${i}`,
        lastName: `User${i}`,
        username: `testuser${i}_${Date.now()}`,
        email: `test${i}_${Date.now()}@example.com`,
        password: 'TestPassword123!',
    }));
};
exports.generateTestUsers = generateTestUsers;
function uuidv4() {
    return (0, crypto_1.randomUUID)();
}
