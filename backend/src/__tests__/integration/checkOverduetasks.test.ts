import { handleTaskCron } from '../../jobs/cronjobs';
import AppDataSource from '../../ormconfig';
import { Task_entity } from '../../entities/task_entity';
import { User_entity } from '../../entities/user_entity';
import { TaskStatus } from '../../enums/TaskStatus_enum';
import { TestDbHelper, generateTestUser } from '../helpers/db.helper';

beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
});

afterAll(async () => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
});

describe('handleTaskCron Integration Tests', () => {
    it('should mark overdue pending tasks as OVERDUE', async () => {
        const repo = AppDataSource.getRepository(Task_entity);
        const userRepo = AppDataSource.getRepository(User_entity);
        const user = await userRepo.save(generateTestUser());

        // seed an overdue task
        await repo.save({
            title: 'Overdue task',
            status: TaskStatus.PENDING,
            dueDate: new Date('2020-01-01'), // past date
            is_notified: false,
            User: user
        });

        await handleTaskCron();

        const updated = await repo.findOne({ where: { title: 'Overdue task' } });
        expect(updated?.status).toBe(TaskStatus.OVERDUE);
        expect(updated?.is_notified).toBe(false); // Overdue tasks don't get the is_notified flag set
    });

    it('should mark upcoming tasks as notified', async () => {
        const repo = AppDataSource.getRepository(Task_entity);
        const userRepo = AppDataSource.getRepository(User_entity);
        const user = await userRepo.save(generateTestUser());

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

        await repo.save({
            title: 'Upcoming task',
            status: TaskStatus.PENDING,
            dueDate: tomorrow, // due in 12 hours
            is_notified: false,
            User: user
        });

        await handleTaskCron();

        const updated = await repo.findOne({ where: { title: 'Upcoming task' } });
        expect(updated?.is_notified).toBe(true);
    });

    it('should not mark future tasks as notified', async () => {
        const repo = AppDataSource.getRepository(Task_entity);
        const userRepo = AppDataSource.getRepository(User_entity);
        const user = await userRepo.save(generateTestUser());

        await repo.save({
            title: 'Future task',
            status: TaskStatus.PENDING,
            dueDate: new Date('2099-01-01'), // future date, > 24 hours
            is_notified: false,
            User: user
        });

        await handleTaskCron();

        const unchanged = await repo.findOne({ where: { title: 'Future task' } });
        expect(unchanged?.is_notified).toBe(false);
    });
});