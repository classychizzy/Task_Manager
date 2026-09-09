import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get All Tasks Integration Tests', () => {
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

    const createProject = async (accessToken: string, overrides?: any) => {
        return request(server)
            .post('/api/v1/projects/create')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: `Project ${Date.now()} ${Math.random()}`,
                description: 'A generic project description for testing purposes.',
                ...overrides,
            });
    };

    const generateTaskPayload = (overrides?: any) => ({
        title: `Task ${Date.now()} ${Math.random()}`.slice(0, 50),
        description: 'A generic task description used for testing purposes.',
        dueDate: '2027-03-15',
        ...overrides,
    });

    const createTask = (accessToken: string, projectId: number, overrides?: any) => {
        return request(server)
            .post(`/api/v1/tasks/create/${projectId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(generateTaskPayload(overrides));
    };

    const getAllTasks = (accessToken: string, projectId: number, query = '') => {
        return request(server)
            .get(`/api/v1/tasks/all/${projectId}${query}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('GET /api/v1/tasks/all/:projectId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/tasks/all/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 when the project does not exist', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getAllTasks(accessToken, 999999)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('project not found');
        });

        it('should return 404 (not 403) when the project belongs to a different user', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const projectId = project.body.data.project_id;

            const response = await getAllTasks(userB.accessToken, projectId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return an empty list for a project with no tasks', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;

            const response = await getAllTasks(accessToken, projectId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toEqual([]);
            expect(response.body.meta.total).toBe(0);
        });

        it('should return tasks belonging to the specified project only', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const projectA = await createProject(accessToken, { name: `Project A ${Date.now()}` });
            const projectB = await createProject(accessToken, { name: `Project B ${Date.now()}` });

            await createTask(accessToken, projectA.body.data.project_id, { title: 'Task In Project A' });
            await createTask(accessToken, projectB.body.data.project_id, { title: 'Task In Project B' });

            const response = await getAllTasks(accessToken, projectA.body.data.project_id)
                .expect('Content-Type', /json/);

            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].title).toBe('Task In Project A');
        });

        it('should not include soft-deleted tasks', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;

            const created = await createTask(accessToken, projectId, { title: 'Soon To Be Deleted' });
            const taskId = created.body.data.task_id;

            await request(server)
                .delete(`/api/v1/tasks/${taskId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await getAllTasks(accessToken, projectId);

            expect(response.body.data.find((t: any) => t.task_id === taskId)).toBeUndefined();
        });

        describe('pagination', () => {
            it('should respect an explicit limit', async () => {
                const { accessToken } = await createAuthenticatedUser();
                const project = await createProject(accessToken);
                const projectId = project.body.data.project_id;

                for (let i = 0; i < 5; i++) {
                    await createTask(accessToken, projectId, { title: `Limit Test Task ${i} Extra` });
                }

                const response = await getAllTasks(accessToken, projectId, '?page=1&limit=2')
                    .expect('Content-Type', /json/);

                expect(response.body.data.length).toBe(2);
                expect(response.body.meta.total).toBe(5);
                expect(response.body.meta.totalPages).toBe(3);
            });

            it('should return an empty array for a page beyond available results', async () => {
                const { accessToken } = await createAuthenticatedUser();
                const project = await createProject(accessToken);
                const projectId = project.body.data.project_id;

                await createTask(accessToken, projectId);

                const response = await getAllTasks(accessToken, projectId, '?page=999&limit=10')
                    .expect('Content-Type', /json/);

                expect(response.body.status_code).toBe(200);
                expect(response.body.data).toEqual([]);
            });

            it('should not crash on non-numeric page/limit query params', async () => {
                const { accessToken } = await createAuthenticatedUser();
                const project = await createProject(accessToken);
                const projectId = project.body.data.project_id;

                await createTask(accessToken, projectId);

                const response = await getAllTasks(accessToken, projectId, '?page=abc&limit=xyz');

                expect(response.status).not.toBe(500);
            });
        });

        it('should not crash on a non-numeric project id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getAllTasks(accessToken, 'abc' as any);

            expect(response.status).not.toBe(500);
        });
    });
});