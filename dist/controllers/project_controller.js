"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project_Controller = void 0;
const express_1 = require("express");
const project_service_1 = require("../services/projects/project_service");
class Project_Controller {
    constructor() {
        this.router = (0, express_1.Router)();
        this.Project_service = new project_service_1.Project_service();
        this.initializeRoutes();
    }
    async createProject(req, res) {
        const userId = req.user.id;
        const project = await this.Project_service.CreateProject(req.body, userId);
        let response = {
            status_code: '201',
            message: 'Project created successfully',
            data: project
        };
        return res.json(response);
    }
    async getAllProjects(req, res) {
        const userid = req.user.id;
        const project = await this.Project_service.getAllProjects(userid);
        console.log("Auth user", req.user);
        let response = {
            status_code: '200',
            message: 'Projects retrieved successfully',
            data: project
        };
        return res.json(response);
    }
    async getProjectById(req, res) {
        const userid = req.user.id;
        const projectId = req.params.projectId;
        console.log("GET PROJECT - User ID:", userid, "Project ID:", projectId);
        const project = await this.Project_service.fetchProjectById(Number(projectId), userid);
        console.log("Service result:", project);
        console.log("About to send response...");
        let response = {
            status_code: '200',
            message: 'Project retrieved successfully',
            data: project
        };
        console.log("=== CONTROLLER END ===");
        return res.json(response);
    }
    async UpdateProject(req, res) {
        const projectId = req.params.projectId;
        const userId = req.user.id;
        const result = await this.Project_service.updateProject(Number(projectId), userId, req.body);
        let response = {
            status_code: '200',
            message: 'Project updated successfully',
            data: result
        };
        return res.json(response);
    }
    async DeleteProject(req, res) {
        // console.log("we start here")
        const projectId = req.params.projectId;
        // console.log("Project ID:", projectId)
        const userId = req.user.id;
        const result = await this.Project_service.DeleteProject(Number(projectId), userId);
        console.log("GET PROJECT - User ID:", userId, "Project ID:", projectId);
        let response = {
            status_code: '200',
            message: 'Project deleted successfully',
            data: result
        };
        return res.json(response);
    }
    async restoreProject(req, res) {
        console.log("begin");
        const projectid = req.params.projectId;
        console.log("Project ID:", projectid);
        const userId = req.user.id;
        const result = await this.Project_service.restoreProject(Number(projectid), userId);
        console.log(result);
        let response = {
            status_code: '200',
            message: 'Project restored successfully',
            data: result
        };
        return res.json(response);
    }
    initializeRoutes() {
        this.router.post('/create', this.createProject.bind(this));
        this.router.get('/all', this.getAllProjects.bind(this));
        this.router.get('/:projectId', this.getProjectById.bind(this));
        this.router.put('/:projectId/update', this.UpdateProject.bind(this));
        this.router.delete('/:projectId/delete', this.DeleteProject.bind(this));
        this.router.put('/:projectId/restore', this.restoreProject.bind(this));
    }
}
exports.Project_Controller = Project_Controller;
