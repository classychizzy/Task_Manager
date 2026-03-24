"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Controller = void 0;
const express_1 = require("express");
const task_service_1 = require("../services/task_service");
const logger_1 = require("../lib/logger");
class Task_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.Task_Service = new task_service_1.Task_Service();
        this.initializeRoutes();
    }
    async createTask(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.body.projectId;
            logger_1.logger.debug({ userId, projectId }, 'createTask called');
            const task = await this.Task_Service.createTask(req.body, projectId, userId);
            let response = {
                status_code: '201',
                message: 'Task created successfully',
                data: task
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in createTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getAllTasks(req, res) {
        try {
            const userId = req.user.id;
            const projectId = req.params.projectId;
            logger_1.logger.debug({ userId, projectId }, 'getAllTasks called');
            const { page, limit } = req.query;
            const taskResponse = await this.Task_Service.getAllTasks(Number(projectId), userId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
            return res.json(taskResponse);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getAllTasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getTaskById(req, res) {
        try {
            const userId = req.user.id;
            const taskId = req.params.taskId;
            logger_1.logger.debug({ userId, taskId }, 'getTaskById called');
            const task = await this.Task_Service.getTaskById(Number(taskId), userId);
            let response = {
                status_code: '200',
                message: 'Task retrieved successfully',
                data: task
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getTaskById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async UpdateTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'UpdateTask called');
            const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);
            let response = {
                status_code: '200',
                message: 'Task updated successfully',
                data: result
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in UpdateTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async DeleteTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'DeleteTask called');
            const result = await this.Task_Service.deleteTask(Number(taskId), userId);
            let response = {
                status_code: '200',
                message: 'Task deleted successfully',
                data: result
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in DeleteTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async restoreTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'restoreTask called');
            const result = await this.Task_Service.restoreTask(Number(taskId), userId);
            let response = {
                status_code: '200',
                message: 'Task restored successfully',
                data: result
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in restoreTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/create', this.createTask.bind(this));
        this.router.get('/all/:projectId', this.getAllTasks.bind(this));
        this.router.get('/:taskId', this.getTaskById.bind(this));
        this.router.put('/:taskId/update', this.UpdateTask.bind(this));
        this.router.delete('/:taskId/delete', this.DeleteTask.bind(this));
        this.router.put('/:taskId/restore', this.restoreTask.bind(this));
    }
}
exports.Task_Controller = Task_Controller;
