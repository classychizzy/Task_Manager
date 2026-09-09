"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Remove User From Task Integration Tests', () => {
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
            email: testUser.email,
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
    const createTask = (accessToken, projectId, overrides) => {
        return (0, supertest_1.default)(server)
            .post(`/api/v1/tasks/create/${projectId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
            title: `Task ${Date.now()} ${Math.random()}`.slice(0, 50),
            description: 'A generic task description used for testing purposes.',
            dueDate: '2027-03-15',
            ...overrides,
        });
    };
    const assignTask = (accessToken, taskId, payload) => {
        return (0, supertest_1.default)(server)
            .post(`/api/v1/taskassignments/assign/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };
    // NOTE: route/param shape assumed. Service takes (taskId, userId, requesterId),
    // and the route was registered as DELETE '/remove/:taskId' with no email,
    // so email is assumed to travel in the request body. Adjust if your
    // controller actually expects it as a route param or query param instead.
    const removeUser = (accessToken, taskId, email) => {
        return (0, supertest_1.default)(server)
            .delete(`/api/v1/taskassignments/remove/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ email });
    };
    describe('DELETE /taskassignments/remove/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/taskassignments/remove/1')
                .send({ userId: 1 })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should allow the owner to remove an assigned user from the task', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: assignee.email });
            const response = await removeUser(owner.accessToken, taskId, assignee.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('user removed from task successfully');
        });
        it('should make the removed user lose access (permission lookup returns 404)', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: assignee.email });
            await removeUser(owner.accessToken, taskId, assignee.email);
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/taskassignments/permission/${taskId}`)
                .set('Authorization', `Bearer ${assignee.accessToken}`);
            expect(response.body.status_code).toBe(404);
        });
        it('should return 409 when the owner attempts to remove themselves', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await removeUser(owner.accessToken, taskId, owner.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('you cannot remove yourself from the task');
        });
        it('should return 404 when the requester is not the task owner', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await assignTask(owner.accessToken, taskId, { email: target.email, permission: 'view' });
            const response = await removeUser(viewer.accessToken, taskId, target.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should return 404 when the target user has no assignment on this task', async () => {
            const owner = await createAuthenticatedUser();
            const notAssigned = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await removeUser(owner.accessToken, taskId, notAssigned.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('target user not found');
        });
        it('should not actually remove the user when attempted by a non-owner', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await assignTask(owner.accessToken, taskId, { email: target.email, permission: 'view' });
            await removeUser(viewer.accessToken, taskId, target.userId);
            const check = await (0, supertest_1.default)(server)
                .get(`/api/v1/taskassignments/permission/${taskId}`)
                .set('Authorization', `Bearer ${target.accessToken}`);
            expect(check.body.status_code).toBe(200);
        });
        it('should not crash on a non-numeric task id', async () => {
            const owner = await createAuthenticatedUser();
            const response = await removeUser(owner.accessToken, 'abc', owner.userId);
            expect(response.status).not.toBe(500);
        });
    });
});
