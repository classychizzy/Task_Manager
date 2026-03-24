"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment_Controller = void 0;
const task_assignments_service_1 = require("../services/task_assignments_service");
const express_1 = require("express");
const logger_1 = require("../lib/logger");
class TaskAssignment_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.taskAssignmentService = new task_assignments_service_1.TaskAssignment_Service();
        this.initializeRoutes();
    }
    async AssignUsertoTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.user.id;
            logger_1.logger.debug({ taskId, userId }, 'AssignUsertoTask called');
            const result = await this.taskAssignmentService.AssignUsertoTask(req.body, Number(taskId), userId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in AssignUsertoTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async UpdatePermission(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.params.userId; // Get userId from URL params
            const requesterId = req.user.id;
            const permission = req.body?.permission;
            logger_1.logger.debug({ taskId, userId, requesterId, permission }, 'UpdatePermission called');
            // Validate required fields
            if (!permission) {
                return res.status(400).json({
                    status_code: 400,
                    status: 'failed',
                    message: 'Permission is required',
                    data: null
                });
            }
            const result = await this.taskAssignmentService.UpdatePermission(permission, Number(taskId), Number(userId), requesterId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in UpdatePermission');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getUserTaskPermission(req, res) {
        try {
            let taskid = req.params.taskId;
            let userid = req.user.id;
            logger_1.logger.debug({ taskid, userid }, 'getUserTaskPermission called');
            const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);
            let response = {
                status_code: '200',
                message: 'User permission retrieved successfully',
                data: result
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getUserTaskPermission');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async removeUserFromTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user.id; //id of the user i.e ownerremoving the user
            const userId = req.body.userId; //id of the user to be removed
            logger_1.logger.debug({ taskId, requesterId, userId }, 'removeUserFromTask called');
            const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId), Number(userId), requesterId);
            let response = {
                status_code: '200',
                message: 'User removed from task successfully',
                data: result
            };
            return res.json(response);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in removeUserFromTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getTaskAssignments(req, res) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user.id;
            logger_1.logger.debug({ taskId, requesterId }, 'getTaskAssignments called');
            const result = await this.taskAssignmentService.getTaskAssignments(Number(taskId), requesterId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getTaskAssignments');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getUserassignedtasks(req, res) {
        try {
            const userId = req.user.id; // Current user's own tasks
            logger_1.logger.debug({ userId }, 'getUserassignedtasks called');
            const result = await this.taskAssignmentService.getUserassignedtasks(userId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getUserassignedtasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getAssignmentsForOtherUser(req, res) {
        try {
            //retest this endpoint
            const requesterId = req.user.id;
            const targetUserId = req.params.userId;
            logger_1.logger.debug({ requesterId, targetUserId }, 'getAssignmentsForOtherUser called');
            if (!targetUserId) {
                return res.status(400).json({
                    status_code: 400,
                    status: 'failed',
                    message: 'Target User ID is required',
                    data: null
                });
            }
            const result = await this.taskAssignmentService.getAssignmentsForOtherUser(Number(targetUserId), requesterId);
            return res.status(result.status_code).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getAssignmentsForOtherUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async bulkAssignUsers(req, res) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user.id;
            const assignments = req.body.assignments;
            logger_1.logger.debug({ taskId, requesterId, assignmentCount: assignments?.length }, 'bulkAssignUsers called');
            if (!Array.isArray(assignments)) {
                return res.status(400).json({
                    status_code: 400,
                    status: 'failed',
                    message: 'Invalid request format. "assignments" must be an array.',
                    data: null
                });
            }
            const result = await this.taskAssignmentService.bulkAssignUsers(assignments, Number(taskId), requesterId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in bulkAssignUsers');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async TransferOwnership(req, res) {
        try {
            const taskId = req.params.taskId;
            const requestUserId = req.user.id; // The user making the request
            const presentOwnerId = req.body.presentOwnerId; // Usually the same as requestUserId
            const newOwnerId = req.body.newOwnerId;
            logger_1.logger.info({ taskId, requestUserId, presentOwnerId, newOwnerId }, 'TransferOwnership called');
            const result = await this.taskAssignmentService.TransferOwnership(requestUserId, Number(taskId), presentOwnerId, newOwnerId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in TransferOwnership');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/assign/:taskId', this.AssignUsertoTask.bind(this));
        this.router.put('/update/:taskId/:userId', this.UpdatePermission.bind(this));
        this.router.get('/permission/:taskId', this.getUserTaskPermission.bind(this));
        this.router.delete('/remove/:taskId', this.removeUserFromTask.bind(this));
        this.router.get('/assignments/:taskId', this.getTaskAssignments.bind(this));
        this.router.get('/assignedtasks', this.getUserassignedtasks.bind(this));
        this.router.get('/assignments/user/:userId', this.getAssignmentsForOtherUser.bind(this));
        this.router.post('/bulkassign/:taskId', this.bulkAssignUsers.bind(this));
        this.router.put('/transfer/:taskId', this.TransferOwnership.bind(this));
    }
}
exports.TaskAssignment_Controller = TaskAssignment_Controller;
