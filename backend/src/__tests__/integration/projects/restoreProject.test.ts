import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Restore Project Integration Tests', () => {
    let app: App;
    let server: express.Application;

    beforeAll(async () => {
        app = new App();
        server = app.app;
    });

    const createAuthenticatedUser = async () => {
        const testUser = generateTestUser();

        await request(server).post('/api/v1/auth/register').send(testUser);

        const loginRes = await request(server)
            .post('/api/v1/auth/login')
            .send({ email: testUser.email, password: testUser.password });

        return {
            accessToken: loginRes.body.data.accessToken,
            userId: loginRes.body.data.user.user_id,
        };
    };

    const generateProjectPayload = (overrides?: any) => ({
        name: `Project ${Date.now()} ${Math.random()}`,
        description: 'A generic project description for testing purposes.',
        ...overrides,
    });

    const createProject = async (accessToken: string, overrides?: any) => {
        return request(server)
            .post('/api/v1/projects/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(generateProjectPayload(overrides));
    };

    const deleteProject = async (accessToken: string, projectId: number) => {
        return request(server)
            .delete(`/api/v1/projects/${projectId}/delete`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('PUT /api/v1/projects/:projectId/restore', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .put('/api/v1/projects/1/restore')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should restore a soft-deleted project owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Restore Me' });
            const projectId = created.body.data.project_id;

            await deleteProject(accessToken, projectId);

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project restored successfully');
        });

        it('should make the project reachable via get-by-id again after restoration', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Reappear Please' });
            const projectId = created.body.data.project_id;

            await deleteProject(accessToken, projectId);
            await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data.name).toBe('Reappear Please');
        });

        it('should reappear in the get-all list after restoration', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Back In The List' });
            const projectId = created.body.data.project_id;

            await deleteProject(accessToken, projectId);
            await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(
                response.body.data.some((p: any) => p.project_id === projectId)
            ).toBe(true);
        });

        it('should return 409 when trying to restore a project that is not deleted', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Never Deleted' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 for a non-existent project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .put('/api/v1/projects/999999/restore')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return 404 (not 403) when trying to restore another user\'s deleted project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'User A Deleted Project' });
            const projectId = created.body.data.project_id;

            await deleteProject(userA.accessToken, projectId);

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should not actually restore the project when attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'Stays Deleted' });
            const projectId = created.body.data.project_id;

            await deleteProject(userA.accessToken, projectId);

            await request(server)
                .put(`/api/v1/projects/${projectId}/restore`)
                .set('Authorization', `Bearer ${userB.accessToken}`);

            const verify = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);

            // Still soft-deleted from the real owner's perspective too — the
            // non-owner's restore attempt must not have taken effect.
            expect(verify.body.status_code).toBe(404);
        });

        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .put('/api/v1/projects/abc/restore')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).not.toBe(500);
        });
    });
});