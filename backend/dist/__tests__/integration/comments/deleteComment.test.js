"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Delete Comment Integration Tests', () => {
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
    const createComment = (accessToken, taskId, content) => {
        return (0, supertest_1.default)(server)
            .post(`/api/v1/comments/create/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ content });
    };
    // NOTE: route path assumed. Confirm against your actual Comment_Controller.
    const deleteComment = (accessToken, commentId) => {
        return (0, supertest_1.default)(server)
            .delete(`/api/v1/comments/delete/${commentId}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };
    describe('DELETE /comments/delete/:commentId', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/comments/delete/1')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should let a user delete their own comment', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const created = await createComment(owner.accessToken, taskId, 'Delete me');
            const commentId = created.body.data.comment_id;
            const response = await deleteComment(owner.accessToken, commentId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Comment deleted successfully');
        });
        it('should actually remove the comment from the list after deletion', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            const created = await createComment(owner.accessToken, taskId, 'Delete me too');
            const commentId = created.body.data.comment_id;
            await deleteComment(owner.accessToken, commentId);
            const list = await (0, supertest_1.default)(server)
                .get(`/api/v1/comments/task/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`);
            const found = list.body.data.find((c) => c.comment_id === commentId);
            expect(found).toBeUndefined();
        });
        it('should return 404 when trying to delete someone else\'s comment', async () => {
            const owner = await createAuthenticatedUser();
            const otherUser = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: otherUser.email, permission: 'view' });
            const created = await createComment(owner.accessToken, taskId, 'Owner comment');
            const commentId = created.body.data.comment_id;
            const response = await deleteComment(otherUser.accessToken, commentId)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });
        it('should not actually delete the comment when attempted by another user', async () => {
            const owner = await createAuthenticatedUser();
            const otherUser = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;
            await assignTask(owner.accessToken, taskId, { email: otherUser.email, permission: 'view' });
            const created = await createComment(owner.accessToken, taskId, 'Should survive');
            const commentId = created.body.data.comment_id;
            await deleteComment(otherUser.accessToken, commentId);
            const list = await (0, supertest_1.default)(server)
                .get(`/api/v1/comments/task/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`);
            const found = list.body.data.find((c) => c.comment_id === commentId);
            expect(found).toBeDefined();
        });
        it('should return 404 for a non-existent comment', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await deleteComment(accessToken, 999999)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should not crash on a non-numeric comment id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await deleteComment(accessToken, 'abc');
            expect(response.status).not.toBe(500);
        });
    });
});
