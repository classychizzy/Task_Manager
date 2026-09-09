"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupSoftDeletedRecords = exports.handleTaskCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const task_repository_1 = require("../repositories/task_repository");
const TaskStatus_enum_1 = require("../enums/TaskStatus_enum");
const typeorm_1 = require("typeorm");
const logger_1 = require("../lib/logger");
const project_repository_1 = require("../repositories/project_repository");
const user_repository_1 = require("../repositories/user_repository");
const handleTaskCron = async () => {
    logger_1.logger.info('Running cron job to handle task updates and notifications');
    const now = new Date();
    // 1. Update overdue tasks
    const overdueTasks = await task_repository_1.TaskRepository.find({
        where: {
            dueDate: (0, typeorm_1.LessThan)(now),
            status: TaskStatus_enum_1.TaskStatus.PENDING
        },
    });
    for (const task of overdueTasks) {
        task.status = TaskStatus_enum_1.TaskStatus.OVERDUE;
        await task_repository_1.TaskRepository.save(task);
    }
    logger_1.logger.info(`Updated ${overdueTasks.length} tasks to overdue`);
    // 2. Send notifications for upcoming tasks (due in the next 24 hours)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingTasks = await task_repository_1.TaskRepository.find({
        where: {
            dueDate: (0, typeorm_1.Between)(now, tomorrow),
            status: (0, typeorm_1.In)([TaskStatus_enum_1.TaskStatus.PENDING, TaskStatus_enum_1.TaskStatus.IN_PROGRESS]),
            is_notified: false
        },
        relations: ['User']
    });
    for (const task of upcomingTasks) {
        // Placeholder for real notification service (e.g., Email, Push)
        logger_1.logger.info(`Notification: Task "${task.title}" for user ${task.User.email} is due soon (Due Date: ${task.dueDate})`);
        task.is_notified = true;
        await task_repository_1.TaskRepository.save(task);
    }
    logger_1.logger.info(`Sent notifications for ${upcomingTasks.length} upcoming tasks`);
};
exports.handleTaskCron = handleTaskCron;
/**
 * Clean up soft-deleted records older than 30 days
 */
const cleanupSoftDeletedRecords = async () => {
    logger_1.logger.info('Running cron job to clean up soft-deleted records');
    const thresholdDate = new Date();
    //permanently delete records older than 30 days
    thresholdDate.setDate(thresholdDate.getDate() - 30);
    try {
        // 1. Permanently delete tasks
        const deletedTasks = await task_repository_1.TaskRepository.delete({
            is_deleted: true,
            deleted_at: (0, typeorm_1.LessThan)(thresholdDate)
        });
        logger_1.logger.info(`Permanently deleted ${deletedTasks.affected} soft-deleted tasks`);
        // 2. Permanently delete projects
        const deletedProjects = await project_repository_1.ProjectRepository.delete({
            is_deleted: true,
            deleted_at: (0, typeorm_1.LessThan)(thresholdDate)
        });
        logger_1.logger.info(`Permanently deleted ${deletedProjects.affected} soft-deleted projects`);
        // 3. Permanently delete users
        const deletedUsers = await user_repository_1.UserRepository.delete({
            is_deleted: true,
            deleted_at: (0, typeorm_1.LessThan)(thresholdDate)
        });
        logger_1.logger.info(`Permanently deleted ${deletedUsers.affected} soft-deleted users`);
    }
    catch (error) {
        logger_1.logger.error({ err: error }, 'Error during soft-delete cleanup');
    }
};
exports.cleanupSoftDeletedRecords = cleanupSoftDeletedRecords;
//condition to prevent jobs from interfering with tests
if (process.env.NODE_ENV !== 'test') {
    // Handle task updates and notifications - Run every day at midnight
    node_cron_1.default.schedule('0 0 * * *', exports.handleTaskCron);
    // Clean up soft-deleted records - Run every day at 1 AM
    node_cron_1.default.schedule('0 1 * * *', exports.cleanupSoftDeletedRecords);
}
