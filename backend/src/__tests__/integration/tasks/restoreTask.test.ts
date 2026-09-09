import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Restore Task Integration Tests', () => {
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

    const deleteTask = (accessToken: string, taskId: number) => {
        return request(server)
            .delete(`/api/v1/tasks/${taskId}/delete`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    const restoreTask = (accessToken: string, taskId: number) => {
        return request(server)
            .put(`/api/v1/tasks/${taskId}/restore`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('PUT /api/v1/tasks/:taskId/restore', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .put('/api/v1/tasks/1/restore')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should restore a soft-deleted task owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'Restore Me' });
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);

            const response = await restoreTask(accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('task restored successfully');
        });

        it('should make the task reachable via get-by-id again after restoration', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'Reappear Please' });
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);
            await restoreTask(accessToken, taskId);

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.body.status_code).toBe(200);
            expect(response.body.data.title).toBe('Reappear Please');
        });

        it('should reappear in the get-all list after restoration', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const created = await createTask(accessToken, projectId, { title: 'Back In The List' });
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);
            await restoreTask(accessToken, taskId);

            const response = await request(server)
                .get(`/api/v1/tasks/all/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.body.data.some((t: any) => t.task_id === taskId)).toBe(true);
        });

        it('should return 409 when trying to restore a task that is not deleted', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id, { title: 'Never Deleted' });
            const taskId = created.body.data.task_id;

            const response = await restoreTask(accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('task is not deleted');
        });

        it('should return 404 for a non-existent task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await restoreTask(accessToken, 999999)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return 404 (not 403) when restoring another user\'s deleted task', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'User A Deleted Task' });
            const taskId = created.body.data.task_id;

            await deleteTask(userA.accessToken, taskId);

            const response = await restoreTask(userB.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should not actually restore the task when attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'Stays Deleted' });
            const taskId = created.body.data.task_id;

            await deleteTask(userA.accessToken, taskId);
            await restoreTask(userB.accessToken, taskId);

            const verify = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);

            // Still soft-deleted from the real owner's perspective — the
            // non-owner's restore attempt must not have taken effect.
            expect(verify.body.status_code).toBe(404);
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await restoreTask(accessToken, 'abc' as any);

            expect(response.status).not.toBe(500);
        });
    });
});