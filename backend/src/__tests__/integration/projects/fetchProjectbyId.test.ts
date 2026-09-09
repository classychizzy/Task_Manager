import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get Project By Id Integration Tests', () => {
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

    describe('GET /api/v1/projects/:projectId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/projects/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should retrieve a project that belongs to the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'My Own Project' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project retrieved successfully');
            expect(response.body.data.project_id).toBe(projectId);
            expect(response.body.data.name).toBe('My Own Project');
            expect(response.body.data).toHaveProperty('tasks');
        });

        it('should return 404 (not 403) when requesting another user\'s project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'User A Only' });
            const projectId = created.body.data.project_id;

            const response = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found');
        });

        it('should return 404 for a non-existent project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .get('/api/v1/projects/999999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project not found');
        });

        it('should return the same 404 message for both "not yours" and "does not exist" (no enumeration leak)', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const created = await createProject(userA.accessToken, { name: 'A Project' });
            const projectId = created.body.data.project_id;

            const notYoursRes = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`);

            const doesNotExistRes = await request(server)
                .get('/api/v1/projects/999999')
                .set('Authorization', `Bearer ${userB.accessToken}`);

            expect(notYoursRes.body.status_code).toBe(doesNotExistRes.body.status_code);
            expect(notYoursRes.body.message).toBe(doesNotExistRes.body.message);
        });

        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .get('/api/v1/projects/abc')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).not.toBe(500);
        });

        it('should return 404 for a soft-deleted project', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const created = await createProject(accessToken, { name: 'To Be Deleted' });
            const projectId = created.body.data.project_id;

            await request(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(server)
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });
    });
});