
import { Router, Request, Response } from 'express';
import { Project_service } from '../services/projects/project_service';
import { AuthenticatedRequest } from '../types/express/auth-request';

export class Project_Controller {
    public router: Router;
    private Project_service: Project_service;

    constructor() {
        this.router = Router();
        this.Project_service = new Project_service();
        this.initializeRoutes();
    }

    public async createProject(req: AuthenticatedRequest, res: Response) {
        const userId = req.user!.id
        const project = await this.Project_service.CreateProject(req.body, userId);
        let response = {
            status_code: '201',
            message: 'Project created successfully',
            data: project

        }
        return res.json(response);
    }

    public async getAllProjects(req: AuthenticatedRequest, res: Response) {
        const userid = req.user!.id;
        const project = await this.Project_service.getAllProjects(userid);
        console.log("Auth user", req.user)

        let response = {
            status_code: '200',
            message: 'Projects retrieved successfully',
            data: project

        }
        return res.json(response);


    }

    public async getProjectById(req: AuthenticatedRequest, res: Response) {
        const userid = req.user!.id;
        const projectId = req.params.projectId;
        console.log("GET PROJECT - User ID:", userid, "Project ID:", projectId);
        const project = await this.Project_service.fetchProjectById(Number(projectId), userid);
        console.log("Service result:", project);
        console.log("About to send response...");

        let response = {
            status_code: '200',
            message: 'Project retrieved successfully',
            data: project


        }
         console.log("=== CONTROLLER END ===");
        return res.json(response);
        
    }

    public async UpdateProject(req: AuthenticatedRequest, res: Response) {
        const projectId = req.params.projectId;
        const userId = req.user!.id;
        const result = await this.Project_service.updateProject(Number(projectId), userId, req.body);

        let response = {
            status_code: '200',
            message: 'Project updated successfully',
            data: result
        }

        return res.json(response);

    }

    public async DeleteProject(req: AuthenticatedRequest, res: Response) {
        // console.log("we start here")
        const projectId = req.params.projectId;
        // console.log("Project ID:", projectId)
        const userId = req.user!.id;
        const result = await this.Project_service.DeleteProject(Number(projectId), userId);
        console.log("GET PROJECT - User ID:", userId, "Project ID:", projectId);

        let response = {
            status_code: '200',
            message: 'Project deleted successfully',
            data: result
        }

        return res.json(response);


    }


    private initializeRoutes() {
        this.router.post('/create', this.createProject.bind(this));
        this.router.get('/all', this.getAllProjects.bind(this));
        this.router.get('/:projectId', this.getProjectById.bind(this));
        this.router.put('/:projectId/update', this.UpdateProject.bind(this));
        this.router.delete('/:projectId/delete', this.DeleteProject.bind(this));
    

    }

}