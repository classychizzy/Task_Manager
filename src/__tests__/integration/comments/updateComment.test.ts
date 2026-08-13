import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Update Comment Integration Tests', () => {
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

    // NOTE: route path assumed to match deleteComment's action-first
    // convention (/delete/:commentId), so /update/:commentId. Confirm
    // against your actual route registration.
    const updateComment = (accessToken: string, commentId: number | string, content: string) => {
        return request(server)
            .put(`/api/v1/comments/update/${commentId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ content });
    };

    describe('PUT /comments/update/:commentId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .put('/api/v1/comments/update/1')
                .send({ content: 'Updated' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should let a user update their own comment', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const created = await createComment(owner.accessToken, taskId, 'Original content');
            const commentId = created.body.data.comment_id;

            const response = await updateComment(owner.accessToken, commentId, 'Updated content')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Comment updated successfully');
            expect(response.body.data.content).toBe('Updated content');
        });

        it('should update the updated_at timestamp', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const created = await createComment(owner.accessToken, taskId, 'Original content');
            const commentId = created.body.data.comment_id;
            const originalUpdatedAt = created.body.data.updated_at;

            await new Promise((resolve) => setTimeout(resolve, 50));

            const response = await updateComment(owner.accessToken, commentId, 'Changed content');

            expect(new Date(response.body.data.updated_at).getTime())
                .toBeGreaterThan(new Date(originalUpdatedAt).getTime());
        });

        it('should return 404 when trying to update someone else\'s comment', async () => {
            const owner = await createAuthenticatedUser();
            const otherUser = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: otherUser.email, permission: 'view' });
            const created = await createComment(owner.accessToken, taskId, 'Owner comment');
            const commentId = created.body.data.comment_id;

            const response = await updateComment(otherUser.accessToken, commentId, 'Hijacked content')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should not actually change the content when attempted by another user', async () => {
            const owner = await createAuthenticatedUser();
            const otherUser = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: otherUser.email, permission: 'view' });
            const created = await createComment(owner.accessToken, taskId, 'Protected content');
            const commentId = created.body.data.comment_id;

            await updateComment(otherUser.accessToken, commentId, 'Hijacked content');

            const list = await request(server)
                .get(`/api/v1/comments/task/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`);

            const found = list.body.data.find((c: any) => c.comment_id === commentId);
            expect(found.content).toBe('Protected content');
        });

        it('should return 404 for a non-existent comment', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await updateComment(accessToken, 999999, 'Does not matter')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should reject an empty content update via DTO validation', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const created = await createComment(owner.accessToken, taskId, 'Original content');
            const commentId = created.body.data.comment_id;

            const response = await updateComment(owner.accessToken, commentId, '')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should reject a whitespace-only content update', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const created = await createComment(owner.accessToken, taskId, 'Original content');
            const commentId = created.body.data.comment_id;

            const response = await updateComment(owner.accessToken, commentId, '    ')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should not crash on a non-numeric comment id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await updateComment(accessToken, 'abc', 'Does not matter');

            expect(response.status).not.toBe(500);
        });
    });
});