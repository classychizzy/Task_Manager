"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Service = void 0;
const task_repository_1 = require("../repositories/task_repository");
const project_repository_1 = require("../repositories/project_repository");
const task_entity_1 = require("../entities/task_entity");
const dateparser_1 = require("../utils/dateparser");
const Taskpermission_enum_1 = require("../enums/Taskpermission_enum");
const task_assignment_repository_1 = require("../repositories/task_assignment_repository");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../lib/logger");
const auditActions_1 = require("../enums/auditActions");
const auditlogs_1 = require("../utils/auditlogs");
const responsehelper_1 = require("../utils/responsehelper");
const TaskStatus_enum_1 = require("../enums/TaskStatus_enum");
class Task_Service {
    constructor() {
        this.TaskRepository = task_repository_1.TaskRepository;
        this.ProjectRepository = project_repository_1.ProjectRepository;
        this.Task_assignment_Repository = task_assignment_repository_1.Task_assignment_Repository;
    }
    async createTask(createTaskDTO, projectId, userId) {
        try {
            // Verify project exists and belongs to the user before creating a task
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    user: { user_id: userId },
                    is_deleted: false,
                },
                relations: ["user"]
            });
            logger_1.logger.debug({ project }, 'Project fetched');
            if (!project) {
                return (0, responsehelper_1.errorResponse)(404, "project not found");
            }
            // Ensure project has a user
            if (!project.user) {
                return (0, responsehelper_1.errorResponse)(500, "project user not found");
            }
            logger_1.logger.info({ project }, 'Project fetched successfully');
            // Check if task already exists in this project
            const existingTask = await this.TaskRepository.findOne({
                where: {
                    title: createTaskDTO.title,
                    project: { project_id: projectId },
                    is_deleted: false,
                },
            });
            logger_1.logger.debug({ existingTask }, 'Existing task fetched');
            if (existingTask) {
                return (0, responsehelper_1.errorResponse)(409, "task with this title already exists in this project");
            }
            let dueDate = null;
            //make sure date is in isoformat
            if (createTaskDTO.dueDate) {
                dueDate = (0, dateparser_1.parseFlexibleDate)(createTaskDTO.dueDate);
                logger_1.logger.debug({ dueDate }, 'Due date parsed');
                if (!dueDate) {
                    logger_1.logger.error({ dueDate: createTaskDTO.dueDate }, 'Invalid date format');
                    return (0, responsehelper_1.errorResponse)(400, "invalid date format, use YYYY-MM-DD format");
                }
            }
            const newTask = new task_entity_1.Task_entity();
            newTask.title = createTaskDTO.title;
            newTask.description = createTaskDTO.description;
            if (dueDate) {
                newTask.dueDate = dueDate;
            }
            // Default status to pending if not provided, or handle as per your DTO
            newTask.status = createTaskDTO.status || TaskStatus_enum_1.TaskStatus.PENDING;
            newTask.project = project;
            newTask.User = project.user;
            newTask.user_id = project.user.user_id;
            logger_1.logger.debug({ newTask }, 'New task created');
            await this.TaskRepository.save(newTask);
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.TASK_CREATED,
                userId: userId,
                resource: "Task",
                resourceId: String(newTask.task_id),
                metadata: {
                    title: newTask.title,
                    description: newTask.description,
                    dueDate: newTask.dueDate,
                    status: newTask.status,
                    task_id: newTask.task_id,
                    project_id: projectId
                }
            });
            const ownerAssignment = this.Task_assignment_Repository.create({
                task: newTask,
                user: project.user,
                permission: Taskpermission_enum_1.TaskPermission.OWNER,
            });
            await this.Task_assignment_Repository.save(ownerAssignment);
            logger_1.logger.info({ taskId: newTask.task_id, userId, projectId }, 'Task created successfully');
            return (0, responsehelper_1.successResponse)(201, "Task created successfully", newTask);
        }
        catch (error) {
            logger_1.logger.error({ err: error, userId, projectId }, 'Error creating task');
            return (0, responsehelper_1.errorResponse)(500, "unable to create task");
        }
    }
    async getAllTasks(projectId, userId, page, limit) {
        const { skip, take, page: currentPage, limit: pageSize } = (0, pagination_1.getPagination)(page, limit);
        try {
            const project = await this.ProjectRepository.findOne({
                where: {
                    project_id: projectId,
                    user: {
                        user_id: userId
                    }
                }
            });
            if (!project) {
                return (0, responsehelper_1.errorResponse)(404, "project not found");
            }
            const [tasks, total] = await this.TaskRepository.findAndCount({
                where: {
                    is_deleted: false,
                    project: {
                        project_id: projectId,
                        user: {
                            user_id: userId
                        }
                    }
                },
                relations: ["project"],
                skip,
                take,
                order: {
                    created_at: 'DESC'
                }
            });
            return (0, responsehelper_1.successResponse)(200, "tasks retrieved successfully", tasks, {
                total,
                page: currentPage,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            });
        }
        catch (error) {
            logger_1.logger.error({ err: error, userId, projectId }, 'Error retrieving all tasks');
            return (0, responsehelper_1.errorResponse)(500, "unable to retrieve tasks");
        }
    }
    async getTaskById(taskId, userId) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }
            });
            if (!assignment) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false,
                },
                relations: ["project"]
            });
            if (!task) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            return (0, responsehelper_1.successResponse)(200, "task retrieved successfully", task);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error retrieving task by ID');
            return (0, responsehelper_1.errorResponse)(500, "unable to retrieve task");
        }
    }
    async updateTask(taskId, userId, updateData) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false
                }
            });
            if (!assignment || (assignment.permission !== Taskpermission_enum_1.TaskPermission.EDIT && assignment.permission !== Taskpermission_enum_1.TaskPermission.OWNER)) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false,
                }
            });
            if (!task) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            if (updateData.title) {
                task.title = updateData.title;
            }
            if (updateData.description) {
                task.description = updateData.description;
            }
            if (updateData.status) {
                task.status = updateData.status;
            }
            if (updateData.dueDate) {
                const parsedDate = (0, dateparser_1.parseFlexibleDate)(updateData.dueDate);
                if (!parsedDate) {
                    return (0, responsehelper_1.errorResponse)(400, "invalid date format");
                }
                task.dueDate = parsedDate;
            }
            task.updated_at = new Date();
            await this.TaskRepository.save(task);
            (0, auditlogs_1.auditLog)({
                action: auditActions_1.AuditAction.TASK_UPDATED,
                userId: userId,
                resource: "Task",
                resourceId: String(task.task_id),
                metadata: {
                    updatedFields: {
                        title: task.title,
                        description: task.description,
                        status: task.status,
                        dueDate: task.dueDate,
                    }
                }
            });
            return (0, responsehelper_1.successResponse)(200, "task updated successfully", task);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error updating task');
            return (0, responsehelper_1.errorResponse)(500, "unable to update task");
        }
    }
    async deleteTask(taskId, userId) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                    permission: Taskpermission_enum_1.TaskPermission.OWNER
                }
            });
            if (!assignment) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                }
            });
            if (!task) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            if (task.is_deleted) {
                return (0, responsehelper_1.errorResponse)(409, "task already deleted");
            }
            task.is_deleted = true;
            task.updated_at = new Date();
            await this.TaskRepository.save(task);
            logger_1.logger.info({ taskId, userId }, 'Task soft deleted');
            return (0, responsehelper_1.successResponse)(200, "task deleted successfully", null);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error deleting task');
            return (0, responsehelper_1.errorResponse)(500, "unable to delete task");
        }
    }
    async restoreTask(taskId, userId) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                    permission: Taskpermission_enum_1.TaskPermission.OWNER
                }
            });
            if (!assignment) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            const restoreTask = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId
                }
            });
            if (!restoreTask) {
                return (0, responsehelper_1.errorResponse)(404, "task not found");
            }
            if (!restoreTask.is_deleted) {
                return (0, responsehelper_1.errorResponse)(409, "task is not deleted");
            }
            restoreTask.is_deleted = false;
            restoreTask.deleted_at = null;
            restoreTask.updated_at = new Date();
            await this.TaskRepository.save(restoreTask);
            logger_1.logger.info({ taskId, userId }, 'Task restored');
            return (0, responsehelper_1.successResponse)(200, "task restored successfully", restoreTask);
        }
        catch (error) {
            logger_1.logger.error({ err: error, taskId, userId }, 'Error restoring task');
            return (0, responsehelper_1.errorResponse)(500, "unable to restore task");
        }
    }
}
exports.Task_Service = Task_Service;
