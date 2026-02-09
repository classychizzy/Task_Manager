import { TaskAssignment_Service } from "../services/task_assignments_service";
import { Router, Response } from 'express';
import { AuthenticatedRequest } from "../types/express/auth-request";
import { stat } from "fs";


export class TaskAssignment_Controller {
    public router: Router;
    private taskAssignmentService: TaskAssignment_Service;

    constructor() {
        this.router = Router();
        this.taskAssignmentService = new TaskAssignment_Service();
        this.initializeRoutes();
    }

    public async AssignUsertoTask(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const userId = req.user!.id;
        const result = await this.taskAssignmentService.AssignUsertoTask(req.body, Number(taskId), userId);

        return res.status(result.status_code).json(result);
    }

    public async UpdatePermission(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const userId = req.params.userId; // Get userId from URL params
        const requesterId = req.user!.id;
        const permission = req.body?.permission;

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
        return res.status(result.status_code).json(result);
    }

    public async getUserTaskPermission(req: AuthenticatedRequest, res: Response) {
        let taskid = req.params.taskId;
        let userid = req.user!.id;
        const result = await this.taskAssignmentService.getUserTaskPermission(Number(taskid), userid);
        let response = {
            status_code: '201',
            message: 'User permission retrieved successfully',
            data: result

        }
        return res.json(response);

    }

    public async removeUserFromTask(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const requesterId = req.user!.id; //id of the user i.e ownerremoving the user
        const userId = req.body.userId; //id of the user to be removed
        // console.log('Request body:', req.body);
        // console.log('userId value:', req.body.userId);
        // console.log('userId parsed:', Number(req.body.userId));
        const result = await this.taskAssignmentService.removeUserFromTask(Number(taskId),
            Number(userId), requesterId);
        let response = {
            status_code: '201',
            message: 'User removed from task successfully',
            data: result
        }

        return res.json(response);


    }

    public async getTaskAssignments(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const requesterId = req.user!.id;
        const result = await this.taskAssignmentService.getTaskAssignments(Number(taskId), requesterId);
        return res.status(result.status_code).json(result);
    }

    public async getUserassignedtasks(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id; // Current user's own tasks
        const result = await this.taskAssignmentService.getUserassignedtasks(userId);
        return res.status(result.status_code).json(result);
    }

    public async getAssignmentsForOtherUser(req: AuthenticatedRequest, res: Response) {
        //retest this endpoint
        const requesterId = req.user!.id;
        const targetUserId = req.params.userId;
        console.log(targetUserId);
        console.log(requesterId);

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

    public async bulkAssignUsers(req: AuthenticatedRequest, res: Response) {


        const taskId = req.params.taskId;
        const requesterId = req.user!.id;

        const assignments = req.body.assignments

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

    }

    public async TransferOwnership(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const presentOwnerId = req.user!.id;
        const newOwnerId = req.body.newOwnerId;

        const result = await this.taskAssignmentService.TransferOwnership(newOwnerId, Number(taskId), presentOwnerId, newOwnerId);
        return res.status(result.status_code || 200).json(result);
    }

    private initializeRoutes() {
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