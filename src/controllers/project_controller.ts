import { Router, Request, Response } from 'express';
import { Project_service } from '../services/project_service'
import { AuthenticatedRequest } from '../types/express/auth-request';
import { validateDto } from '../middlewares/validateDto';
import { logger } from '../lib/logger';
import { CreateProjectDTO } from '../dto/create_project_dto';
import { UpdateProjectDTO } from '../dto/updateproject_dto';

export class Project_Controller {
    public router: Router;
    private Project_service: Project_service;

    constructor() {
        this.router = Router();
        this.Project_service = new Project_service();
        this.initializeRoutes();
    }

    public async createProject(req: AuthenticatedRequest, res: Response) {
        try {
            const userId = req.user!.id
            logger.debug({ userId }, 'createProject called');
            const project = await this.Project_service.CreateProject(req.body, userId);
            let response = {
                status_code: '201',
                message: 'Project created successfully',
                data: project

            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in createProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getAllProjects(req: AuthenticatedRequest, res: Response) {
        try {
            const userid = req.user!.id;
            logger.debug({ userId: userid }, 'getAllProjects called');
            const { page, limit } = req.query;

            const projectResponse = await this.Project_service.getAllProjects(
                userid,
                page ? Number(page) : undefined,
                limit ? Number(limit) : undefined
            );

            return res.json(projectResponse);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getAllProjects');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async getProjectById(req: AuthenticatedRequest, res: Response) {
        try {
            const userid = req.user!.id;
            const projectId = req.params.projectId;
            logger.debug({ userId: userid, projectId }, 'getProjectById called');
            const project = await this.Project_service.fetchProjectById(Number(projectId), userid);

            let response = {
                status_code: '200',
                message: 'Project retrieved successfully',
                data: project
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in getProjectById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async UpdateProject(req: AuthenticatedRequest, res: Response) {
        try {
            const projectId = req.params.projectId;
            const userId = req.user!.id;
            logger.debug({ projectId, userId }, 'UpdateProject called');
            const result = await this.Project_service.updateProject(Number(projectId), userId, req.body);

            let response = {
                status_code: '200',
                message: 'Project updated successfully',
                data: result
            }

            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in UpdateProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async DeleteProject(req: AuthenticatedRequest, res: Response) {
        try {
            const projectId = req.params.projectId;
            const userId = req.user!.id;
            logger.debug({ projectId, userId }, 'DeleteProject called');
            const result = await this.Project_service.DeleteProject(Number(projectId), userId);

            let response = {
                status_code: '200',
                message: 'Project deleted successfully',
                data: result
            }

            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in DeleteProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }

    public async restoreProject(req: AuthenticatedRequest, res: Response) {
        try {
            const projectid = req.params.projectId;
            const userId = req.user!.id;
            logger.debug({ projectId: projectid, userId }, 'restoreProject called');
            const result = await this.Project_service.restoreProject(Number(projectid), userId);
            let response = {
                status_code: '200',
                message: 'Project restored successfully',
                data: result
            }
            return res.json(response);
        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in restoreProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }


    private initializeRoutes() {
        this.router.post('/create', validateDto(CreateProjectDTO), this.createProject.bind(this));
        this.router.get('/all', this.getAllProjects.bind(this));
        this.router.get('/:projectId', this.getProjectById.bind(this));
        this.router.put('/:projectId/update', validateDto(UpdateProjectDTO), this.UpdateProject.bind(this));
        this.router.delete('/:projectId/delete', this.DeleteProject.bind(this));
        this.router.put('/:projectId/restore', this.restoreProject.bind(this));


    }

}