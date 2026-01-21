import { Router, Request, Response } from 'express';
import { Task_Service } from '../services/task_service';
import { AuthenticatedRequest } from '../types/express/auth-request';

export class Task_Controller {
    public router: Router;
    private Task_Service: Task_Service;

    constructor() {
        this.router = Router();
        this.Task_Service = new Task_Service();
        this.initializeRoutes();
    }

    public async createTask(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id
        const projectId = req.body.projectId;
        const task = await this.Task_Service.createTask(req.body, projectId, userId);
        let response = {
            status_code: '201',
            message: 'Task created successfully',
            data: task

        }
        return res.json(response);
    }

    public async getAllTasks(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const projectId = req.params.projectId;
        const task = await this.Task_Service.getAllTasks(Number(projectId), userId);
        console.log("Auth user", req.user)

        let response = {
            status_code: '200',
            message: 'Tasks retrieved successfully',
            data: task

        }
        return res.json(response);


    }

    public async getTaskById(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id;
        const taskId = req.params.taskId;
        // console.log("GET TASK - User ID:", userId, "Task ID:", taskId);
        const task = await this.Task_Service.getTaskById(Number(taskId), userId);
        console.log("Service result:", task);
        console.log("About to send response...");

        let response = {
            status_code: '200',
            message: 'Task retrieved successfully',
            data: task


        }
        //  console.log("=== CONTROLLER END ===");
        return res.json(response);
        
    }

    public async UpdateTask(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const userId = req.user!.id;
        const result = await this.Task_Service.updateTask(Number(taskId), userId, req.body);

        let response = {
            status_code: '200',
            message: 'Task updated successfully',
            data: result
        }

        return res.json(response);

    }

    public async DeleteTask(req: AuthenticatedRequest, res: Response) {
        // console.log("we start here")
        const taskId = req.params.taskId;
        // console.log("Task ID:", taskId)
        const userId = req.user!.id;
        const result = await this.Task_Service.deleteTask(Number(taskId), userId);
        console.log("GET TASK - User ID:", userId, "Task ID:", taskId);

        let response = {
            status_code: '200',
            message: 'Task deleted successfully',
            data: result
        }

        return res.json(response);


    }

    public async restoreTask(req: AuthenticatedRequest, res: Response) {
        const taskId = req.params.taskId;
        const userId = req.user!.id;
        const result = await this.Task_Service.restoreTask(Number(taskId), userId);

        let response = {
            status_code: '200',
            message: 'Task restored successfully',
            data: result
        }
        return res.json(response);

    }

    private initializeRoutes() {
        this.router.post('/create', this.createTask.bind(this));
        this.router.get('/all/:projectId', this.getAllTasks.bind(this));
        this.router.get('/:taskId', this.getTaskById.bind(this));
        this.router.put('/:taskId/update', this.UpdateTask.bind(this));
        this.router.delete('/:taskId/delete', this.DeleteTask.bind(this));
        this.router.put('/:taskId/restore', this.restoreTask.bind(this));
    

    
    }
}