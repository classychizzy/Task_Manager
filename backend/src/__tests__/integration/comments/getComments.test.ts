import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get Comments For Task Integration Tests', () => {
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
            email: testUser.email,
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

    const createTask = (accessToken: string, projectId: number, overrides?: any) => {
        return request(server)
            .post(`/api/v1/tasks/create/${projectId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: `Task ${Date.now()} ${Math.random()}`.slice(0, 50),
                description: 'A generic task description used for testing purposes.',
                dueDate: '2027-03-15',
                ...overrides,
            });
    };

    const assignTask = (accessToken: string, taskId: number, payload: object) => {
        return request(server)
            .post(`/api/v1/taskassignments/assign/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };

    const createComment = (accessToken: string, taskId: number, content: string) => {
        return request(server)
            .post(`/api/v1/comments/create/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ content });
    };

    // NOTE: route path assumed as GET /api/v1/comments/task/:taskId.
    // Confirm against your actual Comment_Controller route registration
    // and adjust every call below if it differs.
    const getComments = (accessToken: string, taskId: number | string, query = '') => {
        return request(server)
            .get(`/api/v1/comments/task/${taskId}${query}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('GET /comments/task/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/comments/task/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should let the task owner view comments', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await createComment(owner.accessToken, taskId, 'First comment');
            await createComment(owner.accessToken, taskId, 'Second comment');

            const response = await getComments(owner.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.meta.total).toBe(2);
        });

        it('should let an assigned VIEW-permission user view comments', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await createComment(owner.accessToken, taskId, 'Visible to viewer');

            const response = await getComments(viewer.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data.length).toBe(1);
        });

        it('should not include the commenter\'s password', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await createComment(owner.accessToken, taskId, 'A comment');

            const response = await getComments(owner.accessToken, taskId);

            expect(response.body.data[0].user).not.toHaveProperty('password');
        });

        it('should return an empty array for a task with no comments', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await getComments(owner.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data).toEqual([]);
        });

        it('should return 404 for a non-existent task', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getComments(accessToken, 999999)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return 404 (not 403) when the requester has no relationship to the task', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await getComments(outsider.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getComments(accessToken, 'abc');

            expect(response.status).not.toBe(500);
        });

        describe('pagination', () => {
            it('should respect an explicit limit', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                for (let i = 0; i < 5; i++) {
                    await createComment(owner.accessToken, taskId, `Comment number ${i}`);
                }

                const response = await getComments(owner.accessToken, taskId, '?page=1&limit=2')
                    .expect('Content-Type', /json/);

                expect(response.body.data.length).toBe(2);
                expect(response.body.meta.total).toBe(5);
                expect(response.body.meta.totalPages).toBe(3);
            });

            it('should return newest comments first', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                await createComment(owner.accessToken, taskId, 'Oldest comment');
                await new Promise((resolve) => setTimeout(resolve, 20));
                await createComment(owner.accessToken, taskId, 'Newest comment');

                const response = await getComments(owner.accessToken, taskId);

                expect(response.body.data[0].content).toBe('Newest comment');
            });

            it('should return an empty array for a page beyond available results', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                await createComment(owner.accessToken, taskId, 'Only comment');

                const response = await getComments(owner.accessToken, taskId, '?page=999&limit=10')
                    .expect('Content-Type', /json/);

                expect(response.body.status_code).toBe(200);
                expect(response.body.data).toEqual([]);
            });

            it('should not crash on non-numeric page/limit query params', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                const response = await getComments(owner.accessToken, taskId, '?page=abc&limit=xyz');

                expect(response.status).not.toBe(500);
            });
        });
    });
});