import { TaskAssignment_Service } from "../services/task_assignments_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";
import { logger } from "../lib/logger";
import { validateDto } from "../middlewares/validateDto";
import { AssignTaskDTO } from "../dto/assign_task_dto";


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
            const taskId = req.params.taskId;
            const userId = req.user!.id;
            logger.debug({ taskId, userId }, 'AssignUsertoTask called');
            const result = await this.taskAssignmentService.AssignUsertoTask(req.body, Number(taskId), userId);

            return res.status(result.statusCode).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in AssignUsertoTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async UpdatePermission(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const userId = req.params.userId; // Get userId from URL params
            const requesterId = req.user!.id;
            const permission = req.body?.permission;

            logger.debug({ taskId, userId, requesterId, permission }, 'UpdatePermission called');

            // Validate required fields
            if (!permission) {
                return res.status(400).json({
                    status_code: 400,
                    status: 'failed',
                    message: 'Permission is required',
                    data: null
                });
            }

            const result = await this.taskAssignmentService.UpdatePermission(permission,
                Number(taskId), Number(userId), requesterId);
            return res.status(result.).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unstatus_codehandled error in UpdatePermission');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getUserTaskPermission(req: AuthenticatedRequest, res: Response) {
        try {
            let taskid = req.params.taskId;
            let userid = req.user!.id;
            logger.debug({ taskid, userid }, 'getUserTaskPermission called');
            const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);
            let response = {
                status_code: '200',
                message: 'User permission retrieved successfully',
                data: result
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getUserTaskPermission');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async removeUserFromTask(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user!.id; //id of the user i.e ownerremoving the user
            const userId = req.body.userId; //id of the user to be removed
            logger.debug({ taskId, requesterId, userId }, 'removeUserFromTask called');

            const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId),
                Number(userId), requesterId);
            let response = {
                status_code: '200',
                message: 'User removed from task successfully',
                data: result
            }

            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in removeUserFromTask');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getTaskAssignments(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user!.id;
            logger.debug({ taskId, requesterId }, 'getTaskAssignments called');
            const result = await this.taskAssignmentService.getTaskAssignments(Number(taskId), requesterId);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getTaskAssignments');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getUserassignedtasks(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id; // Current user's own tasks
            logger.debug({ userId }, 'getUserassignedtasks called');
            const result = await this.taskAssignmentService.getUserassignedtasks(userId);
            return res.status(result.status_code).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getUserassignedtasks');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getAssignmentsForOtherUser(req: AuthenticatedRequest, res: Response) {
        try {
            //retest this endpoint
            const requesterId = req.user!.id;
            const targetUserId = req.params.userId;
            logger.debug({ requesterId, targetUserId }, 'getAssignmentsForOtherUser called');

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
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getAssignmentsForOtherUser');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async bulkAssignUsers(req: AuthenticatedRequest, res: Response) {
        try {
            const taskId = req.params.taskId;
            const requesterId = req.user!.id;

            const assignments = req.body.assignments
            logger.debug({ taskId, requesterId, assignmentCount: assignments?.length }, 'bulkAssignUsers called');

            if (!Array.isArray(assignments)) {
                return res.status(400).json({
                    status_code: 400,
                    status: 'failed',
                    message: 'Invalid request format. "assignments" must be an array.',
                    data: null
                });
            }

            const result = await this.taskAssignmentService.bulkAssignUsers(
                assignments, Number(taskId), requesterId);

            return res.status(result.status_code || 200).json(result);
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

            logger.info({ taskId, requestUserId, presentOwnerId, newOwnerId }, 'TransferOwnership called');

            const result = await this.taskAssignmentService.TransferOwnership(requestUserId, Number(taskId), presentOwnerId, newOwnerId);
            return res.status(result.status_code || 200).json(result);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in TransferOwnership');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    private initializeRoutes() {
        this.router.post('/assign/:taskId', validateDto(AssignTaskDTO), this.AssignUsertoTask.bind(this));
        this.router.put('/update/:taskId/:userId', validateDto(AssignTaskDTO), this.UpdatePermission.bind(this));
        this.router.get('/permission/:taskId', this.getUserTaskPermission.bind(this));
        this.router.delete('/remove/:taskId', this.removeUserFromTask.bind(this));
        this.router.get('/assignments/:taskId', this.getTaskAssignments.bind(this));
        this.router.get('/assignedtasks', this.getUserassignedtasks.bind(this));
        this.router.get('/assignments/user/:userId', this.getAssignmentsForOtherUser.bind(this));
        this.router.post('/bulkassign/:taskId', validateDto(AssignTaskDTO), this.bulkAssignUsers.bind(this));
        this.router.put('/transfer/:taskId', validateDto(AssignTaskDTO), this.TransferOwnership.bind(this));
    }
}