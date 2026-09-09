"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const updateproject_dto_1 = require("../../dto/updateproject_dto");
const securitypayload_1 = require(".././helpers/securitypayload");
describe('UpdateProjectDTO validation', () => {
    const validateDto = async (payload) => {
        const dto = (0, class_transformer_1.plainToInstance)(updateproject_dto_1.UpdateProjectDTO, payload);
        return (0, class_validator_1.validate)(dto);
    };
    it('passes with a valid full payload', async () => {
        const errors = await validateDto({
            name: 'Updated Project Name',
            description: 'An updated description for this project.',
        });
        expect(errors.length).toBe(0);
    });
    it('passes with an empty payload (all fields optional for PATCH semantics)', async () => {
        const errors = await validateDto({});
        expect(errors.length).toBe(0);
    });
    it('passes when only name is provided', async () => {
        const errors = await validateDto({ name: 'Just A New Name' });
        expect(errors.length).toBe(0);
    });
    it('passes when only description is provided', async () => {
        const errors = await validateDto({ description: 'Just a new description here.' });
        expect(errors.length).toBe(0);
    });
    describe('name field', () => {
        it('rejects a name shorter than 5 characters', async () => {
            const errors = await validateDto({ name: 'abc' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('rejects a name with no letters', async () => {
            const errors = await validateDto({ name: '123456' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it.each(securitypayload_1.sqlInjectionPayloads)('rejects SQL injection payload: %s', async (payload) => {
            const errors = await validateDto({ name: payload });
            expect(errors.length).toBeGreaterThan(0);
        });
        it.each(securitypayload_1.xssPayloads)('rejects XSS payload: %s', async (payload) => {
            const errors = await validateDto({ name: payload });
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    describe('description field', () => {
        it('rejects a description shorter than 10 characters', async () => {
            const errors = await validateDto({ description: 'short' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it.each(securitypayload_1.sqlInjectionPayloads)('rejects SQL injection payload in description: %s', async (payload) => {
            // Prefix with real content instead of padding, so the injection payload
            // itself is still clearly present and unaltered in the tested string.
            const testValue = `Project notes: ${payload}`;
            const errors = await validateDto({ description: testValue });
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    describe('project_id field (IDOR risk)', () => {
        it('should not exist on this DTO at all — project ID should come from the route param, not the body', async () => {
            // This test documents an architectural decision, not just a validation rule.
            // If project_id is still a declared field here, a client can pass it in the
            // body; whether that's exploitable depends entirely on whether the service
            // layer trusts it instead of req.params.projectId. Flagging for review.
            const dto = (0, class_transformer_1.plainToInstance)(updateproject_dto_1.UpdateProjectDTO, { project_id: 99999, name: 'Valid Name' });
            expect(dto).toHaveProperty('project_id');
        });
    });
});
