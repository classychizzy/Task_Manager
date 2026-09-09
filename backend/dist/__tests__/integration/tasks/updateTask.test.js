"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Update Task Integration Tests', () => {
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
    const createTask = (accessToken, projectId, overrides) => {
        return (0, supertest_1.default)(server)
            .post(`/api/v1/tasks/create/${projectId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(generateTaskPayload(overrides));
    };
    const updateTask = (accessToken, taskId, payload) => {
        return (0, supertest_1.default)(server)
            .put(`/api/v1/tasks/${taskId}/update`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };
    describe('PUT /api/v1/tasks/:taskId/update', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .put('/api/v1/tasks/1/update')
                .send({ title: 'New Title Here' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should update only the title, leaving other fields unchanged (partial update)', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, {
                title: 'Original Title',
                description: 'Original description that is long enough.',
            });
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { title: 'Updated Title Here' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe('Updated Title Here');
            expect(response.body.data.description).toBe('Original description that is long enough.');
        });
        it('should update only the status', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { status: 'in_progress' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.data.status).toBe('in_progress');
        });
        it('should update the due date when a valid date is provided', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { dueDate: '2027-12-25' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(new Date(response.body.data.dueDate).getUTCFullYear()).toBe(2027);
        });
        it('should return 400 and NOT silently ignore an invalid due date', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { dueDate: '2027-01-01' });
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { dueDate: 'not-a-real-date' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
            // Confirm the original due date was NOT silently overwritten/dropped
            const verify = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(new Date(verify.body.data.dueDate).getUTCFullYear()).toBe(2027);
            expect(new Date(verify.body.data.dueDate).getUTCMonth()).toBe(0); // January
        });
        it('should update the updated_at timestamp', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const originalUpdatedAt = created.body.data.updated_at;
            await new Promise((resolve) => setTimeout(resolve, 50));
            const response = await updateTask(accessToken, taskId, { status: 'completed' });
            expect(new Date(response.body.data.updated_at).getTime())
                .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
        });
        it('should return 404 (not 403) when updating another user\'s task', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'User A Task' });
            const taskId = created.body.data.task_id;
            const response = await updateTask(userB.accessToken, taskId, { title: 'Hijacked Title Attempt' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });
        it('should not actually change the task when update is attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'Protected Title' });
            const taskId = created.body.data.task_id;
            await updateTask(userB.accessToken, taskId, { title: 'Hijacked Title Attempt' });
            const verify = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);
            expect(verify.body.data.title).toBe('Protected Title');
        });
        it('should return 404 for a non-existent task id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await updateTask(accessToken, 999999, { title: 'Does Not Matter Anyway' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should reject an invalid title via DTO validation (too short)', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { title: 'ab' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should reject an invalid status enum value', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const response = await updateTask(accessToken, taskId, { status: 'not_a_real_status' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await updateTask(accessToken, 'abc', { title: 'Does Not Matter' });
            expect(response.status).not.toBe(500);
        });
    });
});
