import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';

describe('Get Assignments For Other User Integration Tests', () => {
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

    const getAssignmentsForOtherUser = (accessToken: string, targetUserId: number | string) => {
        return request(server)
            .get(`/api/v1/taskassignments/assignments/user/${targetUserId}`)
            .set('Authorization', `Bearer ${accessToken}`);
    };

    describe('GET /taskassignments/assignments/user/:userId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .get('/api/v1/taskassignments/assignments/user/1')
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should let a requester see a target user\'s assignments on tasks the requester owns', async () => {
            const owner = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id, { title: 'Shared Task' });
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: target.email, permission: 'view' });

            const response = await getAssignmentsForOtherUser(owner.accessToken, target.userId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('user assignments retrieved successfully');
            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].task.task_id).toBe(taskId);
        });

        it('should only include tasks the requester owns, not tasks the target is assigned to elsewhere', async () => {
            const ownerA = await createAuthenticatedUser();
            const ownerB = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();

            const projectA = await createProject(ownerA.accessToken, { name: `Project A ${Date.now()}` });
            const projectB = await createProject(ownerB.accessToken, { name: `Project B ${Date.now()}` });

            const taskA = await createTask(ownerA.accessToken, projectA.body.data.project_id, { title: 'Owner A Task' });
            const taskB = await createTask(ownerB.accessToken, projectB.body.data.project_id, { title: 'Owner B Task' });

            await assignTask(ownerA.accessToken, taskA.body.data.task_id, { email: target.email });
            await assignTask(ownerB.accessToken, taskB.body.data.task_id, { email: target.email });

            const response = await getAssignmentsForOtherUser(ownerA.accessToken, target.userId)
                .expect('Content-Type', /json/);

            expect(response.body.data.length).toBe(1);
            expect(response.body.data[0].task.task_id).toBe(taskA.body.data.task_id);
        });

        it('should return 404 when the requester shares no tasks with the target user', async () => {
            const requester = await createAuthenticatedUser();
            const otherOwner = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();

            const project = await createProject(otherOwner.accessToken);
            const task = await createTask(otherOwner.accessToken, project.body.data.project_id);
            await assignTask(otherOwner.accessToken, task.body.data.task_id, { email: target.email });

            const response = await getAssignmentsForOtherUser(requester.accessToken, target.userId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should return the identical 404 whether the target has zero assignments or just none shared with the requester', async () => {
            const requester = await createAuthenticatedUser();
            const otherOwner = await createAuthenticatedUser();
            const targetWithNoAssignments = await createAuthenticatedUser();
            const targetWithUnsharedAssignment = await createAuthenticatedUser();

            const project = await createProject(otherOwner.accessToken);
            const task = await createTask(otherOwner.accessToken, project.body.data.project_id);
            await assignTask(otherOwner.accessToken, task.body.data.task_id, { email: targetWithUnsharedAssignment.email });

            const noAssignmentsRes = await getAssignmentsForOtherUser(requester.accessToken, targetWithNoAssignments.userId);
            const unsharedRes = await getAssignmentsForOtherUser(requester.accessToken, targetWithUnsharedAssignment.userId);

            expect(noAssignmentsRes.body.status_code).toBe(unsharedRes.body.status_code);
            expect(noAssignmentsRes.body.message).toBe(unsharedRes.body.message);
        });

        it('should not include soft-deleted assignments in the shared results', async () => {
            const owner = await createAuthenticatedUser();
            const target = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: target.email });
            await request(server)
                .delete(`/api/v1/taskassignments/remove/${taskId}`)
                .set('Authorization', `Bearer ${owner.accessToken}`)
                .send({ userId: target.userId });

            const response = await getAssignmentsForOtherUser(owner.accessToken, target.userId)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should not crash on a non-numeric target user id', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await getAssignmentsForOtherUser(accessToken, 'abc');

            expect(response.status).not.toBe(500);
        });
    });
});