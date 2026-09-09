import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TaskDTO } from '../../dto/task_dto';
import { TaskStatus } from '../../enums/TaskStatus_enum';
import { sqlInjectionPayloads, xssPayloads } from '../helpers/securitypayload';



describe('TaskDTO validation', () => {
    const validPayload = {
        title: 'Finish the quarterly report',
        description: 'Complete all sections and submit by end of day.',
        dueDate: '2027-03-15T00:00:00.000Z',
    };

    const validateDto = async (payload: object) => {
        const dto = plainToInstance(TaskDTO, payload);
        return validate(dto);
    };

    it('passes with a valid payload', async () => {
        const errors = await validateDto(validPayload);
        expect(errors.length).toBe(0);
    });

    it('passes with a valid optional status included', async () => {
        const errors = await validateDto({ ...validPayload, status: TaskStatus.PENDING });
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
            const payload = { ...validPayload } as any;
            delete payload.title;
            const errors = await validateDto(payload);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('trims leading/trailing whitespace before validating', async () => {
            const dto = plainToInstance(TaskDTO, { ...validPayload, title: '  Padded Title  ' });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.title).toBe('Padded Title');
        });

        it.each(sqlInjectionPayloads)('rejects SQL injection payload: %s', async (payload) => {
            const errors = await validateDto({ ...validPayload, title: payload });
            expect(errors.length).toBeGreaterThan(0);
        });

        it.each(xssPayloads)('rejects XSS payload: %s', async (payload) => {
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
            const payload = { ...validPayload } as any;
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
            const payload = { ...validPayload } as any;
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
            for (const status of Object.values(TaskStatus)) {
                const errors = await validateDto({ ...validPayload, status });
                expect(errors.length).toBe(0);
            }
        });
    });
});