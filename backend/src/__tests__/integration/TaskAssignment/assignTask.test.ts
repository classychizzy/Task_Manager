import request from 'supertest';
import express from 'express';
import App from '../../../app';
import { generateTestUser } from '../../helpers/db.helper';
import AppDataSource from '../../../ormconfig';
import { Task_assignment_entity } from '../../../entities/Task_assignment_entity';

describe('Assign Task Integration Tests', () => {
    let app: App;
    let server: express.Application;

    beforeAll(async () => {
        app = new App();
        server = app.app;
    });

    const createAuthenticatedUser = async () => {
        const testUser = generateTestUser();

        const registerRes = await request(server).post('/api/v1/auth/register').send(testUser);

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

    const assignTask = (accessToken: string, taskId: number | string, payload: object) => {
        return request(server)
            .post(`/api/v1/taskassignments/assign/${taskId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(payload);
    };

    describe('POST /taskassignments/assign/:taskId', () => {
        it('should reject request without authentication', async () => {
            const response = await request(server)
                .post('/api/v1/taskassignments/assign/1')
                .send({ email: 'someone@example.com' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should allow the project owner to assign another user to a task', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('user assigned to task successfully');
        });

        it('should default permission to VIEW when not specified', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, { email: assignee.email });

            expect(response.body.data.permission).toBe('view');
        });

        it('should assign with EDIT permission when specified', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, {
                email: assignee.email,
                permission: 'edit',
            });

            expect(response.body.data.permission).toBe('edit');
        });

        it('should reject an attempt to assign with OWNER permission', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, {
                email: assignee.email,
                permission: 'owner',
            }).expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        it('should return 404 when the requester is not assigned to the task at all', async () => {
            const owner = await createAuthenticatedUser();
            const outsider = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(outsider.accessToken, taskId, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('you are not assigned to this task');
        });

        it('should return 404 when the requester has VIEW/EDIT but not OWNER permission', async () => {
            const owner = await createAuthenticatedUser();
            const viewer = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: viewer.email, permission: 'view' });

            const response = await assignTask(viewer.accessToken, taskId, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('only owners are permitted to assign tasks');
        });

        it('should return 404 for a non-existent task', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const response = await assignTask(owner.accessToken, 999999, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
        });

        it('should return 404 when the assignee email does not match any user', async () => {
            const owner = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, { email: 'nobody@example.com' })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(404);
            expect(response.body.message).toBe('user not found');
        });

        it('should return 409 when the user is already assigned to the task', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: assignee.email });

            const response = await assignTask(owner.accessToken, taskId, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(409);
            expect(response.body.message).toBe('user already assigned to this task');
        });
        it('should restore a soft-deleted assignment instead of creating a duplicate', async () => {
            const owner = await createAuthenticatedUser();
            const assignee = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            await assignTask(owner.accessToken, taskId, { email: assignee.email });

            const assignmentRepo = AppDataSource.getRepository(Task_assignment_entity);
            await assignmentRepo.update(
                { task: { task_id: taskId }, user: { user_id: assignee.userId } },
                { is_deleted: true }
            );

            const response = await assignTask(owner.accessToken, taskId, { email: assignee.email })
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(200);
            expect(response.body.message).toBe('user unarchived successfully');
        });
        it('should reject an invalid email format via DTO validation', async () => {
            const owner = await createAuthenticatedUser();

            const project = await createProject(owner.accessToken);
            const task = await createTask(owner.accessToken, project.body.data.project_id);
            const taskId = task.body.data.task_id;

            const response = await assignTask(owner.accessToken, taskId, { email: 'not-an-email' })
                .expect('Content-Type', /json/);
            console.log('STATUS:', response.status);
            console.log('BODY:', response.text);

            expect(response.body.status_code).toBe(400);
        });

        it('should not crash on a non-numeric task id', async () => {
            const owner = await createAuthenticatedUser();

            const response = await assignTask(owner.accessToken, 'abc', { email: 'someone@example.com' });

            expect(response.status).not.toBe(500);
        });
    });
});