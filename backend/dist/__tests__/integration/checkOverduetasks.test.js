"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cronjobs_1 = require("../../jobs/cronjobs");
const ormconfig_1 = __importDefault(require("../../ormconfig"));
const task_entity_1 = require("../../entities/task_entity");
const user_entity_1 = require("../../entities/user_entity");
const TaskStatus_enum_1 = require("../../enums/TaskStatus_enum");
const db_helper_1 = require("../helpers/db.helper");
beforeAll(async () => {
    if (!ormconfig_1.default.isInitialized) {
        await ormconfig_1.default.initialize();
    }
});
afterAll(async () => {
    if (ormconfig_1.default.isInitialized) {
        await ormconfig_1.default.destroy();
    }
});
describe('handleTaskCron Integration Tests', () => {
    it('should mark overdue pending tasks as OVERDUE', async () => {
        const repo = ormconfig_1.default.getRepository(task_entity_1.Task_entity);
        const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
        const user = await userRepo.save((0, db_helper_1.generateTestUser)());
        // seed an overdue task
        await repo.save({
            title: 'Overdue task',
            status: TaskStatus_enum_1.TaskStatus.PENDING,
            dueDate: new Date('2020-01-01'), // past date
            is_notified: false,
            User: user
        });
        await (0, cronjobs_1.handleTaskCron)();
        const updated = await repo.findOne({ where: { title: 'Overdue task' } });
        expect(updated?.status).toBe(TaskStatus_enum_1.TaskStatus.OVERDUE);
        expect(updated?.is_notified).toBe(false); // Overdue tasks don't get the is_notified flag set
    });
    it('should mark upcoming tasks as notified', async () => {
        const repo = ormconfig_1.default.getRepository(task_entity_1.Task_entity);
        const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
        const user = await userRepo.save((0, db_helper_1.generateTestUser)());
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
        await repo.save({
            title: 'Upcoming task',
            status: TaskStatus_enum_1.TaskStatus.PENDING,
            dueDate: tomorrow, // due in 12 hours
            is_notified: false,
            User: user
        });
        await (0, cronjobs_1.handleTaskCron)();
        const updated = await repo.findOne({ where: { title: 'Upcoming task' } });
        expect(updated?.is_notified).toBe(true);
    });
    it('should not mark future tasks as notified', async () => {
        const repo = ormconfig_1.default.getRepository(task_entity_1.Task_entity);
        const userRepo = ormconfig_1.default.getRepository(user_entity_1.User_entity);
        const user = await userRepo.save((0, db_helper_1.generateTestUser)());
        await repo.save({
            title: 'Future task',
            status: TaskStatus_enum_1.TaskStatus.PENDING,
            dueDate: new Date('2099-01-01'), // future date, > 24 hours
            is_notified: false,
            User: user
        });
        await (0, cronjobs_1.handleTaskCron)();
        const unchanged = await repo.findOne({ where: { title: 'Future task' } });
        expect(unchanged?.is_notified).toBe(false);
    });
});
