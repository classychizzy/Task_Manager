"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment_Controller = void 0;
const task_assignments_service_1 = require("../services/task_assignments_service");
const express_1 = require("express");
class TaskAssignment_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.taskAssignmentService = new task_assignments_service_1.TaskAssignment_Service();
        this.initializeRoutes();
    }
    async AssignUsertoTask(req, res) {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const result = await this.taskAssignmentService.AssignUsertoTask(req.body, Number(taskId), userId);
        let response = {
            status_code: '201',
            message: 'User assigned to task successfully',
            data: result
        };
        return res.json(response);
    }
    async UpdatePermission(req, res) {
        const taskId = req.params.taskId;
        const requesterId = req.user.id;
        const permission = req.body.permission;
        const userId = req.body.userId;
        const result = await this.taskAssignmentService.UpdatePermission(permission, Number(taskId), Number(userId), requesterId);
        let response = {
            status_code: '201',
            message: 'User permission updated successfully',
            data: result
        };
        return res.json(response);
    }
    async getUserTaskPermission(req, res) {
        let taskid = req.params.taskId;
        let userid = req.user.id;
        const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);
        let response = {
            status_code: '201',
            message: 'User permission retrieved successfully',
            data: result
        };
        return;
    }
    async removeUserFromTask(req, res) {
        const taskId = req.params.taskId;
        const requesterId = req.user.id;
        const userId = req.body.userId;
        const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId), Number(userId), requesterId);
        let response = {
            status_code: '201',
            message: 'User removed from task successfully',
            data: result
        };
        return res.json(response);
    }
    async getTaskAssignments(req, res) {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const result = await this.taskAssignmentService.getTaskAssignments(Number(taskId), userId);
        let response = {
            status_code: '201',
            message: 'Assignments retrieved successfully',
            data: result
        };
        return res.json(response);
    }
    async getUserassignedtasks(req, res) {
        const taskId = req.params.taskId;
        const userId = req.user.id;
        const result = await this.taskAssignmentService.getUserassignedtasks(userId);
        let response = {
            status_code: '201',
            message: 'Tasks retrieved successfully',
            data: result
        };
        return res.json(response);
    }
    async bulkAssignUsers(req, res) {
        const taskId = req.params.taskId;
        const requesterId = req.user.id;
        const result = await this.taskAssignmentService.bulkAssignUsers(req.body, Number(taskId), requesterId);
        let response = {
            status_code: '201',
            message: 'Users assigned to task successfully',
            data: result
        };
        return res.json(response);
    }
    async TransferOwnership(req, res) {
        const taskId = req.params.taskId;
        const presentOwnerId = req.user.id;
        const newOwnerId = req.body.newOwnerId;
        const result = await this.taskAssignmentService.TransferOwnership(newOwnerId, Number(taskId), presentOwnerId, newOwnerId);
        let response = {
            status_code: '201',
            message: 'Ownership transferred successfully',
            data: result
        };
        return res.json(response);
    }
    initializeRoutes() {
        this.router.post('/assign/:taskId', this.AssignUsertoTask.bind(this));
        this.router.put('/update/:taskId', this.UpdatePermission.bind(this));
        this.router.get('/permission/:taskId', this.getUserTaskPermission.bind(this));
        this.router.delete('/remove/:taskId', this.removeUserFromTask.bind(this));
        this.router.get('/assignments/:taskId', this.getTaskAssignments.bind(this));
        this.router.get('/assignedtasks', this.getUserassignedtasks.bind(this));
        this.router.post('/bulkassign/:taskId', this.bulkAssignUsers.bind(this));
        this.router.put('/transfer/:taskId', this.TransferOwnership.bind(this));
    }
}
exports.TaskAssignment_Controller = TaskAssignment_Controller;
