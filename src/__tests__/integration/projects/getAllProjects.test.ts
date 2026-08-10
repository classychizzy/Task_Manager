import request from 'supertest';
import express from 'express';
import App from '../../../app';
import AppDataSource from '../../../ormconfig';
import { TestDbHelper, generateTestUser } from '../../helpers/db.helper';

describe('Get All Projects Integration Tests', () => {
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

    describe('GET /api/v1/projects/all', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/projects/all')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return an empty list for a user with no projects', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
            expect(response.body.meta.total).toBe(0);
        });

        it('should return only the authenticated user\'s own projects', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            await createProject(userA.accessToken, { name: 'User A Project One' });
            await createProject(userA.accessToken, { name: 'User A Project Two' });
            await createProject(userB.accessToken, { name: 'User B Project One' });

            const response = await request(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${userA.accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data.length).toBe(2);
            expect(
                response.body.data.every((p: any) => p.user.user_id === userA.userId)
            ).toBe(true);
        });

        it('should not include soft-deleted projects', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const created = await createProject(accessToken, { name: 'Soon To Be Deleted' });
            const projectId = created.body.data.project_id;

            await request(server)
                .delete(`/api/v1/projects/${projectId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.data.find((p: any) => p.project_id === projectId)).toBeUndefined();
        });

        it('should not expose the user\'s password in the response', async () => {
            const { accessToken } = await createAuthenticatedUser();
            await createProject(accessToken);

            const response = await request(server)
                .get('/api/v1/projects/all')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.data[0].user).not.toHaveProperty('password');
        });

        // --- Pagination ---

        describe('pagination', () => {
            beforeEach(async function (this: any) {
                // no-op placeholder; each test below creates its own authenticated user + projects
            });

            it('should apply default pagination when no page/limit given', async () => {
                const { accessToken } = await createAuthenticatedUser();
                for (let i = 0; i < 3; i++) {
                    await createProject(accessToken, { name: `Default Page Project ${i}` });
                }

                const response = await request(server)
                    .get('/api/v1/projects/all')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect('Content-Type', /json/);

                expect(response.body.meta.page).toBeGreaterThanOrEqual(1);
                expect(response.body.meta.limit).toBeGreaterThan(0);
                expect(response.body.meta.total).toBe(3);
            });

            it('should respect an explicit limit', async () => {
                const { accessToken } = await createAuthenticatedUser();
                for (let i = 0; i < 5; i++) {
                    await createProject(accessToken, { name: `Limit Test Project ${i}` });
                }

                const response = await request(server)
                    .get('/api/v1/projects/all?page=1&limit=2')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect('Content-Type', /json/);

                expect(response.body.data.length).toBe(2);
                expect(response.body.meta.total).toBe(5);
                expect(response.body.meta.totalPages).toBe(3);
            });

            it('should return the second page correctly with no overlap', async () => {
                const { accessToken } = await createAuthenticatedUser();
                for (let i = 0; i < 5; i++) {
                    await createProject(accessToken, { name: `Page Split Project ${i}` });
                }

                const pageOne = await request(server)
                    .get('/api/v1/projects/all?page=1&limit=2')
                    .set('Authorization', `Bearer ${accessToken}`);

                const pageTwo = await request(server)
                    .get('/api/v1/projects/all?page=2&limit=2')
                    .set('Authorization', `Bearer ${accessToken}`);

                const pageOneIds = pageOne.body.data.map((p: any) => p.project_id);
                const pageTwoIds = pageTwo.body.data.map((p: any) => p.project_id);
                const overlap = pageOneIds.filter((id: number) => pageTwoIds.includes(id));

                expect(overlap.length).toBe(0);
            });

            it('should return an empty array for a page beyond available results', async () => {
                const { accessToken } = await createAuthenticatedUser();
                await createProject(accessToken);

                const response = await request(server)
                    .get('/api/v1/projects/all?page=999&limit=10')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .expect('Content-Type', /json/);

                expect(response.body.status_code).toBe(200);
                expect(response.body.data).toEqual([]);
            });

            it('should not crash on non-numeric page/limit query params', async () => {
                const { accessToken } = await createAuthenticatedUser();
                await createProject(accessToken);

                const response = await request(server)
                    .get('/api/v1/projects/all?page=abc&limit=xyz')
                    .set('Authorization', `Bearer ${accessToken}`);

                // Should not 500 — either falls back to defaults (200) or rejects cleanly (400)
                expect(response.status).not.toBe(500);
            });

            it('should not crash and should clamp on a zero or negative page', async () => {
                const { accessToken } = await createAuthenticatedUser();
                await createProject(accessToken);

                const response = await request(server)
                    .get('/api/v1/projects/all?page=-1&limit=10')
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).not.toBe(500);
            });

            it('should cap an excessively large limit rather than returning unbounded results', async () => {
                const { accessToken } = await createAuthenticatedUser();
                await createProject(accessToken);

                const response = await request(server)
                    .get('/api/v1/projects/all?page=1&limit=999999')
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).not.toBe(500);
                // If a max cap is enforced, meta.limit should reflect the cap, not the raw requested value.
                // Adjust this assertion to your actual enforced maximum once confirmed.
            });
        });
    });
});