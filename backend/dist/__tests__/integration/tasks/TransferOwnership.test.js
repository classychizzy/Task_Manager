"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Transfer Ownership Integration Tests', () => {
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
    const transferOwnership = (accessToken, taskId, newOwnerEmail) => {
        return (0, supertest_1.default)(server)
            .put(`/api/v1/taskassignments/transfer/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ newOwnerEmail });
    };
    describe('PUT /taskassignments/transfer/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .put('/api/v1/taskassignments/transfer/1')
                .send({ newOwnerEmail: 'someone@example.com' })
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should transfer ownership to an existing user with no prior assignment', async () => {
            const presentOwner = await createAuthenticatedUser();
            const newOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await transferOwnership(presentOwner.accessToken, taskId, newOwner.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('ownership transferred successfully');
        });
        it('should downgrade the previous owner to EDIT after transfer', async () => {
            const presentOwner = await createAuthenticatedUser();
            const newOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await transferOwnership(presentOwner.accessToken, taskId, newOwner.email);
            const permissionCheck = await (0, supertest_1.default)(server)
                .get(`/api/v1/taskassignments/permission/${taskId}`)
                .set('Authorization', `Bearer ${presentOwner.accessToken}`);
            expect(permissionCheck.body.data.permission).toBe('edit');
            expect(permissionCheck.body.data.isOwner).toBe(false);
        });
        it('should upgrade the new owner\'s permission to OWNER', async () => {
            const presentOwner = await createAuthenticatedUser();
            const newOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await transferOwnership(presentOwner.accessToken, taskId, newOwner.email);
            const permissionCheck = await (0, supertest_1.default)(server)
                .get(`/api/v1/taskassignments/permission/${taskId}`)
                .set('Authorization', `Bearer ${newOwner.accessToken}`);
            expect(permissionCheck.body.data.permission).toBe('owner');
            expect(permissionCheck.body.data.isOwner).toBe(true);
        });
        it('should upgrade an existing VIEW/EDIT assignee to OWNER instead of creating a duplicate', async () => {
            const presentOwner = await createAuthenticatedUser();
            const existingViewer = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(presentOwner.accessToken, taskId, { email: existingViewer.email, permission: 'view' });
            await transferOwnership(presentOwner.accessToken, taskId, existingViewer.email);
            const permissionCheck = await (0, supertest_1.default)(server)
                .get(`/api/v1/taskassignments/permission/${taskId}`)
                .set('Authorization', `Bearer ${existingViewer.accessToken}`);
            expect(permissionCheck.body.data.permission).toBe('owner');
        });
        it('should also grant the new owner control over updating the task itself (Option B verification)', async () => {
            const presentOwner = await createAuthenticatedUser();
            const newOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await transferOwnership(presentOwner.accessToken, taskId, newOwner.email);
            const response = await (0, supertest_1.default)(server)
                .put(`/api/v1/tasks/${taskId}/update`)
                .set('Authorization', `Bearer ${newOwner.accessToken}`)
                .send({ title: 'Updated By New Owner' });
            expect(response.body.status_code).toBe(200);
        });
        it('should return 409 when transferring to yourself', async () => {
            const presentOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await transferOwnership(presentOwner.accessToken, taskId, presentOwner.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
        });
        it('should return 404 when the requester is not the current owner', async () => {
            const presentOwner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(presentOwner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            const response = await transferOwnership(viewer.accessToken, taskId, target.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should return 404 when the new owner email does not match any user', async () => {
            const presentOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await transferOwnership(presentOwner.accessToken, taskId, 'nobody@example.com')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('user not found');
        });
        it('should return 404 for a non-existent task', async () => {
            const presentOwner = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();
            const response = await transferOwnership(presentOwner.accessToken, 999999, target.email)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should reject an invalid email via DTO validation', async () => {
            const presentOwner = await createAuthenticatedUser();
            const project = await createProject(presentOwner.accessToken);
            const task = await createTask(presentOwner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const response = await transferOwnership(presentOwner.accessToken, taskId, 'not-an-email')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(400);
        });
        it('should not crash on a non-numeric task id', async () => {
            const presentOwner = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();
            const response = await transferOwnership(presentOwner.accessToken, 'abc', target.email);
            expect(response.status).not.toBe(500);
        });
    });
});
