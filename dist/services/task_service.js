"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Service = void 0;
const task_repository_1 = require("../repositories/task_repository");
const project_repository_1 = require("../repositories/project_repository");
const task_entity_1 = require("../entities/task_entity");
const dateparser_1 = require("../utils/dateparser");
const Taskpermission_enum_1 = require("../enums/Taskpermission_enum");
const task_assignment_repository_1 = require("../repositories/task_assignment_repository");
class Task_Service {
    constructor() {
        this.TaskRepository = task_repository_1.TaskRepository;
        this.ProjectRepository = project_repository_1.ProjectRepository;
        this.Task_assignment_Repository = task_assignment_repository_1.Task_assignment_Repository;
    }
    async createTask(createTaskDTO, projectId, userId) {
        // Verify project exists and belongs to the user before creating a task
        const project = await this.ProjectRepository.findOne({
            where: {
                project_id: projectId,
                user: { user_id: userId },
                is_deleted: false,
            },
            relations: ["user"]
        });
        if (!project) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Project not found',
                data: null
            };
            return response;
        }
        // Ensure project has a user
        if (!project.user) {
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Project user not found',
                data: null
            };
            return response;
        }
        let dueDate = null;
        if (createTaskDTO.dueDate) {
            dueDate = (0, dateparser_1.parseFlexibleDate)(createTaskDTO.dueDate);
            if (!dueDate) {
                return {
                    status_code: 400,
                    status: 'failed',
                    message: 'Invalid date format. Accepted formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY',
                    data: null
                };
            }
        }
        const newTask = new task_entity_1.Task_entity();
        newTask.title = createTaskDTO.title;
        newTask.description = createTaskDTO.description;
        if (dueDate) {
            newTask.dueDate = dueDate;
        }
        // Default status to pending if not provided, or handle as per your DTO
        newTask.status = createTaskDTO.status || 'pending';
        newTask.project = project;
        newTask.User = project.user;
        newTask.user_id = project.user.user_id;
        await this.TaskRepository.save(newTask);
        const ownerAssignment = this.Task_assignment_Repository.create({
            task: newTask,
            user: project.user,
            permission: Taskpermission_enum_1.TaskPermission.OWNER,
        });
        await this.Task_assignment_Repository.save(ownerAssignment);
        return newTask;
    }
    async getAllTasks(projectId, userId) {
        try {
            const tasks = await this.TaskRepository.find({
                where: {
                    is_deleted: false,
                    project: {
                        project_id: projectId,
                        user: {
                            user_id: userId
                        }
                    }
                },
                relations: ["project"]
            });
            let response = {
                status_code: 200,
                status: 'success',
                message: 'Tasks retrieved successfully',
                data: tasks
            };
            return response;
        }
        catch (error) {
            let errorMessage = "unable to retrieve tasks";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return response;
        }
    }
    async getTaskById(taskId, userId) {
        try {
            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false,
                    project: {
                        user: {
                            user_id: userId
                        }
                    }
                },
                relations: ["project"]
            });
            if (!task) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Task not found',
                    data: null
                };
                return response;
            }
            let response = {
                status_code: 200,
                status: 'success',
                message: 'Task retrieved successfully',
                data: task
            };
            return response;
        }
        catch (error) {
            let errorMessage = "unable to retrieve task";
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            let response = {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error.',
                errorMessage: errorMessage,
                data: null
            };
            return response;
        }
    }
    async updateTask(taskId, userId, updateData) {
        const task = await this.TaskRepository.findOne({
            where: {
                task_id: taskId,
                is_deleted: false,
                project: {
                    user: {
                        user_id: userId
                    }
                }
            }
        });
        if (!task) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Task not found',
                data: null
            };
            return response;
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
            if (parsedDate) {
                task.dueDate = parsedDate;
            }
        }
        task.updated_at = new Date();
        await this.TaskRepository.save(task);
        let response = {
            status_code: 200,
            status: 'success',
            message: 'Task updated successfully',
            data: task
        };
        return response;
    }
    async deleteTask(taskId, userId) {
        const task = await this.TaskRepository.findOne({
            where: {
                task_id: taskId,
                project: {
                    user: {
                        user_id: userId
                    }
                }
            }
        });
        if (!task) {
            let response = {
                status_code: 404,
                status: 'failed',
                message: 'Task not found',
                data: null
            };
            return response;
        }
        // soft delete implementation
        // task.deleted_at = new Date();
        task.is_deleted = true;
        task.updated_at = new Date();
        await this.TaskRepository.save(task);
        let response = {
            status_code: 200,
            status: 'success',
            message: 'Task deleted successfully',
            data: null
        };
        return response;
    }
    async restoreTask(taskId, userId) {
        // Implementation placeholder matching Project_service
        let restoreTask = await this.TaskRepository.findOne({
            where: {
                task_id: taskId,
                is_deleted: true,
                project: {
                    user: {
                        user_id: userId
                    }
                }
            }
        });
        if (!restoreTask) {
            let response = {
                status_code: 404,
                message: 'Task not found',
                data: null
            };
            return response;
        }
        restoreTask.is_deleted = false;
        restoreTask.deleted_at = null;
        restoreTask.updated_at = new Date();
        await this.TaskRepository.save(restoreTask);
        let response = {
            status_code: 200,
            message: 'Task restored successfully',
            data: restoreTask
        };
        return response;
    }
}
exports.Task_Service = Task_Service;
