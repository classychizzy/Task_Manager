"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Get User Assigned Tasks Integration Tests', () => {
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
    const getAssignedTasks = (accessToken) => {
        return (0, supertest_1.default)(server)
            .get('/api/v1/taskassignments/assignedtasks')
            .set('Authorization', `Bearer ${accessToken}`);
    };
    describe('GET /taskassignments/assignedtasks', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .get('/api/v1/taskassignments/assignedtasks')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should return 200 with a "no assignments" message when the user has none', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await getAssignedTasks(accessToken)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
            expect(response.body.message).toBe('you have no task assignments');
        });
        it('should return the standard success message when assignments exist', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            await createTask(owner.accessToken, project.body.data.project_id);
            const response = await getAssignedTasks(owner.accessToken)
                .expect('Content-Type', /json/);
            expect(response.body.message).toBe('user assignments retrieved successfully');
        });
        it('should include tasks the user owns (auto-assigned on creation)', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id, { title: 'My Own Task' });
            const taskId = task.body.data.task_id;
            const response = await getAssignedTasks(owner.accessToken);
            const found = response.body.data.find((a) => a.task.task_id === taskId);
            expect(found).toBeDefined();
            expect(found.permission).toBe('owner');
        });
        it('should include tasks the user was assigned to in other people\'s projects', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id, { title: 'Assigned To Me' });
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: assignee.email, permission: 'edit' });
            const response = await getAssignedTasks(assignee.accessToken)
                .expect('Content-Type', /json/);
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].task.task_id).toBe(taskId);
            expect(response.body.data[0].permission).toBe('edit');
        });
        it('should aggregate tasks assigned across multiple different projects', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();
            const projectA = await createProject(owner.accessToken, { name: `Project A ${Date.now()}` });
            const projectB = await createProject(owner.accessToken, { name: `Project B ${Date.now()}` });
            const taskA = await createTask(owner.accessToken, projectA.body.data.project_id, { title: 'Task In A' });
            const taskB = await createTask(owner.accessToken, projectB.body.data.project_id, { title: 'Task In B' });
            await assignTask(owner.accessToken, taskA.body.data.task_id, { email: assignee.email });
            await assignTask(owner.accessToken, taskB.body.data.task_id, { email: assignee.email });
            const response = await getAssignedTasks(assignee.accessToken);
            expect(response.body.data.length).toBe(2);
        });
        it('should not include another user\'s assignments', async () => {
            const owner = await createAuthenticatedUser();
            const assigneeA = await createAuthenticatedUser();
            const assigneeB = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: assigneeA.email });
            const response = await getAssignedTasks(assigneeB.accessToken);
            const found = response.body.data.find((a) => a.task.task_id === taskId);
            expect(found).toBeUndefined();
        });
        it('should not include soft-deleted (removed) assignments', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: assignee.email });
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/taskassignments/remove/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({ userId: assignee.userId });
            const response = await getAssignedTasks(assignee.accessToken);
            const found = response.body.data.find((a) => a.task.task_id === taskId);
            expect(found).toBeUndefined();
        });
        it('should include the related project data via the task relation', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken, { name: 'Relation Check Project' });
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const response = await getAssignedTasks(owner.accessToken);
            const found = response.body.data.find((a) => a.task.task_id === task.body.data.task_id);
            expect(found.task.project.name).toBe('Relation Check Project');
        });
    });
});
