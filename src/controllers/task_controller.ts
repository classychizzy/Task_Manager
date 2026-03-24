import { Router, Request, Response } from 'express';
import { Task_Service } from '../services/task_service';
import { AuthenticatedRequest } from '../types/express/auth-request';
import { logger } from '../lib/logger';

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
            const projectId = req.body.projectId;
            logger.debug({ userId, projectId }, 'createTask called');
            const task = await this.Task_Service.createTask(req.body, projectId, userId);
            let response = {
                status_code: '201',
                message: 'Task created successfully',
                data: task

            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in createTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getAllTasks(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const projectId = req.params.projectId;
            logger.debug({ userId, projectId }, 'getAllTasks called');
            const { page, limit } = req.query;

            const taskResponse = await this.Task_Service.getAllTasks(
                Number(projectId),
                userId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );

            return res.json(taskResponse);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getAllTasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getTaskById(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id;
            const taskId = req.params.taskId;
            logger.debug({ userId, taskId }, 'getTaskById called');
            const task = await this.Task_Service.getTaskById(Number(taskId), userId);

            let response = {
                status_code: '200',
                message: 'Task retrieved successfully',
                data: task
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getTaskById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async UpdateTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'UpdateTask called');
            const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);

            let response = {
                status_code: '200',
                message: 'Task updated successfully',
                data: result
            }

            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in UpdateTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async DeleteTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'DeleteTask called');
            const result = await this.Task_Service.deleteTask(Number(taskId), userId);

            let response = {
                status_code: '200',
                message: 'Task deleted successfully',
                data: result
            }

            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in DeleteTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async restoreTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'restoreTask called');
            const result = await this.Task_Service.restoreTask(Number(taskId), userId);

            let response = {
                status_code: '200',
                message: 'Task restored successfully',
                data: result
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in restoreTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    private initializeRoutes() {
        this.router.post('/create', this.createTask.bind(this));
        this.router.get('/all/:projectId', this.getAllTasks.bind(this));
        this.router.get('/:taskId', this.getTaskById.bind(this));
        this.router.put('/:taskId/update', this.UpdateTask.bind(this));
        this.router.delete('/:taskId/delete', this.DeleteTask.bind(this));
        this.router.put('/:taskId/restore', this.restoreTask.bind(this));



    }
}