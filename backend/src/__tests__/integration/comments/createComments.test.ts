import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Create Comment Integration Tests', () => {
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

    // NOTE: route path assumed. Adjust to match your actual comment router.
    const createComment = (accessToken: string, taskId: number | string, payload: object) => {
        return request(server)
            .post(`/api/v1/comments/create/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };

    describe('POST /comments/create/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .post('/api/v1/comments/create/1')
                .send({ content: 'A comment' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should let the task owner create a comment', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await createComment(owner.accessToken, taskId, { content: 'Looks good to me!' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Comment created successfully');
            expect(response.body.data.content).toBe('Looks good to me!');
        });

        it('should let an assigned VIEW-permission user create a comment', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });

            const response = await createComment(viewer.accessToken, taskId, { content: 'Adding my thoughts' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(201);
        });

        it('should return 404 for a non-existent task', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await createComment(accessToken, 999999, { content: 'A comment' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('Task not found');
        });

        it('should return 404 (not 403) when commenting on a task the user has no relationship to', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await createComment(outsider.accessToken, taskId, { content: 'Sneaky comment' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should not create a comment when attempted by an unrelated user', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await createComment(outsider.accessToken, taskId, { content: 'Sneaky comment' });

            const verify = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            const comments = verify.body.data.comments || [];
            const found = comments.find((c: any) => c.content === 'Sneaky comment');
            expect(found).toBeUndefined();
        });

        it('should return 404 for a soft-deleted task', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await request(server)
                .delete(`/api/v1/tasks/${taskId}/delete`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            const response = await createComment(owner.accessToken, taskId, { content: 'Too late' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should reject an empty comment via DTO validation', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await createComment(owner.accessToken, taskId, { content: '' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should reject a whitespace-only comment', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await createComment(owner.accessToken, taskId, { content: '    ' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should accept free-text content including punctuation, numbers, and emoji', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const content = 'Cost is ~$500 (see invoice #123) — approved @ 90%! 🎉';
            const response = await createComment(owner.accessToken, taskId, { content });
            console.log('STATUS:', response.status);
            console.log('BODY:', response.text);

            expect(response.body.status_code).toBe(201);
            expect(response.body.data.content).toBe(content);
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await createComment(accessToken, 'abc', { content: 'A comment' });

            expect(response.status).not.toBe(500);
        });
    });
});