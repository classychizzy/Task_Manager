import request from 'supertest';
import express from 'express';
import App from '../../../app';
import AppDataSource from '../../../ormconfig';
import { TestDbHelper, generateTestUser } from '../../helpers/db.helper';
import { sqlInjectionPayloads, xssPayloads } from '../../helpers/securitypayload';

describe('Project Integration Tests', () => {
    let app: App;
    let server: express.Application;

    beforeAll(async () => {
        app = new App();
        server = app.app;
        //initialize database if not already setup
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
    });


    // Helper: registers a user, logs in, and returns { accessToken, userId }
    // Reused by every test below since project creation requires authentication.
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

    const generateProjectPayload = (overrides?: any) => ({
        name: `Website Redesign ${Date.now()}`,
        description: 'Revamp the marketing site by Q4 2026.',
        ...overrides,
    });

    describe('POST /api/v1/projects/create', () => {
        it('DEBUG - see raw error', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload);

            console.log('STATUS:', response.status);
            console.log('BODY:', response.text);
        });

        it('should create a project successfully', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Project created successfully');
            expect(response.body.data).toHaveProperty('project_id');
            expect(response.body.data.name).toBe(payload.name);
            expect(response.body.data.description).toBe(payload.description);
        });

        it('should reject request without authentication', async () => {
            const payload = generateProjectPayload();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(401);
            expect(response.body.success).toBe(false);
        });

        // --- Input validation ---

        it('should reject a name shorter than 5 characters', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ name: 'abc' }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject a name with no letters (numbers only)', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ name: '123456' }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject a whitespace-only name', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ name: '     ' }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should trim leading/trailing whitespace from name', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload({ name: `  Padded Name ${Date.now()}  ` });

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(201);
            expect(response.body.data.name).toBe(payload.name.trim());
        });

        it('should reject a description shorter than 10 characters', async () => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ description: 'short' }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should accept a description containing numbers and punctuation', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload({
                description: 'Launch by March 15, 2027 - budget is $10,000!',
            });

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            // If this fails with 400, the description regex is still too restrictive
            expect(response.body.status_code).toBe(201);
        });

        it('should reject missing name', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload();
            delete (payload as any).name;

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject missing description', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload();
            delete (payload as any).description;

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should reject extra/unexpected fields (e.g. project_id in body)', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = { ...generateProjectPayload(), project_id: 99999 };

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
        });

        // --- Business logic ---

        it('should reject duplicate project (same name + description) for the same user', async () => {
            const { accessToken } = await createAuthenticatedUser();
            const payload = generateProjectPayload();

            await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload);

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload)
                .expect('Content-Type', /json/);



            expect(response.body.status_code).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Project already exists');
        });

        it('should allow two different users to create projects with the same name', async () => {
            const userA = await createAuthenticatedUser();
            const userB = await createAuthenticatedUser();
            const payload = generateProjectPayload();

            const resA = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${userA.accessToken}`)
                .send(payload);

            const resB = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${userB.accessToken}`)
                .send(payload);

            // This will fail until the duplicate check is scoped per-user (see write-up)
            expect(resA.body.status_code).toBe(201);
            expect(resB.body.status_code).toBe(201);
        });

        // --- Security ---

        it.each(sqlInjectionPayloads)('should reject SQL injection attempts in name: %s', async (payload) => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ name: payload }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it.each(xssPayloads)('should reject XSS attempts in name: %s', async (payload) => {
            const { accessToken } = await createAuthenticatedUser();

            const response = await request(server)
                .post('/api/v1/projects/create')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(generateProjectPayload({ name: payload }))
                .expect('Content-Type', /json/);

            expect(response.body.status_code).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});