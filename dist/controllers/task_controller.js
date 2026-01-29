"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task_Controller = void 0;
const express_1 = require("express");
const task_service_1 = require("../services/task_service");
class Task_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.Task_Service = new task_service_1.Task_Service();
        this.initializeRoutes();
    }
    async createTask(req, res) {
        const userId = req.user.id;
        const projectId = req.body.projectId;
        const task = await this.Task_Service.createTask(req.body, projectId, userId);
        let response = {
            status_code: '201',
            message: 'Task created successfully',
            data: task
        };
        return res.json(response);
    }
    async getAllTasks(req, res) {
        const userId = req.user.id;
        const projectId = req.params.projectId;
        const task = await this.Task_Service.getAllTasks(Number(projectId), userId);
        console.log("Auth user", req.user);
        let response = {
            status_code: '200',
            message: 'Tasks retrieved successfully',
            data: task
        };
        return res.json(response);
    }
    async getTaskById(req, res) {
        const userId = req.user.id;
        const taskId = req.params.taskId;
        // console.log("GET TASK - User ID:", userId, "Task ID:", taskId);
        const task = await this.Task_Service.getTaskById(Number(taskId), userId);
        console.log("Service result:", task);
        console.log("About to send response...");
        let response = {
            status_code: '200',
            message: 'Task retrieved successfully',
            data: task
        };
        //  console.log("=== CONTROLLER END ===");
        return res.json(response);
    }
    async UpdateTask(req, res) {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);
        let response = {
            status_code: '200',
            message: 'Task updated successfully',
            data: result
        };
        return res.json(response);
    }
    async DeleteTask(req, res) {
        // console.log("we start here")
        const taskId = req.params.taskId;
        // console.log("Task ID:", taskId)
        const userId = req.user.id;
        const result = await this.Task_Service.deleteTask(Number(taskId), userId);
        console.log("GET TASK - User ID:", userId, "Task ID:", taskId);
        let response = {
            status_code: '200',
            message: 'Task deleted successfully',
            data: result
        };
        return res.json(response);
    }
    async restoreTask(req, res) {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const result = await this.Task_Service.restoreTask(Number(taskId), userId);
        let response = {
            status_code: '200',
            message: 'Task restored successfully',
            data: result
        };
        return res.json(response);
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
