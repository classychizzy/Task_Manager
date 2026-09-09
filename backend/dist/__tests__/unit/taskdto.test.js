"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const task_dto_1 = require("../../dto/task_dto");
const TaskStatus_enum_1 = require("../../enums/TaskStatus_enum");
const securitypayload_1 = require("../helpers/securitypayload");
describe('TaskDTO validation', () => {
    const validPayload = {
        title: 'Finish the quarterly report',
        description: 'Complete all sections and submit by end of day.',
        dueDate: '2027-03-15T00:00:00.000Z',
    };
    const validateDto = async (payload) => {
        const dto = (0, class_transformer_1.plainToInstance)(task_dto_1.TaskDTO, payload);
        return (0, class_validator_1.validate)(dto);
    };
    it('passes with a valid payload', async () => {
        const errors = await validateDto(validPayload);
        expect(errors.length).toBe(0);
    });
    it('passes with a valid optional status included', async () => {
        const errors = await validateDto({ ...validPayload, status: TaskStatus_enum_1.TaskStatus.PENDING });
        expect(errors.length).toBe(0);
    });
    it('passes without status (optional field)', async () => {
        const payload = { ...validPayload };
        const errors = await validateDto(payload);
        expect(errors.length).toBe(0);
    });
    describe('title field', () => {
        it('rejects a title shorter than 5 characters', async () => {
            const errors = await validateDto({ ...validPayload, title: 'abc' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('rejects a title with no letters', async () => {
            const errors = await validateDto({ ...validPayload, title: '123456' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('rejects a missing title', async () => {
            const payload = { ...validPayload };
            delete payload.title;
            const errors = await validateDto(payload);
            expect(errors.length).toBeGreaterThan(0);
        });
        it('trims leading/trailing whitespace before validating', async () => {
            const dto = (0, class_transformer_1.plainToInstance)(task_dto_1.TaskDTO, { ...validPayload, title: '  Padded Title  ' });
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBe(0);
            expect(dto.title).toBe('Padded Title');
        });
        it.each(securitypayload_1.sqlInjectionPayloads)('rejects SQL injection payload: %s', async (payload) => {
            const errors = await validateDto({ ...validPayload, title: payload });
            expect(errors.length).toBeGreaterThan(0);
        });
        it.each(securitypayload_1.xssPayloads)('rejects XSS payload: %s', async (payload) => {
            const errors = await validateDto({ ...validPayload, title: payload });
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    describe('description field', () => {
        it('rejects a description shorter than 15 characters', async () => {
            const errors = await validateDto({ ...validPayload, description: 'too short' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('accepts a description with numbers and punctuation', async () => {
            const errors = await validateDto({
                ...validPayload,
                description: 'Deploy by March 15, 2027 - budget is $500 (approved)!',
            });
            expect(errors.length).toBe(0);
        });
        it('rejects a missing description', async () => {
            const payload = { ...validPayload };
            delete payload.description;
            const errors = await validateDto(payload);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    describe('dueDate field', () => {
        it('rejects an empty due date', async () => {
            const errors = await validateDto({ ...validPayload, dueDate: '' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('rejects a missing due date', async () => {
            const payload = { ...validPayload };
            delete payload.dueDate;
            const errors = await validateDto(payload);
            expect(errors.length).toBeGreaterThan(0);
        });
    });
    describe('status field', () => {
        it('rejects an invalid status value', async () => {
            const errors = await validateDto({ ...validPayload, status: 'NOT_A_REAL_STATUS' });
            expect(errors.length).toBeGreaterThan(0);
        });
        it('accepts each defined TaskStatus enum value', async () => {
            for (const status of Object.values(TaskStatus_enum_1.TaskStatus)) {
                const errors = await validateDto({ ...validPayload, status });
                expect(errors.length).toBe(0);
            }
        });
    });
});
