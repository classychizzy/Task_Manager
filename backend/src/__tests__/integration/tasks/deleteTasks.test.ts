import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Delete Task Integration Tests', () => {
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

    describe('DELETE /api/v1/tasks/:taskId/delete', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .delete('/api/v1/tasks/1/delete')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should soft delete a task owned by the authenticated user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;

            const response = await deleteTask(accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('task deleted successfully');
            expect(response.body.data).toBeNull();
        });

        it('should make the task unreachable via get-by-id after deletion', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);

            const response = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.body.status_code).toBe(404);
        });

        it('should remove the task from the get-all list after deletion', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const projectId = project.body.data.project_id;
            const created = await createTask(accessToken, projectId, { title: 'Will Be Deleted' });
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);

            const response = await request(server)
                .get(`/api/v1/tasks/all/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.body.data.find((t: any) => t.task_id === taskId)).toBeUndefined();
        });

        it('should return 409 when trying to delete an already-deleted task', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const project = await createProject(accessToken);
            const created = await createTask(accessToken, project.body.data.project_id);
            const taskId = created.body.data.task_id;

            await deleteTask(accessToken, taskId);

            const response = await deleteTask(accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 (not 403) when deleting another user\'s task', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'User A Task' });
            const taskId = created.body.data.task_id;

            const response = await deleteTask(userB.accessToken, taskId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should not actually delete the task when attempted by a non-owner', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();

            const project = await createProject(userA.accessToken);
            const created = await createTask(userA.accessToken, project.body.data.project_id, { title: 'Protected Task' });
            const taskId = created.body.data.task_id;

            await deleteTask(userB.accessToken, taskId);

            const verify = await request(server)
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${userA.accessToken}`);

            expect(verify.body.status_code).toBe(200);
            expect(verify.body.data.title).toBe('Protected Task');
        });

        it('should return 404 for a non-existent task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await deleteTask(accessToken, 999999)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should not crash on a non-numeric task id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await deleteTask(accessToken, 'abc' as any);

            expect(response.status).not.toBe(500);
        });
    });
});
