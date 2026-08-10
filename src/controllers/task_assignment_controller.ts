import { TaskAssignment_Service } from "../services/task_assignments_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";
import { logger } from "../lib/logger";
import { validateDto } from "../middlewares/validateDto";
import { AssignTaskDTO } from "../dto/assign_task_dto";
import { UpdateTaskPermissionDTO } from "../dto/updateAssign_task_dto";
import { BulkAssignTaskDTO } from "../dto/bulkAssignUsers_dto";
import { TransferOwnershipDTO } from "../dto/transferofOwnership_dto";


export class TaskAssignment_Controller {
    public router: Router;
    private taskAssignmentService: TaskAssignment_Service;

    constructor() {
        this.router = Router();
        this.taskAssignmentService = new TaskAssignment_Service();
        this.initializeRoutes();
    }

    public async AssignUsertoTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const userId = req.user!.id;

            if (isNaN(taskId)) {
                return res.status(400).json({ status: false, message: "Invalid task id" });
            }
            logger.debug({ taskId, userId }, 'AssignUsertoTask called');
            const result = await this.taskAssignmentService.AssignUsertoTask(req.body, taskId, userId);

            return res.status(result.status_code || 201).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in AssignUsertoTask');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }

    public async UpdatePermission(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const userId = req.params.userId; // Get userId from URL params
            const requesterId = req.user!.id;
            const permission = req.body?.permission;

            if (isNaN(Number(taskId)) || isNaN(Number(userId))) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id or user id',
                });
            }

            logger.debug({ taskId, userId, requesterId, permission }, 'UpdatePermission called');

            // Validate required fields
            if (!permission) {
                return res.status(400).json({
                    status: false,
                    message: 'Permission is required',
                });
            }

            const result = await this.taskAssignmentService.UpdatePermission(permission,
                Number(taskId), Number(userId), requesterId);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unstatus_codehandled error in UpdatePermission');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }

    public async getUserTaskPermission(req: AuthenticatedRequest, res: Response) {
        try {
            let taskid = req.params.taskId;
            let userid = req.user!.id;
            logger.debug({ taskid, userid }, 'getUserTaskPermission called');

            if (isNaN(Number(taskid))) {
                return res.status(400).json({ status: false, message: "Invalid task id", data: null });
            }
            const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);

            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getUserTaskPermission');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }

    public async removeUserFromTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user!.id; //id of the user i.e ownerremoving the user
            const userId = req.body.userId; //id of the user to be removed
            logger.debug({ taskId, requesterId, userId }, 'removeUserFromTask called');

            if (isNaN(Number(taskId))) {
                return res.status(400).json({ status: false, message: "Invalid task id" });

            }
            const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId),
                Number(userId), requesterId);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in removeUserFromTask');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }

    public async getTaskAssignments(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = Number(req.params.taskId);
            const requesterId = req.user!.id;
            logger.debug({ taskId, requesterId }, 'getTaskAssignments called');

            if (isNaN(taskId)) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid task id" });
            }
            const { page, limit } = req.query;

            const result = await this.taskAssignmentService.getTaskAssignments(
                taskId,
                requesterId,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getTaskAssignments');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }

    public async getUserassignedtasks(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id; // Current user's own tasks
            logger.debug({ userId }, 'getUserassignedtasks called');
            const result = await this.taskAssignmentService.getUserassignedtasks(userId);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getUserassignedtasks');
            return res.status(500).json({ status_code: 500, status: false, message: 'Internal server error' });
        }
    }

    public async getAssignmentsForOtherUser(req: AuthenticatedRequest, res: Response) {
        try {
            //retest this endpoint
            const requesterId = req.user!.id;
            const targetUserId = req.params.userId;

            if (isNaN(Number(targetUserId)) || !targetUserId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid target user id',
                });
            }
            logger.debug({ requesterId, targetUserId }, 'getAssignmentsForOtherUser called');

            const result = await this.taskAssignmentService.getAssignmentsForOtherUser(Number(targetUserId), requesterId);
            return res.status(200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getAssignmentsForOtherUser');
            return res.status(500).json({ status: false, message: 'Internal server error' });
        }
    }

    public async bulkAssignUsers(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user!.id;

            if (isNaN(Number(taskId)) || !taskId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id',
                });
            }
            const assignments = req.body.assignments
            logger.debug({ taskId, requesterId, assignmentCount: assignments?.length }, 'bulkAssignUsers called');

            if (!Array.isArray(assignments)) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid request format. "assignments" must be an array.',
                });
            }

            const result = await this.taskAssignmentService.bulkAssignUsers(
                assignments, Number(taskId), requesterId);

            return res.status(200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in bulkAssignUsers');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async TransferOwnership(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requestUserId = req.user!.id; // The user making the request
            const presentOwnerId = req.body.presentOwnerId; // Usually the same as requestUserId
            const newOwnerId = req.body.newOwnerId;

            if (isNaN(Number(taskId)) || !taskId) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid task id',
                });
            }

            logger.info({ taskId, requestUserId, presentOwnerId, newOwnerId }, 'TransferOwnership called');

            const result = await this.taskAssignmentService.TransferOwnership(requestUserId, Number(taskId), presentOwnerId, newOwnerId);
            return res.status(200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in TransferOwnership');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    private initializeRoutes() {
        this.router.post('/assign/:taskId', validateDto(AssignTaskDTO), this.AssignUsertoTask.bind(this));
        this.router.put('/update/:taskId/:userId', validateDto(UpdateTaskPermissionDTO), this.UpdatePermission.bind(this));
        this.router.get('/permission/:taskId', this.getUserTaskPermission.bind(this));
        this.router.delete('/remove/:taskId', this.removeUserFromTask.bind(this));
        this.router.get('/assignments/:taskId', this.getTaskAssignments.bind(this));
        this.router.get('/assignedtasks', this.getUserassignedtasks.bind(this));
        this.router.get('/assignments/user/:userId', this.getAssignmentsForOtherUser.bind(this));
        this.router.post('/bulkassign/:taskId', validateDto(BulkAssignTaskDTO), this.bulkAssignUsers.bind(this));
        this.router.put('/transfer/:taskId', validateDto(TransferOwnershipDTO), this.TransferOwnership.bind(this));
    }
}