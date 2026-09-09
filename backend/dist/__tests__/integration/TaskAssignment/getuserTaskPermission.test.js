"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Get User Task Permission Integration Tests', () => {
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
    const getPermission = (accessToken, taskId) => {
        return (0, supertest_1.default)(server)
            .get(`/api/v1/taskassignments/permission/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };
    describe('GET /taskassignments/permission/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await getPermission('', 1)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should return OWNER permission and full capabilities for the task creator', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await getPermission(owner.accessToken, taskId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.permission).toBe('owner');
            expect(response.body.data.isOwner).toBe(true);
            expect(response.body.data.canEdit).toBe(true);
            expect(response.body.data.canDelete).toBe(true);
        });
        it('should return VIEW permission with restricted capabilities for a viewer', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            const response = await getPermission(viewer.accessToken, taskId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.data.permission).toBe('view');
            expect(response.body.data.isOwner).toBe(false);
            expect(response.body.data.canEdit).toBe(false);
            expect(response.body.data.canDelete).toBe(false);
        });
        it('should return EDIT permission with edit but not delete capability', async () => {
            const owner = await createAuthenticatedUser();
            const editor = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: editor.email, permission: 'edit' });
            const response = await getPermission(editor.accessToken, taskId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.data.permission).toBe('edit');
            expect(response.body.data.isOwner).toBe(false);
            expect(response.body.data.canEdit).toBe(true);
            expect(response.body.data.canDelete).toBe(false);
        });
        it('should return 404 for a user with no assignment on the task', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await getPermission(outsider.accessToken, taskId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('assignment not found');
        });
        it('should return 404 for a non-existent task', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await getPermission(accessToken, 999999)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await getPermission(accessToken, 'abc');
            expect(response.status).not.toBe(500);
        });
    });
});
