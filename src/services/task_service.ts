import { TaskRepository } from '../repositories/task_repository';
import { TaskDTO} from '../dto/task_dto';
import { ProjectRepository } from '../repositories/project_repository';
import { Task_entity } from '../entities/task_entity';
import { stat } from 'fs';
import { create } from 'domain';

export class Task_Service {
    private TaskRepository: typeof TaskRepository;
    private ProjectRepository: typeof ProjectRepository;

    constructor() {
        this.TaskRepository = TaskRepository;
        this.ProjectRepository = ProjectRepository;
    }

    async createTask(createTaskDTO: TaskDTO, projectId: number, userId: number) {
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
            
            }
            return response;
        }

        const newTask = new Task_entity();
        newTask.title = createTaskDTO.title;
        newTask.description = createTaskDTO.description;
        newTask.dueDate = new Date(createTaskDTO.dueDate);
        // Default status to pending if not provided, or handle as per your DTO
        newTask.status = createTaskDTO.status || 'pending'; 
        newTask.project = project;

        await this.TaskRepository.save(newTask);
        return newTask;
    }

    async getAllTasks(projectId: number, userId: number) {
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
            }
            return response;

        } catch (error) {
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
            }
            return response;
        }
    }

    async getTaskById(taskId: number, userId: number) {
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
                }
                return response;
            }

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Task retrieved successfully',
                data: task
            }
            return response;

        } catch (error) {
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
            }
            return response;
        }
    }

    async updateTask(taskId: number, userId: number, updateData: TaskDTO) {
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
            }
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
        }
        return response;
    }

    async deleteTask(taskId: number, userId: number) {
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
            }
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
        }
        return response;
    }

    async restoreTask(taskId: number, userId: number) {
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
        })   
        
        if (!restoreTask) {
            let response = {
                status_code: 404,
                message: 'Task not found',
                data: null
            }
            return response

        }

        restoreTask.is_deleted = false;
        restoreTask.deleted_at = null
        restoreTask.updated_at = new Date();

        await this.TaskRepository.save(restoreTask);

        let response = {
            status_code: 200,
            message: 'Task restored successfully',
            data: restoreTask
        }
        return response;
    }
}
