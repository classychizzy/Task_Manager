"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Controller = void 0;
const express_1 = require("express");
const task_service_1 = require("../services/task_service");
const logger_1 = require("../lib/logger");
const validateDto_1 = require("../middlewares/validateDto");
const task_dto_1 = require("../dto/task_dto");
const updateTask_dto_1 = require("../dto/updateTask_dto");
class Task_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.Task_Service = new task_service_1.Task_Service();
        this.initializeRoutes();
    }
    async createTask(req, res) {
        try {
            const userId = req.user.id;
            const projectId = Number(req.params.projectId);
            logger_1.logger.debug({ userId, projectId }, 'createTask called');
            if (isNaN(projectId)) {
                return res.status(400).json({ status: false, message: 'Invalid projectId' });
            }
            const task = await this.Task_Service.createTask(req.body, projectId, userId);
            return res.status(task.status_code || 201).json(task);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in createTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getAllTasks(req, res) {
        try {
            const userId = req.user.id;
            const projectId = Number(req.params.projectId);
            logger_1.logger.debug({ userId, projectId }, 'getAllTasks called');
            if (isNaN(projectId)) {
                return res.status(400).json({ status: false, message: 'Invalid projectId' });
            }
            const { page, limit } = req.query;
            const taskResponse = await this.Task_Service.getAllTasks(Number(projectId), userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
            return res.status(taskResponse.status_code || 200).json(taskResponse);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getAllTasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getTaskById(req, res) {
        try {
            const userId = req.user.id;
            const taskId = Number(req.params.taskId);
            logger_1.logger.debug({ userId, taskId }, 'getTaskById called');
            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const task = await this.Task_Service.getTaskById(Number(taskId), userId);
            return res.status(task.status_code || 200).json(task);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getTaskById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async UpdateTask(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'UpdateTask called');
            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in UpdateTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async DeleteTask(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'DeleteTask called');
            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.deleteTask(Number(taskId), userId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in DeleteTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async restoreTask(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'restoreTask called');
            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: 'Invalid taskId' });
            }
            const result = await this.Task_Service.restoreTask(Number(taskId), userId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in restoreTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/create/:projectId', (0, validateDto_1.validateDto)(task_dto_1.TaskDTO), this.createTask.bind(this));
        this.router.get('/all/:projectId', this.getAllTasks.bind(this));
        this.router.get('/:taskId', this.getTaskById.bind(this));
        this.router.put('/:taskId/update', (0, validateDto_1.validateDto)(updateTask_dto_1.UpdateTaskDTO), this.UpdateTask.bind(this));
        this.router.delete('/:taskId/delete', this.DeleteTask.bind(this));
        this.router.put('/:taskId/restore', this.restoreTask.bind(this));
    }
}
exports.Task_Controller = Task_Controller;
