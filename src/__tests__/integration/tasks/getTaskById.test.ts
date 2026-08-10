import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get Task By Id Integration Tests', () => {
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

    describe('GET /api/v1/tasks/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/tasks/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should retrieve a task belonging to the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'My Own Task' });
            const taskId = created.body.data.task_id;

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('task retrieved successfully');
            expect(response.body.data.task_id).toBe(taskId);
            expect(response.body.data.title).toBe('My Own Task');
        });

        it('should return 404 (not 403) when requesting a task from another user\'s project', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'User A Task' });
            const taskId = created.body.data.task_id;

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('task not found');
        });

        it('should return 404 for a non-existent task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .get('/api/v1/tasks/999999')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return the same 404 message for both "not yours" and "does not exist" (no enumeration leak)', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;

            const notYoursRes = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userB.accessToken}`);

            const doesNotExistRes = await request(server)
                .get('/api/v1/tasks/999999')
                .set('Authorization', `Bearer ${userB.accessToken}`);

            expect(notYoursRes.body.status_code).toBe(doesNotExistRes.body.status_code);
            expect(notYoursRes.body.message).toBe(doesNotExistRes.body.message);
        });

        it('should let a VIEW-permission assignee retrieve the task', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await request(server)
                .post(`/api/v1/taskassignments/assign/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({ email: viewer.email, permission: 'view' });

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${viewer.accessToken}`);


            console.log('STATUS:', response.status);
            console.log('BODY:', response.text);
            expect(response.body.status_code).toBe(200);


        });

        it('should return 404 for a soft-deleted task', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'To Be Deleted' });
            const taskId = created.body.data.task_id;

            await request(server)
                .delete(`/api/v1/tasks/${taskId}/delete`)
                .set('Authorization', `Bearer ${accessToken}`);

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .get('/api/v1/tasks/abc')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).not.toBe(500);
        });
    });
});