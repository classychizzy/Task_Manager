import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Update Project Integration Tests', () => {
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

    describe('PUT /api/v1/projects/:projectId/update', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .put('/api/v1/projects/1/update')
                .send({ name: 'New Name Here' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should update the name of a project owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Original Name' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Updated Name Here' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project updated successfully');
            expect(response.body.data.name).toBe('Updated Name Here');
        });

        it('should update the description independently of name', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'Keep This Name' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ description: 'A brand new description here.' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data.name).toBe('Keep This Name');
            expect(response.body.data.description).toBe('A brand new description here.');
        });

        it('should update the updated_at timestamp', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;
            const originalUpdatedAt = created.body.data.updated_at;

            await new Promise((resolve) => setTimeout(resolve, 50));

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Timestamp Check Name' });

            expect(new Date(response.body.data.updated_at).getTime())
                .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
        });

        it('should reject an empty update payload', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({})
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No update data provided');
        });

        it('should return 404 (not 403) when trying to update another user\'s project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'User A Project' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .send({ name: 'Hijacked Name Attempt' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found');
        });

        it('should not actually change the project when update is attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'Protected Name' });
            const projectId = created.body.data.project_id;

            await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .send({ name: 'Hijacked Name Attempt' });

            const verify = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);

            expect(verify.body.data.name).toBe('Protected Name');
        });

        it('should return 404 for a non-existent project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .put('/api/v1/projects/999999/update')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Does Not Matter' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should reject an invalid name via DTO validation (too short)', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'ab' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should reject SQL injection payloads in name via DTO validation', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken);
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .put(`/api/v1/projects/${projectId}/update`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: "admin'--" })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .put('/api/v1/projects/abc/update')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Does Not Matter' });

            expect(response.status).not.toBe(500);
        });
    });
});