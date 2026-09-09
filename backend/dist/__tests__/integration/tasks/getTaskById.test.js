"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
const ormconfig_1 = __importDefault(require("../../../ormconfig")); // adjust to your actual path
const task_entity_1 = require("../../../entities/task_entity"); // adjust to your actual path
describe('Get Task By Id Integration Tests', () => {
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
    describe('GET /api/v1/tasks/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .get('/api/v1/tasks/1')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should retrieve a task belonging to the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'My Own Task' });
            const taskId = created.body.data.task_id;
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            console.log('STATUS:', response.status);
            console.log('BODY:', response.text);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('task retrieved successfully');
            expect(response.body.data.task_id).toBe(taskId);
            expect(response.body.data.title).toBe('My Own Task');
        });
        it('should return 404 (not 403) when requesting a task from another user\'s project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'User A Task' });
            const taskId = created.body.data.task_id;
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('task not found');
        });
        it('should return 404 for a non-existent task id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await (0, supertest_1.default)(server)
                .get('/api/v1/tasks/999999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should return the same 404 message for both "not yours" and "does not exist" (no enumeration leak)', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;
            const notYoursRes = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`);
            const doesNotExistRes = await (0, supertest_1.default)(server)
                .get('/api/v1/tasks/999999')
                .set('Authorization', `Bearer ${userB.accessToken}`);
            expect(notYoursRes.body.status_code).toBe(doesNotExistRes.body.status_code);
            expect(notYoursRes.body.message).toBe(doesNotExistRes.body.message);
        });
        it('should let a VIEW-permission assignee retrieve the task', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const assignRes = await (0, supertest_1.default)(server)
                .post(`/api/v1/taskassignments/assign/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({ email: viewer.email, permission: 'view' });
            console.log('ASSIGN RESPONSE:', JSON.stringify(assignRes.body, null, 2));
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${viewer.accessToken}`);
            console.log('GET STATUS:', response.status);
            console.log('GET BODY:', response.text);
        });
        it('should return 404 for a soft-deleted task', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'To Be Deleted' });
            const taskId = created.body.data.task_id;
            const taskRepo = ormconfig_1.default.getRepository(task_entity_1.Task_entity);
            await taskRepo.update({ task_id: taskId }, { is_deleted: true });
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await (0, supertest_1.default)(server)
                .get('/api/v1/tasks/abc')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).not.toBe(500);
        });
    });
});
