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
import { successResponse, errorResponse } from '../utils/responsehelper';
import { TaskStatus } from '../enums/TaskStatus_enum';
import { UpdateTaskDTO } from '../dto/updateTask_dto';
import { permission } from 'process';

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
                return errorResponse(404, "project not found");


            }


            // Ensure project has a user
            if (!project.user) {
                return errorResponse(500, "project user not found");
            }

            logger.info({ project }, 'Project fetched successfully');
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
                return errorResponse(409, "task with this title already exists in this project");

            }


            let dueDate: Date | null = null;
            if (createTaskDTO.dueDate) {
                dueDate = parseFlexibleDate(createTaskDTO.dueDate);
                logger.debug({ dueDate }, 'Due date parsed');

                if (!dueDate) {
                    logger.error({ dueDate: createTaskDTO.dueDate }, 'Invalid date format');
                    return errorResponse(400, "invalid date format");
                }
            }




            const newTask = new Task_entity();
            newTask.title = createTaskDTO.title;
            newTask.description = createTaskDTO.description;
            if (dueDate) {
                newTask.dueDate = dueDate;
            }
            // Default status to pending if not provided, or handle as per your DTO
            newTask.status = createTaskDTO.status || TaskStatus.PENDING;
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
            return successResponse(201, "Task created successfully", newTask);
        } catch (error) {
            logger.error({ err: error, userId, projectId }, 'Error creating task');
            return errorResponse(500, "unable to create task");
        }
    }

    async getAllTasks(projectId: number, userId: number, page?: number, limit?: number) {
        const { skip, take, page: currentPage, limit: pageSize } = getPagination(page, limit);
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
                return errorResponse(404, "project not found");
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


            return successResponse(200, "tasks retrieved successfully", tasks, {
                total,
                page: currentPage,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),

            });

        } catch (error) {
            logger.error({ err: error, userId, projectId }, 'Error retrieving all tasks');


            return errorResponse(500, "unable to retrieve tasks");
        }
    }

    async getTaskById(taskId: number, userId: number) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                }
            });

            if (!assignment) {
                return errorResponse(404, "task not found");
            }

            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false,
                },
                relations: ["project"]
            });

            if (!task) {
                return errorResponse(404, "task not found");
            }

            return successResponse(200, "task retrieved successfully", task);

        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error retrieving task by ID');
            return errorResponse(500, "unable to retrieve task");
        }
    }

    async updateTask(taskId: number, userId: number, updateData: UpdateTaskDTO) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false
                }
            });

            if (!assignment || (assignment.permission !== TaskPermission.EDIT && assignment.permission !== TaskPermission.OWNER)) {
                return errorResponse(404, "task not found");
            }

            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                    is_deleted: false,
                }
            });

            if (!task) {
                return errorResponse(404, "task not found");
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
                const parsedDate = parseFlexibleDate(updateData.dueDate);
                if (!parsedDate) {
                    return errorResponse(400, "invalid date format");
                }
                task.dueDate = parsedDate;
            }

            task.updated_at = new Date();
            await this.TaskRepository.save(task);

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

            return successResponse(200, "task updated successfully", task);
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error updating task');
            return errorResponse(500, "unable to update task");
        }
    }

    async deleteTask(taskId: number, userId: number) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                    permission: TaskPermission.OWNER
                }
            });

            if (!assignment) {
                return errorResponse(404, "task not found");
            }

            const task = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId,
                }
            });

            if (!task) {
                return errorResponse(404, "task not found");
            }

            if (task.is_deleted) {
                return errorResponse(409, "task already deleted");
            }

            task.is_deleted = true;
            task.updated_at = new Date();
            await this.TaskRepository.save(task);

            logger.info({ taskId, userId }, 'Task soft deleted');
            return successResponse(200, "task deleted successfully", null);
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error deleting task');
            return errorResponse(500, "unable to delete task");
        }
    }
    async restoreTask(taskId: number, userId: number) {
        try {
            const assignment = await this.Task_assignment_Repository.findOne({
                where: {
                    task: { task_id: taskId },
                    user: { user_id: userId },
                    is_deleted: false,
                    permission: TaskPermission.OWNER
                }
            });

            if (!assignment) {
                return errorResponse(404, "task not found");
            }

            const restoreTask = await this.TaskRepository.findOne({
                where: {
                    task_id: taskId
                }
            });

            if (!restoreTask) {
                return errorResponse(404, "task not found");
            }

            if (!restoreTask.is_deleted) {
                return errorResponse(409, "task is not deleted");
            }

            restoreTask.is_deleted = false;
            restoreTask.deleted_at = null;
            restoreTask.updated_at = new Date();
            await this.TaskRepository.save(restoreTask);

            logger.info({ taskId, userId }, 'Task restored');
            return successResponse(200, "task restored successfully", restoreTask);
        } catch (error) {
            logger.error({ err: error, taskId, userId }, 'Error restoring task');
            return errorResponse(500, "unable to restore task");
        }
    }
}
