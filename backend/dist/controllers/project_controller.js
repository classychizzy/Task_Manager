"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project_Controller = void 0;
const express_1 = require("express");
const project_service_1 = require("../services/project_service");
const validateDto_1 = require("../middlewares/validateDto");
const logger_1 = require("../lib/logger");
const create_project_dto_1 = require("../dto/create_project_dto");
const updateproject_dto_1 = require("../dto/updateproject_dto");
class Project_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.Project_service = new project_service_1.Project_service();
        this.initializeRoutes();
    }
    async createProject(req, res) {
        try {
            const userId = req.user.id;
            logger_1.logger.debug({ userId }, 'createProject called');
            const project = await this.Project_service.CreateProject(req.body, userId);
            return res.status(project.status_code || 201).json(project);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in createProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getAllProjects(req, res) {
        try {
            const userid = req.user.id;
            logger_1.logger.debug({ userId: userid }, 'getAllProjects called');
            const { page, limit } = req.query;
            const projectResponse = await this.Project_service.getAllProjects(userid, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
            return res.status(projectResponse.status_code || 200).json(projectResponse);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getAllProjects');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async getProjectById(req, res) {
        try {
            const userid = req.user.id;
            const projectId = req.params.projectId;
            logger_1.logger.debug({ userId: userid, projectId }, 'getProjectById called');
            if (isNaN(Number(projectId))) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid project id" });
            }
            const project = await this.Project_service.fetchProjectById(Number(projectId), userid);
            return res.status(project.status_code || 200).json(project);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in getProjectById');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async UpdateProject(req, res) {
        try {
            const projectId = req.params.projectId;
            const userId = req.user.id;
            logger_1.logger.debug({ projectId, userId }, 'UpdateProject called');
            if (isNaN(Number(projectId))) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid project id" });
            }
            const result = await this.Project_service.updateProject(Number(projectId), userId, req.body);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in UpdateProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async DeleteProject(req, res) {
        try {
            const projectId = req.params.projectId;
            const userId = req.user.id;
            logger_1.logger.debug({ projectId, userId }, 'DeleteProject called');
            if (isNaN(Number(projectId))) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid project id" });
            }
            const result = await this.Project_service.DeleteProject(Number(projectId), userId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in DeleteProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    async restoreProject(req, res) {
        try {
            const projectid = req.params.projectId;
            const userId = req.user.id;
            logger_1.logger.debug({ projectId: projectid, userId }, 'restoreProject called');
            if (isNaN(Number(projectid))) {
                return res.status(400).json({ status_code: 400, status: false, message: "Invalid project id" });
            }
            const result = await this.Project_service.restoreProject(Number(projectid), userId);
            return res.status(result.status_code || 200).json(result);
        }
        catch (error) {
            logger_1.logger.error({ err: error }, 'Unhandled error in restoreProject');
            return res.status(500).json({ status: 'failed', message: 'Internal server error' });
        }
    }
    initializeRoutes() {
        this.router.post('/create', (0, validateDto_1.validateDto)(create_project_dto_1.CreateProjectDTO), this.createProject.bind(this));
        this.router.get('/all', this.getAllProjects.bind(this));
        this.router.get('/:projectId', this.getProjectById.bind(this));
        this.router.put('/:projectId/update', (0, validateDto_1.validateDto)(updateproject_dto_1.UpdateProjectDTO), this.UpdateProject.bind(this));
        this.router.delete('/:projectId/delete', this.DeleteProject.bind(this));
        this.router.put('/:projectId/restore', this.restoreProject.bind(this));
    }
}
exports.Project_Controller = Project_Controller;
