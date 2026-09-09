"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const updateAssign_task_dto_1 = require("../../dto/updateAssign_task_dto");
const Taskpermission_enum_1 = require("../../enums/Taskpermission_enum");
describe('UpdateTaskPermissionDTO validation', () => {
    const validateDto = async (payload) => {
        const dto = (0, class_transformer_1.plainToInstance)(updateAssign_task_dto_1.UpdateTaskPermissionDTO, payload);
        return (0, class_validator_1.validate)(dto);
    };
    it('passes with VIEW', async () => {
        const errors = await validateDto({ permission: Taskpermission_enum_1.TaskPermission.VIEW });
        expect(errors.length).toBe(0);
    });
    it('passes with EDIT', async () => {
        const errors = await validateDto({ permission: Taskpermission_enum_1.TaskPermission.EDIT });
        expect(errors.length).toBe(0);
    });
    it('rejects OWNER — ownership cannot be granted through a permission update', async () => {
        const errors = await validateDto({ permission: Taskpermission_enum_1.TaskPermission.OWNER });
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
        const dto = (0, class_transformer_1.plainToInstance)(updateAssign_task_dto_1.UpdateTaskPermissionDTO, {
            permission: Taskpermission_enum_1.TaskPermission.VIEW,
            userId: 99999, // should not be settable via body — comes from route param
        });
        const errors = await (0, class_validator_1.validate)(dto, { whitelist: true, forbidNonWhitelisted: true });
        expect(errors.length).toBeGreaterThan(0);
    });
});
