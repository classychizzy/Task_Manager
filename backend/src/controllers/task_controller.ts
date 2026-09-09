import { Router, Response } from 'express';
import { Task_Service } from '../services/task_service';
import { AuthenticatedRequest } from '../types/express/auth-request';
import { logger } from '../lib/logger';
import { validateDto } from '../middlewares/validateDto';
import { TaskDTO } from '../dto/task_dto';
import { STATUS_CODES } from 'http';
import { UpdateTaskDTO } from '../dto/updateTask_dto';
import { strictAuthLimiter } from '../middlewares/ratelimiter';

export class Task_Controller {
    public router: Router;
    private Task_Service: Task_Service;

    constructor() {
        this.router = Router();
        this.Task_Service = new Task_Service();
        this.initializeRoutes();
    }

    public async createTask(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id
            const projectId = Number(req.params.projectId);
            logger.debug({ userId, projectId }, 'createTask called');

            if (isNaN(projectId)) {
                return res.status(400).json({ status: false, message: 'Invalid projectId' });
            }
            const task = await this.Task_Service.createTask(req.body, projectId, userId);

            return res.status(task.status_code || 201).json(task);


        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in createTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getAllTasks(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const projectId = Number(req.params.projectId);
            logger.debug({ userId, projectId }, 'getAllTasks called');

            if (isNaN(projectId)) {
                return res.status(400).json({ status: false, message: 'Invalid projectId' });
            }
            const { page, limit } = req.query;

            const taskResponse = await this.Task_Service.getAllTasks(
                Number(projectId),
                userId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );


            return res.status(taskResponse.status_code || 200).json(taskResponse);

        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getAllTasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getTaskById(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const taskId = Number(req.params.taskId);
            logger.debug({ userId, taskId }, 'getTaskById called');

            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const task = await this.Task_Service.getTaskById(Number(taskId), userId);

            return res.status(task.status_code || 200).json(task);

        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getTaskById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async UpdateTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'UpdateTask called');

            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);

            return res.status(result.status_code || 200).json(result);

        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in UpdateTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async DeleteTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'DeleteTask called');

            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.deleteTask(Number(taskId), userId);

            return res.status(result.status_code || 200).json(result);

        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in DeleteTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async restoreTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'restoreTask called');

            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.restoreTask(Number(taskId), userId);

            return res.status(result.status_code || 200).json(result);



        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in restoreTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    private initializeRoutes() {
        this.router.post('/create/:projectId', validateDto(TaskDTO), this.createTask.bind(this));
        this.router.get('/all/:projectId', this.getAllTasks.bind(this));
        this.router.get('/:taskId', this.getTaskById.bind(this));
        this.router.put('/:taskId/update', validateDto(UpdateTaskDTO), this.UpdateTask.bind(this));
        this.router.delete('/:taskId/delete', this.DeleteTask.bind(this));
        this.router.put('/:taskId/restore', this.restoreTask.bind(this));



    }
}