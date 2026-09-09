import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get Task Assignments Integration Tests', () => {
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

    const getTaskAssignments = (accessToken: string, taskId: number | string, query = '') => {
        return request(server)
            .get(`/api/v1/taskassignments/assignments/${taskId}${query}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('GET /taskassignments/assignments/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/taskassignments/assignments/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should let the owner view all assignments on their task', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const editor = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await assignTask(owner.accessToken, taskId, { email: editor.email, permission: 'edit' });

            const response = await getTaskAssignments(owner.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBe(3); // owner + viewer + editor
            expect(response.body.meta.total).toBe(3);
        });

        it('should let an assigned viewer see the assignment list too', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });

            const response = await getTaskAssignments(viewer.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
        });

        it('should not include the user\'s password in the assignment list', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await getTaskAssignments(owner.accessToken, taskId);

            expect(response.body.data[0].user).not.toHaveProperty('password');
        });

        it('should return 404 when the requester has no assignment on the task', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await getTaskAssignments(outsider.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 for a non-existent task', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getTaskAssignments(accessToken, 999999)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should not include soft-deleted assignments', async () => {
            const owner = await createAuthenticatedUser();
            const removedUser = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: removedUser.email });
            await request(server)
                .delete(`/api/v1/taskassignments/remove/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({ userId: removedUser.userId });

            const response = await getTaskAssignments(owner.accessToken, taskId);

            const found = response.body.data.find((a: any) => a.user.user_id === removedUser.userId);
            expect(found).toBeUndefined();
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getTaskAssignments(accessToken, 'abc');

            expect(response.status).not.toBe(500);
        });

        describe('pagination', () => {
            it('should respect an explicit limit', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                for (let i = 0; i < 5; i++) {
                    const assignee = await createAuthenticatedUser();
                    await assignTask(owner.accessToken, taskId, { email: assignee.email });
                }

                const response = await getTaskAssignments(owner.accessToken, taskId, '?page=1&limit=2')
                    .expect('Content-Type', /json/);

                expect(response.body.data.length).toBe(2);
                expect(response.body.meta.total).toBe(6); // owner + 5 assigned
                expect(response.body.meta.totalPages).toBe(3);
            });

            it('should apply default pagination when no page/limit given', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                const response = await getTaskAssignments(owner.accessToken, taskId)
                    .expect('Content-Type', /json/);

                expect(response.body.meta.page).toBeGreaterThanOrEqual(1);
                expect(response.body.meta.limit).toBeGreaterThan(0);
            });

            it('should return an empty array for a page beyond available results', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                const response = await getTaskAssignments(owner.accessToken, taskId, '?page=999&limit=10')
                    .expect('Content-Type', /json/);

                expect(response.body.status_code).toBe(200);
                expect(response.body.data).toEqual([]);
            });

            it('should not crash on non-numeric page/limit query params', async () => {
                const owner = await createAuthenticatedUser();
                const project = await createProject(owner.accessToken);
                const task = await createTask(owner.accessToken, project.body.data.project_id);
                const taskId = task.body.data.task_id;

                const response = await getTaskAssignments(owner.accessToken, taskId, '?page=abc&limit=xyz');

                expect(response.status).not.toBe(500);
            });
        });
    });
});