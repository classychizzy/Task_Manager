import { Router, Request, Response } from 'express';
import { TaskAssignment_Service } from '../services/task_assignments_service';
import { AuthenticatedRequest } from '../types/express/auth-request';

export class TaskAssignment_Controller {
    public router: Router;
    private TaskAssignment_Service: TaskAssignment_Service;

    constructor() {
        this.router = Router();
        this.TaskAssignment_Service = new TaskAssignment_Service();
        this.initializeRoutes();
    }

    public async assignTask(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const taskId = req.body.taskId;
        // Assuming req.body contains the TaskAssignmentDTO structure
        const assignment = await this.TaskAssignment_Service.assignTask(req.body, Number(taskId),  Number(userId));
        console.log(assignment);

        let response = {
            status_code: 200,
            message: 'Task assigned successfully',
            data: assignment
        }
        return res.json(response);
    }

    public async getAssignments(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const taskId = req.params.taskId;
        const result = await this.TaskAssignment_Service.getAssignmentsByTaskId(Number(taskId), userId);

        let response = {
            status_code: '200',
            message: 'Assignments retrieved successfully',
            data: result
        }
        return res.json(response);
    }

    public async DeleteAssignment(req: AuthenticatedRequest, res: Response) {
        const assignmentId = req.params.assignmentId;
        const userId = req.user!.id;
        const result = await this.TaskAssignment_Service.deleteAssignment(Number(assignmentId), userId);

        let response = {
            status_code: '200',
            message: 'Assignment deleted successfully',
            data: result
        }
        return res.json(response);
    }

    private initializeRoutes() {
        this.router.post('/tasks/:taskId/assignments', this.assignTask.bind(this));
        this.router.get('/:taskId', this.getAssignments.bind(this));
        this.router.delete('/:assignmentId/delete', this.DeleteAssignment.bind(this));
    }
}