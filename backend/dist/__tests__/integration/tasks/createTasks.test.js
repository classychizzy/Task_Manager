"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
const securitypayload_1 = require("../../helpers/securitypayload");
describe('Create Task Integration Tests', () => {
    let app;
    let server;
    beforeAll(async () => {
        app = new app_1.default();
        server = app.app;
    });
    const createAuthenticatedUser = async () => {
        const testUser = (0, db_helper_1.generateTestUser)();
        await (0, supertest_1.default)(server).post('/api/v1/auth/register').send(testUser);
        const loginRes = await (0, supertest_1.default)(server)
            .post('/api/v1/auth/login')
            .send({ email: testUser.email, password: testUser.password });
        return {
            accessToken: loginRes.body.data.accessToken,
            userId: loginRes.body.data.user.user_id,
        };
    };
    const createProject = async (accessToken, overrides) => {
        return (0, supertest_1.default)(server)
            .post('/api/v1/projects/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            name: `Project ${Date.now()} ${Math.random()}`,
            description: 'A generic project description for testing purposes.',
            ...overrides,
        });
    };
    const generateTaskPayload = (overrides) => ({
        title: `Task ${Date.now()} ${Math.random()}`.slice(0, 50),
        description: 'A generic task description used for testing purposes.',
        dueDate: '2027-03-15',
        ...overrides,
    });
    // Route confirmed: POST /api/v1/tasks/create/:projectId
    const createTask = (accessToken, projectId, overrides) => {
        return (0, supertest_1.default)(server)
            .post(`/api/v1/tasks/create/${projectId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(generateTaskPayload(overrides));
    };
    describe('POST /api/v1/tasks/create/:projectId', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/tasks/create/1')
                .send(generateTaskPayload())
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should create a task in a project owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { title: 'Write the onboarding docs' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Task created successfully');
            expect(response.body.data).toHaveProperty('task_id');
            expect(response.body.data.title).toBe('Write the onboarding docs');
            expect(response.body.data.status).toBeDefined();
        });
        it('should default status to pending when not provided', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId);
            expect(response.body.data.status).toBe('pending');
        });
        it('should return 404 when the project does not exist', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await createTask(accessToken, 999999)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('project not found');
        });
        it('should return 404 (not 403) when the project belongs to a different user', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(userB.accessToken, projectId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('project not found');
        });
        it('should not create a task when a non-owner attempts it', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const projectId = project.body.data.project_id;
            await createTask(userB.accessToken, projectId, { title: 'Sneaky Task Attempt' });
            const verify = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/all/${projectId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);
            const found = verify.body.data?.find?.((t) => t.title === 'Sneaky Task Attempt');
            expect(found).toBeUndefined();
        });
        it('should return 409 for a duplicate task title within the same project', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            await createTask(accessToken, projectId, { title: 'Duplicate Title Task' });
            const response = await createTask(accessToken, projectId, { title: 'Duplicate Title Task' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('task with this title already exists in this project');
        });
        it('should allow the same task title in two different projects owned by the same user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const projectA = await createProject(accessToken, { name: `Project A ${Date.now()}` });
            const projectB = await createProject(accessToken, { name: `Project B ${Date.now()}` });
            const resA = await createTask(accessToken, projectA.body.data.project_id, { title: 'Shared Title Task' });
            const resB = await createTask(accessToken, projectB.body.data.project_id, { title: 'Shared Title Task' });
            expect(resA.body.status_code).toBe(201);
            expect(resB.body.status_code).toBe(201);
        });
        it('should return 400 for an invalid due date', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { dueDate: 'not-a-real-date' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('invalid date format, use YYYY-MM-DD format');
        });
        it('should accept a plain ISO date (YYYY-MM-DD) as due date', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { dueDate: '2027-06-01' });
            console.log('STATUS:', response.status);
            console.log('BODY:', JSON.stringify(response.body, null, 2));
            expect(response.body.status_code).toBe(201);
        });
        it('should reject a title shorter than 5 characters via DTO validation', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { title: 'ab' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should reject a description shorter than 15 characters via DTO validation', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { description: 'too short' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it.each(securitypayload_1.sqlInjectionPayloads)('should reject SQL injection payloads in title: %s', async (payload) => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { title: payload })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it.each(securitypayload_1.xssPayloads)('should reject XSS payloads in title: %s', async (payload) => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const response = await createTask(accessToken, projectId, { title: payload })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await (0, supertest_1.default)(server)
                .post('/api/v1/tasks/create/abc')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateTaskPayload());
            expect(response.status).not.toBe(500);
        });
    });
});
