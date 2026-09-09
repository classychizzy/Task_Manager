"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAssignment_Controller = void 0;
const task_assignments_service_1 = require("../services/task_assignments_service");
const express_1 = require("express");
const logger_1 = require("../lib/logger");
const validateDto_1 = require("../middlewares/validateDto");
const assign_task_dto_1 = require("../dto/assign_task_dto");
const updateAssign_task_dto_1 = require("../dto/updateAssign_task_dto");
const bulkAssignUsers_dto_1 = require("../dto/bulkAssignUsers_dto");
const transferofOwnership_dto_1 = require("../dto/transferofOwnership_dto");
const RemoveUserFromTask_dto_1 = require("../dto/RemoveUserFromTask_dto");
class TaskAssignment_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.taskAssignmentService = new task_assignments_service_1.TaskAssignment_Service();
        this.initializeRoutes();
    }
    async AssignUsertoTask(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user.id;
            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: "Invalid task id" });
            }
            logger_1.logger.debug({ taskId, userId }, 'AssignUsertoTask called');
            const result = await this.taskAssignmentService.AssignUsertoTask(req.body, taskId, userId);
            return res.status(result.status_code || 201).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in AssignUsertoTask');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }
    async UpdatePermission(req, res) {
        try {
            const taskId = req.params.taskId;
            const userId = req.params.userId; // Get userId from URL params
            const requesterId = req.user.id;
            const permission = req.body?.permission;
            if (isNaN(Number(taskId)) || isNaN(Number(userId))) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id or user id',
                });
            }
            logger_1.logger.debug({ taskId, userId, requesterId, permission }, 'UpdatePermission called');
            // Validate required fields
            if (!permission) {
                return res.status(400).json({
                    status: false,
                    message: 'Permission is required',
                });
            }
            const result = await this.taskAssignmentService.UpdatePermission(permission, Number(taskId), Number(userId), requesterId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unstatus_codehandled error in UpdatePermission');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }
    async getUserTaskPermission(req, res) {
        try {
            let taskid = req.params.taskId;
            let userid = req.user.id;
            logger_1.logger.debug({ taskid, userid }, 'getUserTaskPermission called');
            if (isNaN(Number(taskid))) {
                return res.status(400).json({ status: false, message: "Invalid task id", data: null });
            }
            const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getUserTaskPermission');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }
    async removeUserFromTask(req, res) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user.id; //id of the user i.e ownerremoving the user
            const email = req.body.email; //id of the user to be removed
            logger_1.logger.debug({ taskId, requesterId, email }, 'removeUserFromTask called');
            if (isNaN(Number(taskId))) {
                return res.status(400).json({ status: false, message: "Invalid task id" });
            }
            const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId), email, requesterId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in removeUserFromTask');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }
    async getTaskAssignments(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const requesterId = req.user.id;
            logger_1.logger.debug({ taskId, requesterId }, 'getTaskAssignments called');
            if (isNaN(taskId)) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid task id" });
            }
            const { page, limit } = req.query;
            const result = await this.taskAssignmentService.getTaskAssignments(taskId, requesterId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getTaskAssignments');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }
    async getUserassignedtasks(req, res) {
        try {
            const userId = req.user.id; // Current user's own tasks
            logger_1.logger.debug({ userId }, 'getUserassignedtasks called');
            const result = await this.taskAssignmentService.getUserassignedtasks(userId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getUserassignedtasks');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }
    async getAssignmentsForOtherUser(req, res) {
        try {
            //retest this endpoint
            const requesterId = req.user.id;
            const targetUserId = req.params.userId;
            if (isNaN(Number(targetUserId)) || !targetUserId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid target user id',
                });
            }
            logger_1.logger.debug({ requesterId, targetUserId }, 'getAssignmentsForOtherUser called');
            const result = await this.taskAssignmentService.getAssignmentsForOtherUser(Number(targetUserId), requesterId);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getAssignmentsForOtherUser');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }
    async bulkAssignUsers(req, res) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user.id;
            if (isNaN(Number(taskId)) || !taskId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id',
                });
            }
            const assignments = req.body.assignments;
            logger_1.logger.debug({ taskId, requesterId, assignmentCount: assignments?.length }, 'bulkAssignUsers called');
            if (!Array.isArray(assignments)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid request format. "assignments" must be an array.',
                });
            }
            const result = await this.taskAssignmentService.bulkAssignUsers(assignments, Number(taskId), requesterId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in bulkAssignUsers');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }
    async TransferOwnership(req, res) {
        try {
            const taskId = Number(req.params.taskId);
            const presentOwnerId = req.user.id; // The user making the request
            const newOwnerEmail = req.body.newOwnerEmail; //new owner email
            if (isNaN(Number(taskId)) || !taskId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id',
                });
            }
            logger_1.logger.info({ taskId, presentOwnerId, newOwnerEmail }, 'TransferOwnership called');
            const result = await this.taskAssignmentService.TransferOwnership(taskId, presentOwnerId, newOwnerEmail);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in TransferOwnership');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/assign/:taskId', (0, validateDto_1.validateDto)(assign_task_dto_1.AssignTaskDTO), this.AssignUsertoTask.bind(this));
        this.router.put('/update/:taskId/:userId', (0, validateDto_1.validateDto)(updateAssign_task_dto_1.UpdateTaskPermissionDTO), this.UpdatePermission.bind(this));
        this.router.get('/permission/:taskId', this.getUserTaskPermission.bind(this));
        this.router.delete('/remove/:taskId', (0, validateDto_1.validateDto)(RemoveUserFromTask_dto_1.RemoveUserFromTaskDTO), this.removeUserFromTask.bind(this));
        this.router.get('/assignments/:taskId', this.getTaskAssignments.bind(this));
        this.router.get('/assignedtasks', this.getUserassignedtasks.bind(this));
        this.router.get('/assignments/user/:userId', this.getAssignmentsForOtherUser.bind(this));
        this.router.post('/bulkassign/:taskId', (0, validateDto_1.validateDto)(bulkAssignUsers_dto_1.BulkAssignTaskDTO), this.bulkAssignUsers.bind(this));
        this.router.put('/transfer/:taskId', (0, validateDto_1.validateDto)(transferofOwnership_dto_1.TransferOwnershipDTO), this.TransferOwnership.bind(this));
    }
}
exports.TaskAssignment_Controller = TaskAssignment_Controller;
