"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../../app"));
const db_helper_1 = require("../../helpers/db.helper");
describe('Delete Project Integration Tests', () => {
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
    const generateProjectPayload = (overrides) => ({
        name: `Project ${Date.now()} ${Math.random()}`,
        description: 'A generic project description for testing purposes.',
        ...overrides,
    });
    const createProject = async (accessToken, overrides) => {
        return (0, supertest_1.default)(server)
            .post('/api/v1/projects/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(generateProjectPayload(overrides));
    };
    describe('DELETE /api/v1/projects/:projectId/delete', () => {
        it('should reject request without authentication', async () => {
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/projects/1/delete')
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });
        it('should soft delete a project owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;
            const response = await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project deleted successfully');
            expect(response.body.data).toBeNull();
        });
        it('should make the project unreachable via get-by-id after deletion', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);
            const response = await (0, supertest_1.default)(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.body.status_code).toBe(404);
        });
        it('should remove the project from the get-all list after deletion', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Will Be Deleted' });
            const projectId = created.body.data.project_id;
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);
            const response = await (0, supertest_1.default)(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.body.data.find((p) => p.project_id === projectId)).toBeUndefined();
        });
        it('should return 409 when trying to delete an already-deleted project', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);
            const response = await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project already deleted');
        });
        it('should return 404 (not 403) when trying to delete another user\'s project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const created = await createProject(userA.accessToken, { name: 'User A Project' });
            const projectId = created.body.data.project_id;
            const response = await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found');
        });
        it('should not actually delete the project when attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const created = await createProject(userA.accessToken, { name: 'Protected Project' });
            const projectId = created.body.data.project_id;
            await (0, supertest_1.default)(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${userB.accessToken}`);
            const verify = await (0, supertest_1.default)(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);
            expect(verify.body.status_code).toBe(200);
            expect(verify.body.data.name).toBe('Protected Project');
        });
        it('should return 404 for a non-existent project id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/projects/999999/delete')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);
            expect(response.body.status_code).toBe(404);
        });
        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const response = await (0, supertest_1.default)(server)
                .delete('/api/v1/projects/abc/delete')
                .set('Authorization', `Bearer ${accessToken}`);
            expect(response.status).not.toBe(500);
        });
    });
});
