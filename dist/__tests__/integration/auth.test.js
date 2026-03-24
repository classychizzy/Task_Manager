"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const ormconfig_1 = __importDefault(require("../../ormconfig"));
const db_helper_1 = require("../helpers/db.helper");
describe('Auth Integration Tests', () => {
    let app;
    let server;
    beforeAll(async () => {
        // Create app instance
        app = new app_1.default();
        server = app.app;
        // Initialize database if not already done by setup.ts
        if (!ormconfig_1.default.isInitialized) {
            await app.initializeDatabase();
        }
    });
    beforeEach(async () => {
        // Clear user data before each test
        await db_helper_1.TestDbHelper.clearUserData();
    });
    afterAll(async () => {
        // Cleanup is handled by setup.ts
    });
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user successfully', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('User registered successfully');
            expect(response.body.data).toHaveProperty('user_id');
            expect(response.body.data.email).toBe(testUser.email);
            expect(response.body.data).not.toHaveProperty('password'); // Password should not be in response
        });
        it('should reject registration with invalid email', async () => {
            const testUser = (0, db_helper_1.generateTestUser)({ email: 'invalid-email' });
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('Enter a valid email address');
        });
        it('should reject duplicate user registration', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // First registration
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // Attempt duplicate registration
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('User already exists');
        });
        it('should reject registration with missing required fields', async () => {
            const incompleteUser = {
                email: 'test@example.com',
                // Missing firstName, lastName, username, password
            };
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(incompleteUser)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(500);
            expect(response.body.status).toBe('failed');
        });
    });
    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // Register user first
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // Login
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('User logged in successfully');
            expect(response.body.data).toHaveProperty('accessToken');
            expect(response.body.data).toHaveProperty('refreshToken');
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user.email).toBe(testUser.email);
        });
        it('should reject login with incorrect password', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // Register user first
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // Attempt login with wrong password
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: 'WrongPassword123!',
            })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('User not found');
        });
        it('should reject login with non-existent email', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'SomePassword123!',
            })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('User not found');
        });
        it('should create refresh token on successful login', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // Register user
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // Login
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            const { refreshToken } = loginResponse.body.data;
            expect(refreshToken).toBeDefined();
            expect(typeof refreshToken).toBe('string');
            expect(refreshToken.length).toBeGreaterThan(0);
        });
    });
    describe('POST /api/v1/auth/user', () => {
        it('should find user by email', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // Register user first
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // Find user
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({ email: testUser.email })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.message).toBe('User retrieved successfully');
            expect(response.body.data.email).toBe(testUser.email);
        });
        it('should return 404 for non-existent user', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({ email: 'nonexistent@example.com' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('User not found');
        });
        it('should return 400 when email is missing', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({})
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.status).toBe('failed');
            expect(response.body.message).toBe('Email is required');
        });
    });
    describe('Token Refresh Flow', () => {
        it('should handle multiple logins and update refresh token', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            // Register user
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(testUser);
            // First login
            const firstLogin = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            const firstRefreshToken = firstLogin.body.data.refreshToken;
            // Second login (should update refresh token)
            const secondLogin = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({
                email: testUser.email,
                password: testUser.password,
            });
            const secondRefreshToken = secondLogin.body.data.refreshToken;
            expect(firstRefreshToken).toBeDefined();
            expect(secondRefreshToken).toBeDefined();
            // Both logins should succeed
            expect(firstLogin.body.status_code).toBe(200);
            expect(secondLogin.body.status_code).toBe(200);
        });
    });
});
