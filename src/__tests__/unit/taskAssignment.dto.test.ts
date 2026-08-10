import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AssignTaskDTO } from '../../dto/assign_task_dto';
import { TaskPermission } from '../../enums/Taskpermission_enum';

describe('AssignTaskDTO validation', () => {
    const validateDto = async (payload: object) => {
        const dto = plainToInstance(AssignTaskDTO, payload);
        return validate(dto);
    };

    it('passes with a valid email and permission', async () => {
        const errors = await validateDto({ email: 'teammate@example.com', permission: TaskPermission.EDIT });
        expect(errors.length).toBe(0);
    });

    it('passes with a valid email and no permission (optional field)', async () => {
        const errors = await validateDto({ email: 'teammate@example.com' });
        expect(errors.length).toBe(0);
    });

    describe('email field', () => {
        it('rejects an invalid email format', async () => {
            const errors = await validateDto({ email: 'not-an-email' });
            expect(errors.length).toBeGreaterThan(0);
        });

        it('rejects a missing email', async () => {
            const errors = await validateDto({ permission: TaskPermission.VIEW });
            expect(errors.length).toBeGreaterThan(0);
        });

        it('rejects an empty email string', async () => {
            const errors = await validateDto({ email: '' });
            expect(errors.length).toBeGreaterThan(0);
        });

        it('trims and lowercases the email before validating', async () => {
            const dto = plainToInstance(AssignTaskDTO, { email: '  Teammate@EXAMPLE.com  ' });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
            expect(dto.email).toBe('teammate@example.com');
        });
    });

    describe('permission field', () => {
        it('accepts VIEW', async () => {
            const errors = await validateDto({ email: 'teammate@example.com', permission: TaskPermission.VIEW });
            expect(errors.length).toBe(0);
        });

        it('accepts EDIT', async () => {
            const errors = await validateDto({ email: 'teammate@example.com', permission: TaskPermission.EDIT });
            expect(errors.length).toBe(0);
        });

        it('rejects OWNER — ownership is not grantable through regular assignment', async () => {
            const errors = await validateDto({ email: 'teammate@example.com', permission: TaskPermission.OWNER });
            expect(errors.length).toBeGreaterThan(0);
        });

        it('rejects an invalid/unknown permission value', async () => {
            const errors = await validateDto({ email: 'teammate@example.com', permission: 'not_a_real_permission' });
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});