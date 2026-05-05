import { TaskRepository } from '../repositories/task_repository';
import { TaskDTO } from '../dto/task_dto';
import { ProjectRepository } from '../repositories/project_repository';
import { Task_entity } from '../entities/task_entity';
import { parseFlexibleDate } from '../utils/dateparser'
import { TaskPermission } from '../enums/Taskpermission_enum';
import { Task_assignment_Repository } from '../repositories/task_assignment_repository';
import { getPagination } from '../utils/pagination';
import { logger } from '../lib/logger';
import { AuditAction } from '../enums/auditActions';
import { auditLog } from '../utils/auditlogs';

export class Task_Service {
    private TaskRepository: typeof TaskRepository;
    private ProjectRepository: typeof ProjectRepository;
    private Task_assignment_Repository: typeof Task_assignment_Repository;

    constructor() {
        this.TaskRepository = TaskRepository;
        this.ProjectRepository = ProjectRepository;
        this.Task_assignment_Repository = Task_assignment_Repository;
    }

    async createTask(createTaskDTO: TaskDTO, projectId: number, userId: number) {
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

            logger.debug({ project }, 'Project fetched');

            if (!project) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Project not found',
                    data: null

                }
                return response;


            }

            // Ensure project has a user
            if (!project.user) {
                let response = {
                    status_code: 500,
                    status: 'failed',
                    message: 'Project user not found',
                    data: null
                }
                return response;
            }

            // Check if task already exists in this project
            const existingTask = await this.TaskRepository.findOne({
                where: {
                    title: createTaskDTO.title,
                    project: { project_id: projectId },
                    is_deleted: false,
                },
            });
            logger.debug({ existingTask }, 'Existing task fetched');

            if (existingTask) {
                return {
                    status_code: 409,
                    status: 'failed',
                    message: `Task with title "${createTaskDTO.title}" already exists in this project`,
                    data: null
                };
            }


            let dueDate: Date | null = null;
            if (createTaskDTO.dueDate) {
                dueDate = parseFlexibleDate(createTaskDTO.dueDate);
                logger.debug({ dueDate }, 'Due date parsed');

                if (!dueDate) {
                    logger.error({ dueDate: createTaskDTO.dueDate }, 'Invalid date format');
                    return {
                        status_code: 400,
                        status: 'failed',
                        message: 'Invalid date format. Accepted formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY',
                        data: null
                    };
                }
            }




            const newTask = new Task_entity();
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

            logger.debug({ newTask }, 'New task created');

            await this.TaskRepository.save(newTask);


            auditLog({
                action: AuditAction.TASK_CREATED,
                userId: userId,
                resource: "Task",
                resourceId: String(newTask.task_id),
                metadata: {
                    title: newTask.title,
                    description: newTask.description,
                    dueDate: newTask.dueDate,
                    status: newTask.status,
                    project_id: projectId
                }
            });

            const ownerAssignment = this.Task_assignment_Repository.create({
                task: newTask,
                user: project.user,
                permission: TaskPermission.OWNER,
            })

            await this.Task_assignment_Repository.save(ownerAssignment);

            logger.info({ taskId: newTask.task_id, userId, projectId }, 'Task created successfully');
            return newTask;
        } catch (error) {
            logger.error({ err: error, userId, projectId }, 'Error creating task');
            throw error; // Or return a service response
        }
    }

    async getAllTasks(projectId: number, userId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);
        try {
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

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Tasks retrieved successfully',
                data: tasks,
                meta: {
                    total,
                    page: currentPage,
                    limit: pageSize,
                    totalPages: Math.ceil(total / pageSize),
                },
            }
            return response;

        } catch (error) {
            logger.error({ err: error, userId, projectId }, 'Error retrieving all tasks');
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
            logger.error({ err: error, taskId, userId }, 'Error retrieving task by ID');
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
                }
            });

            logger.debug({ task }, 'Task fetched');

            if (!task) {
                let response = {
                    status_code: 404,
                    status: 'failed',
                    message: 'Task not found',
                    data: null
                }
                logger.debug({ response }, 'Task not found');
                return response;
            }



            if (updateData.title) {
                task.title = updateData.title;
                logger.debug({ task }, 'Task title updated');
            }
            if (updateData.description) {
                task.description = updateData.description;
                logger.debug({ task }, 'Task description updated');
            }
            if (updateData.status) {
                task.status = updateData.status;
                logger.debug({ task }, 'Task status updated');
            }
            if (updateData.dueDate) {
                const parsedDate = parseFlexibleDate(updateData.dueDate);
                if (parsedDate) {
                    task.dueDate = parsedDate;
                }
            }

            task.updated_at = new Date();

            await this.TaskRepository.save(task);

            logger.info({ taskId, userId }, 'Task updated successfully');

            auditLog({
                action: AuditAction.TASK_UPDATED,
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

            let response = {
                status_code: 200,
                status: 'success',
                message: 'Task updated successfully',
                data: task
            }
            return response;
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error updating task');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async deleteTask(taskId: number, userId: number) {
        try {
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

            logger.debug('task found')
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

            logger.info({ taskId, userId }, 'Task soft deleted');
            let response = {
                status_code: 200,
                status: 'success',
                message: 'Task deleted successfully',
                data: null
            }
            return response;
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error deleting task');
            return {
                status_code: 500,
                status: 'failed',
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }

    async restoreTask(taskId: number, userId: number) {
        try {
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

            logger.info({ taskId, userId }, 'Task restored');
            let response = {
                status_code: 200,
                message: 'Task restored successfully',
                data: restoreTask
            }
            return response;
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error restoring task');
            return {
                status_code: 500,
                message: 'Internal server error',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                data: null
            };
        }
    }
}
