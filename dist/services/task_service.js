"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Service = void 0;
const task_repository_1 = require("../repositories/task_repository");
const project_repository_1 = require("../repositories/project_repository");
const task_entity_1 = require("../entities/task_entity");
class Task_Service {
    constructor() {
        this.TaskRepository = task_repository_1.TaskRepository;
        this.ProjectRepository = project_repository_1.ProjectRepository;
    }
    async createTask(createTaskDTO, projectId, userId) {
        // Verify project exists and belongs to the user before creating a task
        const project = await this.ProjectRepository.findOne({
            where: {
                project_id: projectId,
                user: {
                    user_id: userId
                },
                is_deleted: false
            }
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
        const newTask = new task_entity_1.Task_entity();
        newTask.title = createTaskDTO.title;
        newTask.description = createTaskDTO.description;
        newTask.dueDate = new Date(createTaskDTO.dueDate);
        // Default status to pending if not provided, or handle as per your DTO
        newTask.status = createTaskDTO.status || 'pending';
        newTask.project = project;
        await this.TaskRepository.save(newTask);
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
            task.dueDate = new Date(updateData.dueDate);
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
