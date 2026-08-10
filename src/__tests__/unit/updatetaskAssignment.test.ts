import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateTaskPermissionDTO } from '../../dto/updateAssign_task_dto';
import { TaskPermission } from '../../enums/Taskpermission_enum';

describe('UpdateTaskPermissionDTO validation', () => {
    const validateDto = async (payload: object) => {
        const dto = plainToInstance(UpdateTaskPermissionDTO, payload);
        return validate(dto);
    };

    it('passes with VIEW', async () => {
        const errors = await validateDto({ permission: TaskPermission.VIEW });
        expect(errors.length).toBe(0);
    });

    it('passes with EDIT', async () => {
        const errors = await validateDto({ permission: TaskPermission.EDIT });
        expect(errors.length).toBe(0);
    });

    it('rejects OWNER — ownership cannot be granted through a permission update', async () => {
        const errors = await validateDto({ permission: TaskPermission.OWNER });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a missing permission', async () => {
        const errors = await validateDto({});
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an empty string permission', async () => {
        const errors = await validateDto({ permission: '' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects an unknown/invalid permission value', async () => {
        const errors = await validateDto({ permission: 'not_a_real_permission' });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects extra/unexpected fields', async () => {
        const dto = plainToInstance(UpdateTaskPermissionDTO, {
            permission: TaskPermission.VIEW,
            userId: 99999, // should not be settable via body — comes from route param
        });
        const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
        expect(errors.length).toBeGreaterThan(0);
    });
});