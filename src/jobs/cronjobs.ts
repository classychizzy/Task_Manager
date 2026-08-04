import cron from 'node-cron';
import { TaskRepository } from '../repositories/task_repository';
import { TaskStatus } from '../enums/TaskStatus_enum';
import { LessThan, Between, In } from 'typeorm';
import { logger } from '../lib/logger';
import { ProjectRepository } from '../repositories/project_repository';
import { UserRepository } from '../repositories/user_repository';



export const handleTaskCron = async () => {
    logger.info('Running cron job to handle task updates and notifications');

    const now = new Date();

    // 1. Update overdue tasks
    const overdueTasks = await TaskRepository.find({
        where: {
            dueDate: LessThan(now),
            status: TaskStatus.PENDING
        },
    });

    for (const task of overdueTasks) {
        task.status = TaskStatus.OVERDUE;
        await TaskRepository.save(task);
    }
    logger.info(`Updated ${overdueTasks.length} tasks to overdue`);

    // 2. Send notifications for upcoming tasks (due in the next 24 hours)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingTasks = await TaskRepository.find({
        where: {
            dueDate: Between(now, tomorrow),
            status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
            is_notified: false
        },
        relations: ['User']
    });

    for (const task of upcomingTasks) {
        // Placeholder for real notification service (e.g., Email, Push)
        logger.info(`Notification: Task "${task.title}" for user ${task.User.email} is due soon (Due Date: ${task.dueDate})`);

        task.is_notified = true;
        await TaskRepository.save(task);
    }
    logger.info(`Sent notifications for ${upcomingTasks.length} upcoming tasks`);
};

/**
 * Clean up soft-deleted records older than 30 days
 */
export const cleanupSoftDeletedRecords = async () => {
    logger.info('Running cron job to clean up soft-deleted records');

    const thresholdDate = new Date();
    //permanently delete records older than 30 days
    thresholdDate.setDate(thresholdDate.getDate() - 30);

    try {
        // 1. Permanently delete tasks
        const deletedTasks = await TaskRepository.delete({
            is_deleted: true,
            deleted_at: LessThan(thresholdDate)
        });
        logger.info(`Permanently deleted ${deletedTasks.affected} soft-deleted tasks`);

        // 2. Permanently delete projects
        const deletedProjects = await ProjectRepository.delete({
            is_deleted: true,
            deleted_at: LessThan(thresholdDate)
        });
        logger.info(`Permanently deleted ${deletedProjects.affected} soft-deleted projects`);

        // 3. Permanently delete users
        const deletedUsers = await UserRepository.delete({
            is_deleted: true,
            deleted_at: LessThan(thresholdDate)
        });
        logger.info(`Permanently deleted ${deletedUsers.affected} soft-deleted users`);

    } catch (error) {
        logger.error({ err: error }, 'Error during soft-delete cleanup');
    }
};


//condition to prevent jobs from interfering with tests
if (process.env.NODE_ENV !== 'test') {
    // Handle task updates and notifications - Run every day at midnight
  cron.schedule('0 0 * * *', handleTaskCron);
  // Clean up soft-deleted records - Run every day at 1 AM
  cron.schedule('0 1 * * *', cleanupSoftDeletedRecords);
}

