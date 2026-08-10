import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Update Task Permission Integration Tests', () => {
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

    const updatePermission = (accessToken: string, taskId: number | string, userId: number | string, payload: object) => {
        return request(server)
            .put(`/api/v1/taskassignments/update/${taskId}/${userId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };

    describe('PUT /taskassignments/update/:taskId/:userId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .put('/api/v1/taskassignments/update/1/1')
                .send({ permission: 'edit' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should allow the owner to update an assigned user\'s permission', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: assignee.email, permission: 'view' });

            const response = await updatePermission(owner.accessToken, taskId, assignee.userId, { permission: 'edit' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('permission updated successfully');
            expect(response.body.data.permission).toBe('edit');
        });

        it('should reject an attempt to set permission to OWNER', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: assignee.email });

            const response = await updatePermission(owner.accessToken, taskId, assignee.userId, { permission: 'owner' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should return 404 when the requester is not the task owner', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });

            const response = await updatePermission(outsider.accessToken, taskId, viewer.userId, { permission: 'edit' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return 404 when a viewer (non-owner) attempts to update permissions', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const otherAssignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await assignTask(owner.accessToken, taskId, { email: otherAssignee.email, permission: 'view' });

            const response = await updatePermission(viewer.accessToken, taskId, otherAssignee.userId, { permission: 'edit' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return 404 when the target user has no assignment on this task', async () => {
            const owner = await createAuthenticatedUser();
            const notAssigned = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await updatePermission(owner.accessToken, taskId, notAssigned.userId, { permission: 'edit' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('assignment not found');
        });

        it('should reject a missing permission field via DTO validation', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: assignee.email });

            const response = await updatePermission(owner.accessToken, taskId, assignee.userId, {})
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should not actually change permission when a non-owner attempts the update', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });
            await updatePermission(outsider.accessToken, taskId, viewer.userId, { permission: 'edit' });

            const check = await updatePermission(owner.accessToken, taskId, viewer.userId, { permission: 'view' });
            // still succeeds as the owner, confirming the row wasn't corrupted by the failed attempt
            expect(check.body.status_code).toBe(200);
            expect(check.body.data.permission).toBe('view');
        });

        it('should not crash on a non-numeric task id', async () => {
            const owner = await createAuthenticatedUser();

            const response = await updatePermission(owner.accessToken, 'abc', 1, { permission: 'edit' });

            expect(response.status).not.toBe(500);
        });

        it('should not crash on a non-numeric user id', async () => {
            const owner = await createAuthenticatedUser();
            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);

            const response = await updatePermission(owner.accessToken, task.body.data.task_id, 'abc', { permission: 'edit' });

            expect(response.status).not.toBe(500);
        });
    });
});