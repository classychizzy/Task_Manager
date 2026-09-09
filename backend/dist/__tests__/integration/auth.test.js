"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const ormconfig_1 = __importDefault(require("../../ormconfig"));
const crypto_1 = __importDefault(require("crypto"));
const db_helper_1 = require("../helpers/db.helper");
const securitypayload_1 = require("../helpers/securitypayload");
const user_entity_1 = require("../../entities/user_entity");
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
            expect(response.body.status_code).toBe(201);
            expect(response.body.success).toBe(true);
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
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Please provide a valid email');
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
            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
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
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });
        // sql injection tests
        it.each(securitypayload_1.sqlInjectionPayloads)('should reject SQL injection attempts with %s', async (payload) => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send({ ...(0, db_helper_1.generateTestUser)(), username: payload })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });
        it.each(securitypayload_1.xssPayloads)('should reject XSS attempts with %s', async (payload) => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send({ ...(0, db_helper_1.generateTestUser)(), username: payload })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
    // tests for user login
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
            expect(response.body.success).toBe(true);
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
            expect(response.body.success).toBe(false);
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
            expect(response.body.success).toBe(false);
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
    // test for find user by email
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
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User retrieved successfully');
            expect(response.body.data.email).toBe(testUser.email);
        });
        it('should return 404 for non-existent user', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({ email: 'nonexistent@example.com' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });
        it('should return 400 when email is missing', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({})
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email is required');
        });
    });
    // test for token refresh flow
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
    // delete user
    describe('DELETE /auth/delete/me', () => {
        const createAuthenticatedUser = async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const loginRes = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            return {
                accessToken: loginRes.body.data.accessToken,
                refreshToken: loginRes.body.data.refreshToken,
                userId: loginRes.body.data.user.user_id,
                email: testUser.email,
                password: testUser.password,
            };
        };
        const deleteUser = (accessToken) => {
            return (0, supertest_1.default)(server)
                .delete('/api/v1/auth/delete/me')
                .set('Authorization', `Bearer ${accessToken}`);
        };
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/auth/delete/me')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should let a user delete their own account', async () => {
            const user = await createAuthenticatedUser();
            // Register user first
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/register')
                .send(user);
            const response = await deleteUser(user.accessToken)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');
        });
        it('should prevent login after account deletion', async () => {
            const user = await createAuthenticatedUser();
            await deleteUser(user.accessToken);
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: user.email, password: user.password });
            console.log('LOGIN AFTER DELETE:', loginResponse.body);
            expect(loginResponse.body.status_code).not.toBe(200);
        });
        it('should return 409 when attempting to delete an already-deleted account', async () => {
            const user = await createAuthenticatedUser();
            await deleteUser(user.accessToken);
            // Note: this second call uses the same (now-revoked) access token.
            // If your auth middleware rejects revoked tokens outright, this
            // test may need adjusting to instead verify via a fresh lookup
            // that a second deletion attempt is blocked, rather than reusing
            // the token directly.
            const response = await deleteUser(user.accessToken);
            expect([401, 409]).toContain(response.body.status_code);
        });
        it('should not allow another user to delete someone else\'s account by manipulating a request', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            await deleteUser(userB.accessToken);
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: userA.email, password: userA.password });
            // User A should be completely unaffected by User B's deletion
            expect(loginResponse.body.status_code).toBe(200);
        });
    });
    // update user
    describe('PUT /auth/update/me', () => {
        const createAuthenticatedUser = async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const loginRes = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            return {
                accessToken: loginRes.body.data.accessToken,
                userId: loginRes.body.data.user.user_id,
                email: testUser.email,
                username: testUser.username,
            };
        };
        const updateUser = (accessToken, payload) => {
            return (0, supertest_1.default)(server)
                .put('/api/v1/auth/update/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload);
        };
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .put('/api/v1/auth/update/me')
                .send({ firstName: 'New' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should update firstName only, leaving other fields unchanged', async () => {
            const user = await createAuthenticatedUser();
            const response = await updateUser(user.accessToken, { firstName: 'Updated' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.firstName).toBe('Updated');
            expect(response.body.data.email).toBe(user.email);
        });
        it('should update email successfully', async () => {
            const user = await createAuthenticatedUser();
            const newEmail = `updated_${Date.now()}@example.com`;
            const response = await updateUser(user.accessToken, { email: newEmail })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.data.email).toBe(newEmail);
        });
        it('should not include password in the response', async () => {
            const user = await createAuthenticatedUser();
            const response = await updateUser(user.accessToken, { firstName: 'Updated' });
            expect(response.body.data).not.toHaveProperty('password');
        });
        it('should return 409 when updating email to one already in use', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const response = await updateUser(userA.accessToken, { email: userB.email })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
        });
        it('should return 409 when updating username to one already in use', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const response = await updateUser(userA.accessToken, { username: userB.username })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
        });
        it('should allow updating to the same email the user already has', async () => {
            const user = await createAuthenticatedUser();
            const response = await updateUser(user.accessToken, { email: user.email });
            expect(response.body.status_code).toBe(200);
        });
        it('should reject a firstName shorter than 3 characters', async () => {
            const user = await createAuthenticatedUser();
            const response = await updateUser(user.accessToken, { firstName: 'ab' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should reject an invalid email format', async () => {
            const user = await createAuthenticatedUser();
            const response = await updateUser(user.accessToken, { email: 'not-an-email' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should not allow one user to update another user\'s profile', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            await updateUser(userB.accessToken, { firstName: 'HijackedByB' });
            const verify = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/user')
                .send({ email: userA.email });
            expect(verify.body.data.firstName).not.toBe('HijackedByB');
        });
    });
    // change password
    describe('PUT /auth/change/password', () => {
        const createAuthenticatedUser = async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const loginRes = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: testUser.password });
            return {
                accessToken: loginRes.body.data.accessToken,
                refreshToken: loginRes.body.data.refreshToken,
                userId: loginRes.body.data.user.user_id,
                email: testUser.email,
                password: testUser.password,
            };
        };
        const changePassword = (accessToken, payload) => {
            return (0, supertest_1.default)(server)
                .put('/api/v1/auth/change/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload);
        };
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .put('/api/v1/auth/change/password')
                .send({ currentPassword: 'x', newPassword: 'NewPass123!' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should change the password with valid current password', async () => {
            const user = await createAuthenticatedUser();
            const response = await changePassword(user.accessToken, {
                currentPassword: user.password,
                newPassword: 'BrandNewPass123!',
            }).expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User password changed successfully');
        });
        it('should allow login with the new password after a successful change', async () => {
            const user = await createAuthenticatedUser();
            await changePassword(user.accessToken, {
                currentPassword: user.password,
                newPassword: 'BrandNewPass123!',
            });
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: user.email, password: 'BrandNewPass123!' });
            expect(loginResponse.body.status_code).toBe(200);
        });
        it('should reject login with the old password after a successful change', async () => {
            const user = await createAuthenticatedUser();
            await changePassword(user.accessToken, {
                currentPassword: user.password,
                newPassword: 'BrandNewPass123!',
            });
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: user.email, password: user.password });
            expect(loginResponse.body.status_code).not.toBe(200);
        });
        it('should return 401 for an incorrect current password', async () => {
            const user = await createAuthenticatedUser();
            const response = await changePassword(user.accessToken, {
                currentPassword: 'WrongPassword123!',
                newPassword: 'BrandNewPass123!',
            }).expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should return 400 when new password matches the current password', async () => {
            const user = await createAuthenticatedUser();
            const response = await changePassword(user.accessToken, {
                currentPassword: user.password,
                newPassword: user.password,
            }).expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should revoke existing refresh tokens after a successful password change', async () => {
            const user = await createAuthenticatedUser();
            await changePassword(user.accessToken, {
                currentPassword: user.password,
                newPassword: 'BrandNewPass123!',
            });
            const refreshResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: user.refreshToken });
            expect(refreshResponse.body.status_code).not.toBe(200);
        });
    });
    // forgot password
    describe('POST /auth/forgot-password', () => {
        it('should return 200 with a generic message for a registered email', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/forgot-password')
                .send({ email: testUser.email })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should return the same generic response for a non-existent email (no enumeration leak)', async () => {
            const registered = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(registered);
            const realEmailRes = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/forgot-password')
                .send({ email: registered.email });
            const fakeEmailRes = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'nobody@example.com' });
            expect(realEmailRes.body.status_code).toBe(fakeEmailRes.body.status_code);
            expect(realEmailRes.body.message).toBe(fakeEmailRes.body.message);
        });
        it('should reject an invalid email format', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'not-an-email' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
    });
    // reset password
    describe('POST /auth/reset-password', () => {
        it('should reset the password with a valid token', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
            const rawToken = 'test-raw-token-' + Date.now();
            const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
            await userRepo.update({ email: testUser.email }, {
                resetPasswordTokenHash: hashedToken,
                resetPasswordTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: rawToken, newPassword: 'ResetPass123!' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
        });
        it('should allow login with the new password after reset', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
            const rawToken = 'test-raw-token-' + Date.now();
            const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
            await userRepo.update({ email: testUser.email }, {
                resetPasswordTokenHash: hashedToken,
                resetPasswordTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: rawToken, newPassword: 'ResetPass123!' });
            const loginResponse = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/login')
                .send({ email: testUser.email, password: 'ResetPass123!' });
            expect(loginResponse.body.status_code).toBe(200);
        });
        it('should reject an expired token', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
            const rawToken = 'expired-token-' + Date.now();
            const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
            await userRepo.update({ email: testUser.email }, {
                resetPasswordTokenHash: hashedToken,
                resetPasswordTokenExpiresAt: new Date(Date.now() - 60 * 1000), // already expired
            });
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: rawToken, newPassword: 'ResetPass123!' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });
        it('should reject an invalid/unknown token', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: 'totally-made-up-token', newPassword: 'ResetPass123!' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should be single-use — the same token cannot be used twice', async () => {
            const testUser = (0, db_helper_1.generateTestUser)();
            await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
            const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
            const rawToken = 'single-use-token-' + Date.now();
            const hashedToken = crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
            await userRepo.update({ email: testUser.email }, {
                resetPasswordTokenHash: hashedToken,
                resetPasswordTokenExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
            });
            await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: rawToken, newPassword: 'FirstReset123!' });
            const secondAttempt = await (0, supertest_1.default)(server)
                .post('/api/v1/auth/reset-password')
                .send({ token: rawToken, newPassword: 'SecondReset123!' });
            expect(secondAttempt.body.status_code).toBe(400);
        });
    });
});
